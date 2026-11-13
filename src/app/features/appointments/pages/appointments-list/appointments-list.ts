
import {
    Component,
    computed,
    DestroyRef,
    inject,
    signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import {
    Appointment,
    AppointmentStatus,
} from '../../models/appointment.model';
import { AppointmentsService } from '../../services/appointments.service';
import { AuthService } from '../../../../core/auth/services/auth.service';

@Component({
    selector: 'app-appointments-list',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './appointments-list.html',
})
export class AppointmentsList {
    private readonly appointmentsService = inject(AppointmentsService);
    private readonly destroyRef = inject(DestroyRef);
    private readonly authService = inject(AuthService);

    appointments = signal<Appointment[]>([]);
    loading = signal(false);
    errorMessage = signal('');

    currentPage = signal(1);
    pageSize = signal(10);
    totalAppointments = signal(0);
    totalPages = signal(0);

    selectedStatus = signal('');
    fromDate = signal('');
    toDate = signal('');

    readonly statuses: AppointmentStatus[] = [
        'PENDING',
        'CONFIRMED',
        'CANCELLED',
        'COMPLETED',
        'NO_SHOW',
    ];

    readonly canManageAppointments = computed(() => {
        const role = this.authService.userRole();

        return role === 'ADMIN' || role === 'RECEPTIONIST';
    });

    constructor() {
        this.loadAppointments();
    }

    loadAppointments(): void {
        this.loading.set(true);
        this.errorMessage.set('');

        const from = this.fromDate()
            ? `${this.fromDate()}T00:00:00+05:30`
            : undefined;

        const to = this.toDate()
            ? `${this.toDate()}T23:59:59.999+05:30`
            : undefined;

        this.appointmentsService
            .getAppointments({
                page: this.currentPage(),
                limit: this.pageSize(),
                status: this.selectedStatus()
                    ? this.selectedStatus() as AppointmentStatus
                    : undefined,
                from,
                to,
            })
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (response) => {
                    this.appointments.set(response.data);
                    this.totalAppointments.set(response.meta.total);
                    this.totalPages.set(response.meta.totalPages);
                    this.loading.set(false);
                },
                error: (error) => {
                    this.errorMessage.set(
                        error?.error?.message ||
                        'Unable to load appointments. Please try again.',
                    );
                    this.loading.set(false);
                },
            });
    }

    applyFilters(): void {
        this.currentPage.set(1);
        this.loadAppointments();
    }

    clearFilters(): void {
        this.selectedStatus.set('');
        this.fromDate.set('');
        this.toDate.set('');
        this.currentPage.set(1);
        this.loadAppointments();
    }

    previousPage(): void {
        if (this.currentPage() <= 1) return;

        this.currentPage.update((page) => page - 1);
        this.loadAppointments();
    }

    nextPage(): void {
        if (this.currentPage() >= this.totalPages()) return;

        this.currentPage.update((page) => page + 1);
        this.loadAppointments();
    }

    changePageSize(value: string): void {
        this.pageSize.set(Number(value));
        this.currentPage.set(1);
        this.loadAppointments();
    }

    getPatientName(appointment: Appointment): string {
        return `${appointment.patient.firstName} ${appointment.patient.lastName}`;
    }

    getStatusClass(status: AppointmentStatus): string {
        const classes: Record<AppointmentStatus, string> = {
            PENDING: 'bg-amber-50 text-amber-700',
            CONFIRMED: 'bg-green-50 text-green-700',
            CANCELLED: 'bg-red-50 text-red-700',
            COMPLETED: 'bg-blue-50 text-blue-700',
            NO_SHOW: 'bg-gray-100 text-gray-700',
        };

        return classes[status];
    }

    getBookingSourceLabel(source: string): string {
        const labels: Record<string, string> = {
            ADMIN: 'Admin',
            RECEPTIONIST: 'Receptionist',
            VOICE_AI: 'Voice AI',
            PATIENT_PORTAL: 'Patient Portal',
        };

        return labels[source] ?? source;
    }

    trackAppointment(
        _index: number,
        appointment: Appointment,
    ): string {
        return appointment.id;
    }
}
