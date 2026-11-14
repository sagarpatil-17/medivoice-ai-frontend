import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';
import { map } from 'rxjs';

export const authGuard: CanActivateFn = () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (authService.isAuthenticated()) {
        return true;
    }

    return authService.waitForInitialization().pipe(
        map(() =>
            authService.isAuthenticated()
                ? true
                : router.createUrlTree(['/login'])
        )
    );
};