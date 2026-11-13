
import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import {
    FormBuilder,
    ReactiveFormsModule,
    Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { PatientsService } from '../../services/patients.service';
import { PatientGender } from '../../models/patient.model';

@Component({
    selector: 'app-patient-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        RouterLink,
    ],
    templateUrl: './patient-form.html',
})
export class PatientForm {
    private readonly fb = inject(FormBuilder);
    private readonly patientsService = inject(PatientsService);
    private readonly router = inject(Router);

    loading = signal(false);
    errorMessage = signal('');
    readonly today = new Date().toLocaleDateString('en-CA');

    readonly genders: PatientGender[] = [
        'MALE',
        'FEMALE',
        'OTHER',
    ];

    patientForm = this.fb.nonNullable.group({
        firstName: ['', [
            Validators.required,
            Validators.minLength(2),
            Validators.maxLength(50),
        ]],
        lastName: ['', [
            Validators.required,
            Validators.minLength(2),
            Validators.maxLength(50),
        ]],
        phone: ['', [
            Validators.required,
            Validators.pattern(/^\+[1-9]\d{7,14}$/),
        ]],
        email: ['', [
            Validators.email,
        ]],
        dateOfBirth: [''],
        gender: ['' as '' | PatientGender],
        address: [''],
        notes: [''],
    });

    get f() {
        return this.patientForm.controls;
    }

    submit(): void {
        this.errorMessage.set('');

        if (this.patientForm.invalid) {
            this.patientForm.markAllAsTouched();
            return;
        }

        const value = this.patientForm.getRawValue();

        const payload = {
            firstName: value.firstName.trim(),
            lastName: value.lastName.trim(),
            phone: value.phone.trim(),
            ...(value.email.trim() && {
                email: value.email.trim(),
            }),
            ...(value.dateOfBirth && {
                dateOfBirth: value.dateOfBirth,
            }),
            ...(value.gender && {
                gender: value.gender,
            }),
            ...(value.address.trim() && {
                address: value.address.trim(),
            }),
            ...(value.notes.trim() && {
                notes: value.notes.trim(),
            }),
        };

        this.loading.set(true);

        this.patientsService.createPatient(payload).subscribe({
            next: () => {
                this.loading.set(false);
                this.router.navigate(['/patients']);
            },
            error: (error) => {
                this.loading.set(false);

                this.errorMessage.set(
                    error?.error?.message ||
                    'Unable to create patient. Please try again.',
                );
            },
        });
    }
}
