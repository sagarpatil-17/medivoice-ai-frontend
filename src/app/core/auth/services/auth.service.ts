import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, finalize, map, of, shareReplay, switchMap, tap } from 'rxjs';

import { environment } from '../../../../environments/environment';
import {
    AuthUser,
    LoginRequest,
    LoginResponse,
    RefreshResponse,
} from '../models/auth.model';

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    private readonly http = inject(HttpClient);

    private readonly apiUrl = `${environment.apiUrl}/auth`;

    private readonly accessTokenState = signal<string | null>(null);
    private readonly userState = signal<AuthUser | null>(null);

    private refreshRequest$: Observable<RefreshResponse> | null = null;

    readonly accessToken = this.accessTokenState.asReadonly();
    readonly currentUser = this.userState.asReadonly();

    readonly isAuthenticated = computed(
        () => !!this.accessTokenState(),
    );

    readonly userRole = computed(
        () => this.userState()?.role ?? null,
    );

    login(credentials: LoginRequest): Observable<AuthUser> {
        return this.http
            .post<LoginResponse>(`${this.apiUrl}/login`, credentials, {
                withCredentials: true,
            })
            .pipe(
                tap((response) => {
                    this.accessTokenState.set(response.accessToken);
                    this.userState.set(response.user);
                }),
                map((response) => response.user),
            );
    }

    refreshAccessToken(): Observable<RefreshResponse> {
        if (!this.refreshRequest$) {
            this.refreshRequest$ = this.http
                .post<RefreshResponse>(
                    `${this.apiUrl}/refresh`,
                    {},
                    { withCredentials: true },
                )
                .pipe(
                    tap((response) => {
                        this.accessTokenState.set(response.accessToken);
                    }),
                    shareReplay({
                        bufferSize: 1,
                        refCount: false,
                    }),
                    finalize(() => {
                        this.refreshRequest$ = null;
                    }),
                );
        }

        return this.refreshRequest$;
    }

    restoreSession(): Observable<void> {
        return this.refreshAccessToken().pipe(
            switchMap(() => this.loadCurrentUser()),
            map(() => undefined),
            catchError(() => {
                this.clearAuthState();
                return of(undefined);
            }),
        );
    }

    loadCurrentUser(): Observable<AuthUser> {
        return this.http
            .get<AuthUser>(`${this.apiUrl}/me`)
            .pipe(
                tap((user) => this.userState.set(user)),
            );
    }

    logout(): Observable<void> {
        return this.http
            .post<void>(
                `${this.apiUrl}/logout`,
                {},
                { withCredentials: true },
            )
            .pipe(
                catchError(() => of(undefined)),
                tap(() => this.clearAuthState()),
                map(() => undefined),
            );
    }

    clearAuthState(): void {
        this.accessTokenState.set(null);
        this.userState.set(null);
    }
}