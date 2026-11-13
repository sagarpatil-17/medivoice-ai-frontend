
import {
    Component,
    DestroyRef,
    OnInit,
    inject,
    signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
    FormBuilder,
    ReactiveFormsModule,
    Validators,
} from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { AppointmentsService } from '../../services/appointments.service';
import {
    Appointment,
    AppointmentStatus,
    AvailableSlot,
} from '../../models/appointment.model';

@Component({
    selector: 'app-appointment-details',
    standalone: true,
    imports: [CommonModule, RouterLink, ReactiveFormsModule],
    templateUrl: './appointment-details.html',
})
export class AppointmentDetails implements OnInit {
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly fb = inject(FormBuilder);
    private readonly destroyRef = inject(DestroyRef);
    private readonly appointmentsService = inject(AppointmentsService);

    appointment = signal<Appointment | null>(null);
    loading = signal(true);
    saving = signal(false);
    errorMessage = signal('');
    successMessage = signal('');

    showCancelForm = signal(false);
    showRescheduleForm = signal(false);

    loadingSlots = signal(false);
    slotsError = signal('');
    availableSlots = signal<AvailableSlot[]>([]);

    selectedStartAt = signal('');

    minDate = this.getLocalDateString();

    cancelForm = this.fb.group({
        cancellationReason: ['', [
            Validators.required,
            Validators.maxLength(500),
        ]],
    });

    rescheduleForm = this.fb.group({
        date: ['', Validators.required],
    });

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('id');

        if (!id) {
            this.errorMessage.set('Appointment ID is missing.');
            this.loading.set(false);
            return;
        }

        this.loadAppointment(id);
    }

    loadAppointment(id: string): void {
        this.loading.set(true);
        this.errorMessage.set('');

        this.appointmentsService
            .getAppointment(id)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (response) => {
                    this.appointment.set(response);
                    this.loading.set(false);
                },
                error: (error) => {
                    this.errorMessage.set(
                        error?.error?.message ||
                        'Unable to load appointment details.',
                    );
                    this.loading.set(false);
                },
            });
    }

    get canManageAppointment(): boolean {
        const status = this.appointment()?.status;

        return status === 'PENDING' || status === 'CONFIRMED';
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

    openCancelForm(): void {
        this.cancelForm.reset();
        this.showCancelForm.set(true);
        this.showRescheduleForm.set(false);
        this.errorMessage.set('');
        this.successMessage.set('');
    }

    closeCancelForm(): void {
        this.showCancelForm.set(false);
        this.cancelForm.reset();
    }

    cancelAppointment(): void {
        const current = this.appointment();

        if (!current || !this.canManageAppointment) return;

        if (this.cancelForm.invalid) {
            this.cancelForm.markAllAsTouched();
            return;
        }

        const cancellationReason =
            this.cancelForm.controls.cancellationReason.value?.trim();

        if (!cancellationReason) return;

        this.saving.set(true);
        this.errorMessage.set('');

        this.appointmentsService
            .cancelAppointment(current.id, { cancellationReason })
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (response) => {
                    this.appointment.set(response);
                    this.saving.set(false);
                    this.showCancelForm.set(false);
                    this.successMessage.set('Appointment cancelled successfully.');
                },
                error: (error) => {
                    this.saving.set(false);
                    this.errorMessage.set(
                        error?.error?.message || 'Unable to cancel appointment.',
                    );
                },
            });
    }

    openRescheduleForm(): void {
        const current = this.appointment();

        if (!current || !this.canManageAppointment) return;

        this.showRescheduleForm.set(true);
        this.showCancelForm.set(false);
        this.availableSlots.set([]);
        this.selectedStartAt.set('');
        this.slotsError.set('');
        this.successMessage.set('');

        this.rescheduleForm.reset({
            date: '',
        });
    }

    closeRescheduleForm(): void {
        this.showRescheduleForm.set(false);
        this.availableSlots.set([]);
        this.selectedStartAt.set('');
    }

    checkNewAvailability(): void {
        const current = this.appointment();
        const date = this.rescheduleForm.controls.date.value;

        this.availableSlots.set([]);
        this.selectedStartAt.set('');
        this.slotsError.set('');

        if (!current || !date) return;

        if (date < this.minDate) {
            this.slotsError.set('Please select today or a future date.');
            return;
        }

        this.loadingSlots.set(true);

        this.appointmentsService
            .checkAvailability(current.doctorId, date)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (response) => {
                    this.availableSlots.set(
                        response.slots.filter((slot) => slot.available),
                    );
                    this.loadingSlots.set(false);

                    if (response.availableCount === 0) {
                        this.slotsError.set('No available slots on this date.');
                    }
                },
                error: (error) => {
                    this.loadingSlots.set(false);
                    this.slotsError.set(
                        error?.error?.message || 'Unable to check availability.',
                    );
                },
            });
    }

    selectSlot(slot: AvailableSlot): void {
        this.selectedStartAt.set(slot.startAt);
    }

    rescheduleAppointment(): void {
        const current = this.appointment();
        const startAt = this.selectedStartAt();

        if (!current || !this.canManageAppointment || !startAt) return;

        this.saving.set(true);
        this.errorMessage.set('');

        this.appointmentsService
            .rescheduleAppointment(current.id, { startAt })
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (response) => {
                    this.appointment.set(response);
                    this.saving.set(false);
                    this.showRescheduleForm.set(false);
                    this.successMessage.set('Appointment rescheduled successfully.');
                    this.availableSlots.set([]);
                    this.selectedStartAt.set('');
                },
                error: (error) => {
                    this.saving.set(false);
                    this.errorMessage.set(
                        error?.error?.message ||
                        'Unable to reschedule. The selected slot may no longer be available.',
                    );
                },
            });
    }

    completeAppointment(): void {
        const current = this.appointment();

        if (!current || current.status !== 'CONFIRMED') return;

        if (!window.confirm('Mark this appointment as completed?')) return;

        this.updateAppointmentStatus(
            () => this.appointmentsService.completeAppointment(current.id),
            'Appointment marked as completed.',
        );
    }

    markNoShow(): void {
        const current = this.appointment();

        if (!current || current.status !== 'CONFIRMED') return;

        if (!window.confirm('Mark this patient as no-show?')) return;

        this.updateAppointmentStatus(
            () => this.appointmentsService.markNoShow(current.id),
            'Appointment marked as no-show.',
        );
    }

    private updateAppointmentStatus(
        action: () => import('rxjs').Observable<Appointment>,
        success: string,
    ): void {
        this.saving.set(true);
        this.errorMessage.set('');
        this.successMessage.set('');

        action()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (response) => {
                    this.appointment.set(response);
                    this.saving.set(false);
                    this.successMessage.set(success);
                },
                error: (error) => {
                    this.saving.set(false);
                    this.errorMessage.set(
                        error?.error?.message || 'Unable to update appointment status.',
                    );
                },
            });
    }

    private getLocalDateString(): string {
        const now = new Date();

        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');

        return `${year}-${month}-${day}`;
    }
}
