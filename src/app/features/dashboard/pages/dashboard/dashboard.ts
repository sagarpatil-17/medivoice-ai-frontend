import {
  Component,
  inject,
  signal,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';

import { DashboardService } from '../../services/dashboard.service';
import {
  AppointmentTrend,
  DepartmentStat,
  AppointmentStatusItem,
  RecentAppointment,
} from '../../models/dashboard.model';

interface DashboardStat {
  label: string;
  value: string;
  description: string;
  icon: string;
  iconClass: string;
}

interface Appointment {
  id: string;
  patient: string;
  doctor: string;
  department: string;
  time: string;
  status:
  | 'CONFIRMED'
  | 'PENDING'
  | 'CANCELLED'
  | 'COMPLETED'
  | 'NO_SHOW';
}

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.html',
})
export class Dashboard implements OnInit {
  private readonly dashboardService = inject(DashboardService);

  readonly loading = signal(true);
  readonly errorMessage = signal('');

  readonly today = new Intl.DateTimeFormat('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  }).format(new Date());

  stats: DashboardStat[] = [
    {
      label: 'Total patients',
      value: '—',
      description: 'Registered patients',
      icon: '♙',
      iconClass: 'bg-blue-50 text-blue-700',
    },
    {
      label: "Today's appointments",
      value: '—',
      description: 'Appointments scheduled today',
      icon: '▦',
      iconClass: 'bg-emerald-50 text-emerald-700',
    },
    {
      label: 'Available doctors',
      value: '—',
      description: 'Currently active doctors',
      icon: '✚',
      iconClass: 'bg-teal-50 text-teal-700',
    },
    {
      label: 'AI voice calls',
      value: '—',
      description: 'Call analytics not available yet',
      icon: '◉',
      iconClass: 'bg-amber-50 text-amber-700',
    },
  ];

  appointments: Appointment[] = [];

  // These will be used when we connect dashboard charts.
  trends: AppointmentTrend[] = [];
  appointmentStatuses: AppointmentStatusItem[] = [];
  departmentStats: DepartmentStat[] = [];

  // Keep empty until a real recent-activity API is available.
  activities: {
    title: string;
    description: string;
    time: string;
    icon: string;
  }[] = [];

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    forkJoin({
      overview: this.dashboardService.getOverview(),
      recentAppointments:
        this.dashboardService.getRecentAppointments(5),
      trends: this.dashboardService.getAppointmentTrends(7),
      statuses: this.dashboardService.getAppointmentStatus(),
      departments: this.dashboardService.getDepartmentStats(),
    }).subscribe({
      next: (response) => {
        const overview = response.overview;

        this.stats = [
          {
            label: 'Total patients',
            value: overview.patients.total.toLocaleString('en-IN'),
            description: 'Registered patients',
            icon: '♙',
            iconClass: 'bg-blue-50 text-blue-700',
          },
          {
            label: "Today's appointments",
            value: overview.appointments.total.toString(),
            description: `${overview.appointments.pending} pending appointments`,
            icon: '▦',
            iconClass: 'bg-emerald-50 text-emerald-700',
          },
          {
            label: 'Available doctors',
            value: overview.doctors.active.toString(),
            description: `${overview.departments.active} active departments`,
            icon: '✚',
            iconClass: 'bg-teal-50 text-teal-700',
          },
          {
            label: 'AI voice calls',
            value: '—',
            description: 'Call analytics not available yet',
            icon: '◉',
            iconClass: 'bg-amber-50 text-amber-700',
          },
        ];

        this.appointments =
          response.recentAppointments.data.map(
            (appointment: RecentAppointment) => ({
              id: appointment.id,
              patient: `${appointment.patient.firstName} ${appointment.patient.lastName}`,
              doctor: appointment.doctor.fullName,
              department: appointment.doctor.department.name,
              time: this.formatAppointmentTime(
                appointment.startAt,
              ),
              status: appointment.status,
            }),
          );

        this.trends = response.trends.data;
        this.appointmentStatuses = response.statuses.data;
        this.departmentStats = response.departments.data;

        this.loading.set(false);
      },

      error: (error) => {
        console.error('Dashboard loading failed:', error);

        this.errorMessage.set(
          'Unable to load dashboard data. Please try again.',
        );

        this.loading.set(false);
      },
    });
  }

  private formatAppointmentTime(date: string): string {
    return new Intl.DateTimeFormat('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata',
    }).format(new Date(date));
  }

  get appointmentStatusTotal(): number {
    return this.appointmentStatuses.reduce(
      (sum, item) => sum + item.count,
      0,
    );
  }

  get maxTrendAppointments(): number {
    return Math.max(
      1,
      ...this.trends.map((item) => item.appointments),
    );
  }
}