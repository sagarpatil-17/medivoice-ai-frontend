import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import {
    FormBuilder,
    ReactiveFormsModule,
    Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { DepartmentsService } from '../../services/departments.service';

@Component({
    selector: 'app-department-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterLink],
    templateUrl: './department-form.html',
})
export class DepartmentForm {
    private readonly fb = inject(FormBuilder);
    private readonly departmentsService = inject(DepartmentsService);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly destroyRef = inject(DestroyRef);

    readonly isEditMode = signal(false);
    readonly loading = signal(false);
    readonly saving = signal(false);
    readonly errorMessage = signal('');

    private departmentId: string | null = null;

    readonly departmentForm = this.fb.nonNullable.group({
        name: ['', [Validators.required, Validators.maxLength(100)]],
        code: [
            '',
            [
                Validators.required,
                Validators.maxLength(20),
                Validators.pattern(/^[A-Za-z0-9_-]+$/),
            ],
        ],
        description: ['', [Validators.maxLength(500)]],
    });

    constructor() {
        this.departmentId = this.route.snapshot.paramMap.get('id');

        if (this.departmentId) {
            this.isEditMode.set(true);
            this.loadDepartment(this.departmentId);
        }
    }

    loadDepartment(id: string): void {
        this.loading.set(true);
        this.errorMessage.set('');

        this.departmentsService
            .getDepartment(id)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (department) => {
                    this.departmentForm.patchValue({
                        name: department.name,
                        code: department.code,
                        description: department.description ?? '',
                    });

                    this.loading.set(false);
                },
                error: () => {
                    this.errorMessage.set('Unable to load department details.');
                    this.loading.set(false);
                },
            });
    }

    onSubmit(): void {
        if (this.departmentForm.invalid || this.saving()) {
            this.departmentForm.markAllAsTouched();
            return;
        }

        this.saving.set(true);
        this.errorMessage.set('');

        const formValue = this.departmentForm.getRawValue();

        const payload = {
            name: formValue.name.trim(),
            code: formValue.code.trim().toUpperCase(),
            description: formValue.description.trim(),
        };

        const request = this.departmentId
            ? this.departmentsService.updateDepartment(
                this.departmentId,
                payload,
            )
            : this.departmentsService.createDepartment(payload);

        request
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: () => {
                    this.saving.set(false);
                    this.router.navigate(['/departments']);
                },
                error: (error) => {
                    this.saving.set(false);
                    this.errorMessage.set(
                        error?.error?.message ||
                        `Unable to ${this.isEditMode() ? 'update' : 'create'} department. Please try again.`,
                    );
                },
            });
    }
}