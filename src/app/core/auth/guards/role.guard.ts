import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/auth.model';

export const roleGuard: CanActivateFn = (route) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const allowedRoles = route.data['roles'] as UserRole[];
    const currentRole = authService.currentUser()?.role;

    if (currentRole && allowedRoles.includes(currentRole)) {
        return true;
    }

    return router.createUrlTree(['/']);
};