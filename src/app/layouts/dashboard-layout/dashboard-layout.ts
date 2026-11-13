
import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';

import { AuthService } from '../../core/auth/services/auth.service';

interface NavigationItem {
  label: string;
  path: string;
  icon: string;
  roles: Array<'ADMIN' | 'RECEPTIONIST' | 'DOCTOR'>;
}

@Component({
  selector: 'app-dashboard-layout',
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
  ],
  templateUrl: './dashboard-layout.html',
})
export class DashboardLayout {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly currentUser = this.authService.currentUser;
  readonly sidebarOpen = signal(false);

  readonly navigationItems: NavigationItem[] = [
    {
      label: 'Overview',
      path: '/dashboard',
      icon: '⌂',
      roles: ['ADMIN', 'RECEPTIONIST', 'DOCTOR'],
    },
    {
      label: 'Appointments',
      path: '/appointments',
      icon: '▦',
      roles: ['ADMIN', 'RECEPTIONIST', 'DOCTOR'],
    },
    {
      label: 'Patients',
      path: '/patients',
      icon: '♙',
      roles: ['ADMIN', 'RECEPTIONIST'],
    },
    {
      label: 'Doctors',
      path: '/doctors',
      icon: '✚',
      roles: ['ADMIN', 'RECEPTIONIST'],
    },
    {
      label: 'Voice calls',
      path: '/calls',
      icon: '◉',
      roles: ['ADMIN', 'RECEPTIONIST'],
    },
    {
      label: 'Call Analytics',
      path: '/calls/analytics',
      icon: '▤',
      roles: ['ADMIN', 'RECEPTIONIST'],
    },
    {
      label: 'Departments',
      path: '/departments',
      icon: '▧',
      roles: ['ADMIN', 'RECEPTIONIST'],
    },
    // {
    //   label: 'Staff management',
    //   path: '/staff',
    //   icon: '♧',
    //   roles: ['ADMIN'],
    // },
    // {
    //   label: 'Settings',
    //   path: '/settings',
    //   icon: '⚙',
    //   roles: ['ADMIN'],
    // },
  ];

  readonly visibleNavigationItems = computed(() => {
    const role = this.currentUser()?.role;

    if (!role) return [];

    return this.navigationItems.filter(item =>
      item.roles.includes(role),
    );
  });

  toggleSidebar(): void {
    this.sidebarOpen.update(value => !value);
  }

  closeSidebar(): void {
    this.sidebarOpen.set(false);
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        void this.router.navigateByUrl('/login');
      },
      error: () => {
        // AuthService should clear local authentication state
        // even when the logout request fails.
        void this.router.navigateByUrl('/login');
      },
    });
  }
}
