
import {
    computed,
    inject,
    Injectable,
    signal,
} from '@angular/core';

import { HttpClient } from '@angular/common/http';

import {
    Observable,
    ReplaySubject,
    catchError,
    finalize,
    map,
    of,
    shareReplay,
    switchMap,
    take,
    tap,
} from 'rxjs';

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

    private readonly initializingState = signal(true);

    private readonly initializationSubject = new ReplaySubject<void>(1);

    private refreshRequest$: Observable<RefreshResponse> | null = null;

    private restoreSessionRequest$: Observable<void> | null = null;

    readonly accessToken = this.accessTokenState.asReadonly();

    readonly currentUser = this.userState.asReadonly();

    readonly isInitializing = this.initializingState.asReadonly();

    readonly isAuthenticated = computed(
        () => !!this.accessTokenState(),
    );

    readonly userRole = computed(
        () => this.userState()?.role ?? null,
    );

    // Login
    login(credentials: LoginRequest): Observable<AuthUser> {
        return this.http
            .post<LoginResponse>(
                `${this.apiUrl}/login`,
                credentials,
                { withCredentials: true },
            )
            .pipe(
                tap((response) => {
                    this.accessTokenState.set(response.accessToken);
                    this.userState.set(response.user);

                    this.finishInitialization();
                }),
                map((response) => response.user),
            );
    }

    // Refresh access token - single flight
    refreshAccessToken(): Observable<RefreshResponse> {
        if (!this.refreshRequest$) {
            const request$ = this.http
                .post<RefreshResponse>(
                    `${this.apiUrl}/refresh`,
                    {},
                    { withCredentials: true },
                )
                .pipe(
                    tap((response) => {
                        this.accessTokenState.set(response.accessToken);
                    }),
                    finalize(() => {
                        this.refreshRequest$ = null;
                    }),
                    shareReplay({
                        bufferSize: 1,
                        refCount: false,
                    }),
                );

            this.refreshRequest$ = request$;
        }

        return this.refreshRequest$;
    }

    // Restore session in background
    restoreSession(): Observable<void> {
        if (this.restoreSessionRequest$) {
            return this.restoreSessionRequest$;
        }

        const request$ = this.refreshAccessToken().pipe(
            switchMap(() => this.loadCurrentUser()),

            map(() => undefined),

            catchError(() => {
                this.clearAuthState();
                return of(undefined);
            }),

            finalize(() => {
                this.finishInitialization();
            }),

            shareReplay({
                bufferSize: 1,
                refCount: false,
            }),
        );

        this.restoreSessionRequest$ = request$;

        return request$;
    }

    // Wait until initial session restoration finishes
    waitForInitialization(): Observable<void> {
        if (!this.initializingState()) {
            return of(undefined);
        }

        return this.initializationSubject.pipe(
            take(1),
        );
    }

    // Load logged-in user
    loadCurrentUser(): Observable<AuthUser> {
        return this.http
            .get<AuthUser>(`${this.apiUrl}/me`)
            .pipe(
                tap((user) => {
                    this.userState.set(user);
                }),
            );
    }

    // Logout
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

    // Clear authentication state
    clearAuthState(): void {
        this.accessTokenState.set(null);
        this.userState.set(null);
    }

    // Finish application initialization once
    private finishInitialization(): void {
        if (!this.initializingState()) {
            return;
        }

        this.initializingState.set(false);

        this.initializationSubject.next();
        this.initializationSubject.complete();
    }

    googleLogin(credential: string): Observable<AuthUser> {
        return this.http.post<LoginResponse>(
            `${this.apiUrl}/google`,
            { credential },
            { withCredentials: true },
        ).pipe(
            tap((response) => {
                this.accessTokenState.set(response.accessToken);
                this.userState.set(response.user);
                this.finishInitialization();
            }),
            map((response) => response.user),
        );
    }
}