
import { Routes } from '@angular/router';
import { authGuard } from './core/auth/guards/auth.guard';
import { roleGuard } from './core/auth/guards/role.guard';

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
                    {
                        path: ':id',
                        loadComponent: () =>
                            import('./features/patients/pages/patient-details/patient-details')
                                .then(m => m.PatientDetails),
                    },
                ],
            },
            {
                path: 'doctors',
                children: [
                    {
                        path: '',
                        loadComponent: () =>
                            import('./features/doctors/pages/doctors-list/doctors-list')
                                .then(m => m.DoctorsList),
                    },
                    {
                        path: 'new',
                        loadComponent: () =>
                            import('./features/doctors/pages/doctor-form/doctor-form')
                                .then(m => m.DoctorForm),
                    },
                    {
                        path: ':id',
                        loadComponent: () =>
                            import('./features/doctors/pages/doctor-details/doctor-details')
                                .then(m => m.DoctorDetails),
                    },
                ],
            },
            {
                path: 'appointments',
                canActivate: [authGuard, roleGuard],
                data: {
                    roles: ['ADMIN', 'RECEPTIONIST']
                },
                children: [
                    {
                        path: '',
                        loadComponent: () =>
                            import('./features/appointments/pages/appointments-list/appointments-list')
                                .then(m => m.AppointmentsList)
                    },
                    {
                        path: 'new',
                        loadComponent: () =>
                            import('./features/appointments/pages/appointment-form/appointment-form')
                                .then(m => m.AppointmentForm)
                    },
                    {
                        path: ':id',
                        loadComponent: () =>
                            import('./features/appointments/pages/appointment-details/appointment-details')
                                .then(m => m.AppointmentDetails)
                    }
                ]
            },
            {
                path: 'calls',
                children: [
                    {
                        path: '',
                        loadComponent: () =>
                            import('./features/calls/pages/calls-list/calls-list')
                                .then(m => m.CallsList),
                    },
                    {
                        path: ':id',
                        loadComponent: () =>
                            import('./features/calls/pages/call-details/call-details')
                                .then(m => m.CallDetails),
                    },
                ],
            }
        ],
    },
    {
        path: '**',
        redirectTo: '',
    },
];
