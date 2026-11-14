
import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
    FormBuilder,
    ReactiveFormsModule,
    Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { PatientsService } from '../../services/patients.service';
import {
    PatientDetails as PatientDetailsModel,
    PatientAppointment,
    PatientGender,
    UpdatePatientRequest,
} from '../../models/patient.model';

@Component({
    selector: 'app-patient-details',
    imports: [CommonModule, ReactiveFormsModule, RouterLink],
    templateUrl: './patient-details.html',
})
export class PatientDetails {
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly fb = inject(FormBuilder);
    private readonly patientsService = inject(PatientsService);
    private readonly destroyRef = inject(DestroyRef);

    patient = signal<PatientDetailsModel | null>(null);
    appointments = signal<PatientAppointment[]>([]);

    loading = signal(true);
    appointmentsLoading = signal(true);
    saving = signal(false);
    editMode = signal(false);

    errorMessage = signal('');
    saveError = signal('');

    readonly genders: PatientGender[] = ['MALE', 'FEMALE', 'OTHER'];

    readonly patientForm = this.fb.nonNullable.group({
        firstName: ['', [Validators.required, Validators.minLength(2)]],
        lastName: ['', [Validators.required, Validators.minLength(2)]],
        phone: ['', [
            Validators.required,
            Validators.pattern(/^\+[1-9]\d{7,14}$/),
        ]],
        email: ['', [Validators.email]],
        dateOfBirth: [''],
        gender: ['' as '' | PatientGender],
        address: [''],
        notes: [''],
    });

    get f() {
        return this.patientForm.controls;
    }

    constructor() {
        const id = this.route.snapshot.paramMap.get('id');

        if (!id) {
            this.router.navigate(['/patients']);
            return;
        }

        this.loadPatient(id);
        this.loadAppointments(id);
    }

    ngOnInit(): void {
        const isEdit = this.route.snapshot.queryParamMap.get('edit') === 'true';
        this.editMode.set(isEdit);
    }

    loadPatient(id: string): void {
        this.loading.set(true);
        this.errorMessage.set('');

        this.patientsService.getPatient(id)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (patient) => {
                    this.patient.set(patient);
                    this.populateForm(patient);
                    this.loading.set(false);
                },
                error: (error) => {
                    this.loading.set(false);
                    this.errorMessage.set(
                        error?.error?.message || 'Unable to load patient details.',
                    );
                },
            });
    }

    loadAppointments(id: string): void {
        this.appointmentsLoading.set(true);

        this.patientsService.getPatientAppointments(id)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (response) => {
                    this.appointments.set(response.appointments);
                    this.appointmentsLoading.set(false);
                },
                error: () => {
                    this.appointmentsLoading.set(false);
                },
            });
    }

    populateForm(patient: PatientDetailsModel): void {
        this.patientForm.patchValue({
            firstName: patient.firstName,
            lastName: patient.lastName,
            phone: patient.phone,
            email: patient.email ?? '',
            dateOfBirth: patient.dateOfBirth?.slice(0, 10) ?? '',
            gender: patient.gender ?? '',
            address: patient.address ?? '',
            notes: patient.notes ?? '',
        });
    }

    startEditing(): void {
        const patient = this.patient();

        if (!patient) return;

        this.populateForm(patient);
        this.saveError.set('');
        this.editMode.set(true);
    }

    cancelEditing(): void {
        const patient = this.patient();

        if (patient) {
            this.populateForm(patient);
        }

        this.saveError.set('');
        this.editMode.set(false);
    }

    saveChanges(): void {
        const patient = this.patient();

        if (!patient || this.patientForm.invalid) {
            this.patientForm.markAllAsTouched();
            return;
        }

        const value = this.patientForm.getRawValue();

        const payload: UpdatePatientRequest = {
            firstName: value.firstName.trim(),
            lastName: value.lastName.trim(),
            phone: value.phone.trim(),
            email: value.email.trim() || undefined,
            dateOfBirth: value.dateOfBirth || undefined,
            gender: value.gender || undefined,
            address: value.address.trim() || undefined,
            notes: value.notes.trim() || undefined,
        };

        this.saving.set(true);
        this.saveError.set('');

        this.patientsService.updatePatient(patient.id, payload)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (updatedPatient) => {
                    this.patient.set(updatedPatient);
                    this.populateForm(updatedPatient);
                    this.editMode.set(false);
                    this.saving.set(false);
                },
                error: (error) => {
                    this.saving.set(false);
                    this.saveError.set(
                        error?.error?.message || 'Unable to update patient.',
                    );
                },
            });
    }

    getPatientInitials(): string {
        const patient = this.patient();

        if (!patient) return 'P';

        return `${patient.firstName.charAt(0)}${patient.lastName.charAt(0)}`
            .toUpperCase();
    }

    getStatusClasses(status: string): string {
        const classes: Record<string, string> = {
            CONFIRMED: 'bg-emerald-50 text-emerald-700',
            PENDING: 'bg-amber-50 text-amber-700',
            CANCELLED: 'bg-red-50 text-red-700',
            COMPLETED: 'bg-blue-50 text-blue-700',
            NO_SHOW: 'bg-zinc-100 text-zinc-600',
        };

        return classes[status] || 'bg-zinc-100 text-zinc-600';
    }

    formatStatus(status: string): string {
        return status.replaceAll('_', ' ');
    }
}
