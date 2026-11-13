
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';

import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const authService = inject(AuthService);

    const isAuthEndpoint =
        req.url.includes('/auth/login') ||
        req.url.includes('/auth/refresh') ||
        req.url.includes('/auth/logout');

    const token = authService.accessToken();

    const request = req.clone({
        withCredentials: true,
        ...(token && !isAuthEndpoint
            ? {
                setHeaders: {
                    Authorization: `Bearer ${token}`,
                },
            }
            : {}),
    });

    return next(request).pipe(
        catchError((error) => {
            if (error.status !== 401 || isAuthEndpoint || !token) {
                return throwError(() => error);
            }

            return authService.refreshAccessToken().pipe(
                switchMap((response) => {
                    const retryRequest = req.clone({
                        withCredentials: true,
                        setHeaders: {
                            Authorization: `Bearer ${response.accessToken}`,
                        },
                    });

                    return next(retryRequest);
                }),
                catchError((refreshError) => {
                    authService.clearAuthState();
                    return throwError(() => refreshError);
                }),
            );
        }),
    );
};
