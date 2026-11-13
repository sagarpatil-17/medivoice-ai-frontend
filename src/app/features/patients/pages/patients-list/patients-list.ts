import {
    Component,
    OnInit,
    OnDestroy,
    inject,
    signal,
    computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
    Subject,
    debounceTime,
    distinctUntilChanged,
    switchMap,
    catchError,
    of,
    tap,
} from 'rxjs';

import { PatientsService } from '../../services/patients.service';
import { Patient } from '../../models/patient.model';

@Component({
    selector: 'app-patients-list',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './patients-list.html',
})
export class PatientsList implements OnInit, OnDestroy {
    private readonly patientsService = inject(PatientsService);

    private readonly searchSubject = new Subject<string>();
    private readonly loadSubject = new Subject<void>();

    readonly loading = signal(false);
    readonly errorMessage = signal('');

    readonly patients = signal<Patient[]>([]);
    readonly searchTerm = signal('');

    readonly currentPage = signal(1);
    readonly pageSize = signal(10);
    readonly totalPatients = signal(0);
    readonly totalPages = signal(0);

    readonly filteredPatients = computed(() => this.patients());

    ngOnInit(): void {
        // Search with a 300ms debounce.
        this.searchSubject
            .pipe(
                debounceTime(300),
                distinctUntilChanged(),
            )
            .subscribe(() => {
                this.currentPage.set(1);
                this.loadPatients();
            });

        // Load data and cancel stale requests when a new request starts.
        this.loadSubject
            .pipe(
                tap(() => {
                    this.loading.set(true);
                    this.errorMessage.set('');
                }),
                switchMap(() =>
                    this.patientsService.getPatients(
                        this.currentPage(),
                        this.pageSize(),
                        this.searchTerm(),
                    ).pipe(
                        catchError((error) => {
                            console.error('Failed to load patients:', error);

                            this.errorMessage.set(
                                error?.error?.message ||
                                'Unable to load patients. Please try again.',
                            );

                            return of(null);
                        }),
                    ),
                ),
            )
            .subscribe((response) => {
                if (response) {
                    this.patients.set(response.data);
                    this.totalPatients.set(response.meta.total);
                    this.totalPages.set(response.meta.totalPages);
                }

                this.loading.set(false);
            });

        this.loadPatients();
    }

    ngOnDestroy(): void {
        this.searchSubject.complete();
        this.loadSubject.complete();
    }

    loadPatients(): void {
        this.loadSubject.next();
    }

    updateSearch(value: string): void {
        this.searchTerm.set(value);
        this.searchSubject.next(value);
    }

    previousPage(): void {
        if (this.currentPage() > 1) {
            this.currentPage.update((page) => page - 1);
            this.loadPatients();
        }
    }

    nextPage(): void {
        if (this.currentPage() < this.totalPages()) {
            this.currentPage.update((page) => page + 1);
            this.loadPatients();
        }
    }

    changePageSize(value: number): void {
        this.pageSize.set(value);
        this.currentPage.set(1);
        this.loadPatients();
    }

    getPatientName(patient: Patient): string {
        return `${patient.firstName} ${patient.lastName}`;
    }

    getInitials(patient: Patient): string {
        return (
            `${patient.firstName.charAt(0)}${patient.lastName.charAt(0)}`
        ).toUpperCase();
    }
}