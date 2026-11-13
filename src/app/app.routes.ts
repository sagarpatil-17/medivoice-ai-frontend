
import { Routes } from '@angular/router';
import { authGuard } from './core/auth/guards/auth.guard';

export const routes: Routes = [
    {
        path: 'login',
        loadComponent: () =>
            import('./features/auth/pages/login/login')
                .then(m => m.Login),
    },
    {
        path: '',
        canActivate: [authGuard],
        loadComponent: () =>
            import('./layouts/dashboard-layout/dashboard-layout')
                .then(m => m.DashboardLayout),
        children: [
            {
                path: '',
                pathMatch: 'full',
                redirectTo: 'dashboard',
            },
            {
                path: 'dashboard',
                loadComponent: () =>
                    import('./features/dashboard/pages/dashboard/dashboard')
                        .then(m => m.Dashboard),
            },
            {
                path: 'patients',
                children: [
                    {
                        path: '',
                        loadComponent: () =>
                            import('./features/patients/pages/patients-list/patients-list')
                                .then(m => m.PatientsList),
                    },
                    {
                        path: 'new',
                        loadComponent: () =>
                            import('./features/patients/pages/patient-form/patient-form')
                                .then(m => m.PatientForm),
                    },
                    // {
                    //   path: ':id',
                    //   loadComponent: () =>
                    //     import('./features/patients/pages/patient-details/patient-details')
                    //       .then(m => m.PatientDetails),
                    // },
                ],
            },
        ],
    },
    {
        path: '**',
        redirectTo: '',
    },
];
