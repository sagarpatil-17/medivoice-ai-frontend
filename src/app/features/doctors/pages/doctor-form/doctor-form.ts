import {
    Component,
    DestroyRef,
    inject,
    signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    FormBuilder,
    ReactiveFormsModule,
    Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { DoctorsService } from '../../services/doctors.service';
import { DepartmentsService } from '../../../departments/services/departments.service';
import { Department } from '../../../departments/models/department.model';
import {
    CreateDoctorRequest,
    UpdateDoctorRequest,
} from '../../models/doctor.model';

@Component({
    selector: 'app-doctor-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterLink],
    templateUrl: './doctor-form.html',
})
export class DoctorForm {
    private readonly fb = inject(FormBuilder);
    private readonly doctorsService = inject(DoctorsService);
    private readonly departmentsService = inject(DepartmentsService);
    private readonly router = inject(Router);
    private readonly route = inject(ActivatedRoute);
    private readonly destroyRef = inject(DestroyRef);

    readonly departments = signal<Department[]>([]);
    readonly loading = signal(false);
    readonly saving = signal(false);
    readonly errorMessage = signal('');

    readonly doctorId = this.route.snapshot.paramMap.get('id');
    readonly isEditMode = !!this.doctorId;

    readonly form = this.fb.nonNullable.group({
        fullName: ['', [Validators.required, Validators.maxLength(100)]],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [
            Validators.required,
            Validators.minLength(8),
        ]],
        phone: [''],
        departmentId: ['', Validators.required],
        specialization: ['', Validators.required],
        qualification: ['', Validators.required],
        experienceYears: [0, [
            Validators.required,
            Validators.min(0),
            Validators.max(70),
        ]],
        consultationFee: [0, [
            Validators.required,
            Validators.min(0),
        ]],
        bio: [''],
    });

    constructor() {
        this.loadDepartments();

        if (this.isEditMode && this.doctorId) {
            this.form.controls.email.disable();
            this.form.controls.password.clearValidators();
            this.form.controls.password.updateValueAndValidity();
            this.loadDoctor(this.doctorId);
        }
    }

    loadDepartments(): void {
        this.departmentsService
            .getDepartments(1, 100)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (response) => {
                    this.departments.set(response.data);
                },
                error: () => {
                    this.errorMessage.set('Unable to load departments.');
                },
            });
    }

    loadDoctor(id: string): void {
        this.loading.set(true);

        this.doctorsService
            .getDoctor(id)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (doctor) => {
                    this.form.patchValue({
                        fullName: doctor.fullName,
                        email: doctor.user.email,
                        phone: doctor.user.phone ?? '',
                        departmentId: doctor.departmentId,
                        specialization: doctor.specialization,
                        qualification: doctor.qualification,
                        experienceYears: doctor.experienceYears,
                        consultationFee: doctor.consultationFee,
                        bio: doctor.bio ?? '',
                    });

                    this.loading.set(false);
                },
                error: () => {
                    this.errorMessage.set('Unable to load doctor details.');
                    this.loading.set(false);
                },
            });
    }

    submit(): void {
        if (this.form.invalid || this.saving()) {
            this.form.markAllAsTouched();
            return;
        }

        this.saving.set(true);
        this.errorMessage.set('');

        const value = this.form.getRawValue();

        if (this.isEditMode && this.doctorId) {
            const payload: UpdateDoctorRequest = {
                fullName: value.fullName,
                phone: value.phone || undefined,
                departmentId: value.departmentId,
                specialization: value.specialization,
                qualification: value.qualification,
                experienceYears: Number(value.experienceYears),
                consultationFee: Number(value.consultationFee),
                bio: value.bio || undefined,
            };

            this.doctorsService
                .updateDoctor(this.doctorId, payload)
                .pipe(takeUntilDestroyed(this.destroyRef))
                .subscribe({
                    next: () => this.router.navigate(['/doctors', this.doctorId]),
                    error: (error) => this.handleSaveError(error),
                });

            return;
        }

        const payload: CreateDoctorRequest = {
            fullName: value.fullName,
            email: value.email,
            password: value.password,
            phone: value.phone || undefined,
            departmentId: value.departmentId,
            specialization: value.specialization,
            qualification: value.qualification,
            experienceYears: Number(value.experienceYears),
            consultationFee: Number(value.consultationFee),
            bio: value.bio || undefined,
        };

        this.doctorsService
            .createDoctor(payload)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: () => this.router.navigate(['/doctors']),
                error: (error) => this.handleSaveError(error),
            });
    }

    private handleSaveError(error: any): void {
        this.saving.set(false);
        this.errorMessage.set(
            error?.error?.message || 'Unable to save doctor. Please try again.',
        );
    }
}