
import {
    Component,
    DestroyRef,
    OnInit,
    inject,
    signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    FormBuilder,
    ReactiveFormsModule,
    Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';

import { PatientsService } from '../../../patients/services/patients.service';
import { DoctorsService } from '../../../doctors/services/doctors.service';
import { AppointmentsService } from '../../services/appointments.service';

import {
    AppointmentAvailabilityResponse,
    AvailableSlot,
    CreateAppointmentRequest,
} from '../../models/appointment.model';

@Component({
    selector: 'app-appointment-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterLink],
    templateUrl: './appointment-form.html',
})
export class AppointmentForm implements OnInit {
    private readonly fb = inject(FormBuilder);
    private readonly router = inject(Router);
    private readonly destroyRef = inject(DestroyRef);

    private readonly patientsService = inject(PatientsService);
    private readonly doctorsService = inject(DoctorsService);
    private readonly appointmentsService = inject(AppointmentsService);

    patients = signal<any[]>([]);
    doctors = signal<any[]>([]);

    loadingOptions = signal(true);
    loadingSlots = signal(false);
    saving = signal(false);

    errorMessage = signal('');
    availabilityError = signal('');
    successMessage = signal('');

    availability = signal<AppointmentAvailabilityResponse | null>(null);
    availableSlots = signal<AvailableSlot[]>([]);

    minDate = this.getLocalDateString();

    appointmentForm = this.fb.group({
        patientId: ['', Validators.required],
        doctorId: ['', Validators.required],
        date: ['', Validators.required],
        startAt: ['', Validators.required],
        reason: ['', Validators.maxLength(500)],
    });

    ngOnInit(): void {
        this.loadOptions();
    }

    private loadOptions(): void {
        this.loadingOptions.set(true);
        this.errorMessage.set('');

        forkJoin({
            patients: this.patientsService.getPatients(1, 100),
            doctors: this.doctorsService.getDoctors(1, 100, '', true),
        })
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (response) => {
                    this.patients.set(response.patients.data);
                    this.doctors.set(response.doctors.data);
                    this.loadingOptions.set(false);
                },
                error: (error) => {
                    this.errorMessage.set(
                        error?.error?.message ||
                        'Unable to load patients and doctors.',
                    );
                    this.loadingOptions.set(false);
                },
            });
    }

    onDoctorOrDateChange(): void {
        this.appointmentForm.controls.startAt.setValue('');
        this.availability.set(null);
        this.availableSlots.set([]);
        this.availabilityError.set('');

        const doctorId = this.appointmentForm.controls.doctorId.value;
        const date = this.appointmentForm.controls.date.value;

        if (!doctorId || !date) return;

        if (date < this.minDate) {
            this.availabilityError.set(
                'Please select today or a future date.',
            );
            return;
        }

        this.loadAvailableSlots(doctorId, date);
    }

    private loadAvailableSlots(
        doctorId: string,
        date: string,
    ): void {
        this.loadingSlots.set(true);
        this.availabilityError.set('');

        this.appointmentsService
            .checkAvailability(doctorId, date)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (response) => {
                    this.availability.set(response);
                    this.availableSlots.set(
                        response.slots.filter((slot) => slot.available),
                    );
                    this.loadingSlots.set(false);

                    if (response.availableCount === 0) {
                        this.availabilityError.set(
                            'No available slots for this doctor on the selected date.',
                        );
                    }
                },
                error: (error) => {
                    this.availabilityError.set(
                        error?.error?.message ||
                        'Unable to check doctor availability.',
                    );
                    this.loadingSlots.set(false);
                },
            });
    }

    selectSlot(slot: AvailableSlot): void {
        this.appointmentForm.controls.startAt.setValue(slot.startAt);
        this.appointmentForm.controls.startAt.markAsTouched();
    }

    isSlotSelected(slot: AvailableSlot): boolean {
        return this.appointmentForm.controls.startAt.value === slot.startAt;
    }

    submit(): void {
        this.errorMessage.set('');
        this.successMessage.set('');

        if (this.appointmentForm.invalid) {
            this.appointmentForm.markAllAsTouched();
            return;
        }

        const value = this.appointmentForm.getRawValue();

        const payload: CreateAppointmentRequest = {
            patientId: value.patientId!,
            doctorId: value.doctorId!,
            startAt: value.startAt!,
            reason: value.reason?.trim() || undefined,
        };

        this.saving.set(true);

        this.appointmentsService
            .createAppointment(payload)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (appointment) => {
                    this.saving.set(false);
                    this.router.navigate(['/appointments', appointment.id]);
                },
                error: (error) => {
                    this.saving.set(false);
                    this.errorMessage.set(
                        error?.error?.message ||
                        'Unable to create appointment. Please refresh availability and try again.',
                    );

                    // Refresh slots in case another booking took this slot.
                    this.onDoctorOrDateChange();
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

    getPatientLabel(patient: any): string {
        return `${patient.firstName} ${patient.lastName} — ${patient.phone}`;
    }
}
