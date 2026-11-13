import {
    Component,
    DestroyRef,
    computed,
    inject,
    signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, switchMap, catchError, of, tap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { DepartmentsService } from '../../services/departments.service';
import { Department } from '../../models/department.model';
import { AuthService } from '../../../../core/auth/services/auth.service';

@Component({
    selector: 'app-departments-list',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './departments-list.html',
})
export class DepartmentsList {
    private readonly departmentsService = inject(DepartmentsService);
    private readonly authService = inject(AuthService);
    private readonly destroyRef = inject(DestroyRef);

    readonly departments = signal<Department[]>([]);
    readonly loading = signal(true);
    readonly errorMessage = signal('');
    readonly searchTerm = signal('');
    readonly page = signal(1);
    readonly limit = 10;
    readonly total = signal(0);
    readonly totalPages = signal(0);
    readonly isAdmin = computed(
        () => this.authService.currentUser()?.role === 'ADMIN',
    );

    readonly activeCount = computed(
        () => this.departments().filter((department) => department.isActive).length,
    );

    readonly currentPageDoctorCount = computed(
        () =>
            this.departments().reduce(
                (total, department) => total + (department._count?.doctors ?? 0),
                0,
            ),
    );

    private readonly searchSubject = new Subject<string>();

    constructor() {
        this.searchSubject
            .pipe(
                debounceTime(350),
                distinctUntilChanged(),
                tap(() => this.page.set(1)),
                switchMap((search) => {
                    this.loading.set(true);
                    this.errorMessage.set('');

                    return this.departmentsService
                        .getDepartments(1, this.limit, search)
                        .pipe(
                            catchError(() => {
                                this.errorMessage.set('Unable to load departments.');
                                return of(null);
                            }),
                        );
                }),
                takeUntilDestroyed(this.destroyRef),
            )
            .subscribe((response) => {
                if (response) {
                    this.updateList(response);
                }

                this.loading.set(false);
            });

        this.loadDepartments();
    }

    loadDepartments(): void {
        this.loading.set(true);
        this.errorMessage.set('');

        this.departmentsService
            .getDepartments(this.page(), this.limit, this.searchTerm())
            .pipe(
                takeUntilDestroyed(this.destroyRef),
            )
            .subscribe({
                next: (response) => {
                    this.updateList(response);
                    this.loading.set(false);
                },
                error: () => {
                    this.errorMessage.set('Unable to load departments. Please try again.');
                    this.loading.set(false);
                },
            });
    }

    onSearch(value: string): void {
        this.searchTerm.set(value);
        this.searchSubject.next(value.trim());
    }

    goToPage(nextPage: number): void {
        if (nextPage < 1 || nextPage > this.totalPages()) {
            return;
        }

        this.page.set(nextPage);
        this.loadDepartments();
    }

    deactivateDepartment(department: Department): void {
        if (!this.isAdmin() || !department.isActive) {
            return;
        }

        const confirmed = window.confirm(
            `Are you sure you want to deactivate ${department.name}?`,
        );

        if (!confirmed) {
            return;
        }

        this.departmentsService.deactivateDepartment(department.id).subscribe({
            next: () => this.loadDepartments(),
            error: () => {
                this.errorMessage.set(
                    'Unable to deactivate department. Please try again.',
                );
            },
        });
    }

    private updateList(response: {
        data: Department[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }): void {
        this.departments.set(response.data);
        this.total.set(response.meta.total);
        this.totalPages.set(response.meta.totalPages);
    }
}