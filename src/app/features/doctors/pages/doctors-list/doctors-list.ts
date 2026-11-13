
import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';

import { DoctorsService } from '../../services/doctors.service';
import { Doctor } from '../../models/doctor.model';

@Component({
    selector: 'app-doctors-list',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './doctors-list.html',
})
export class DoctorsList {
    private readonly doctorsService = inject(DoctorsService);
    private readonly destroyRef = inject(DestroyRef);

    private readonly searchSubject = new Subject<string>();

    doctors = signal<Doctor[]>([]);
    loading = signal(false);
    errorMessage = signal('');

    searchTerm = signal('');
    isActive = signal(true);

    currentPage = signal(1);
    pageSize = signal(10);
    totalDoctors = signal(0);
    totalPages = signal(0);

    constructor() {
        this.searchSubject
            .pipe(
                debounceTime(300),
                distinctUntilChanged(),
                takeUntilDestroyed(this.destroyRef),
            )
            .subscribe(() => {
                this.currentPage.set(1);
                this.loadDoctors();
            });

        this.loadDoctors();
    }

    loadDoctors(): void {
        this.loading.set(true);
        this.errorMessage.set('');

        this.doctorsService.getDoctors(
            this.currentPage(),
            this.pageSize(),
            this.searchTerm(),
            this.isActive(),
        )
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (response) => {
                    this.doctors.set(response.data);
                    this.totalDoctors.set(response.meta.total);
                    this.totalPages.set(response.meta.totalPages);
                    this.loading.set(false);
                },
                error: (error) => {
                    this.loading.set(false);
                    this.errorMessage.set(
                        error?.error?.message || 'Unable to load doctors.',
                    );
                },
            });
    }

    updateSearch(value: string): void {
        this.searchTerm.set(value);
        this.searchSubject.next(value);
    }

    changeStatus(value: string): void {
        this.isActive.set(value === 'true');
        this.currentPage.set(1);
        this.loadDoctors();
    }

    changePageSize(value: number): void {
        this.pageSize.set(value);
        this.currentPage.set(1);
        this.loadDoctors();
    }

    previousPage(): void {
        if (this.currentPage() <= 1 || this.loading()) return;

        this.currentPage.update(page => page - 1);
        this.loadDoctors();
    }

    nextPage(): void {
        if (this.currentPage() >= this.totalPages() || this.loading()) return;

        this.currentPage.update(page => page + 1);
        this.loadDoctors();
    }

    getInitials(name: string): string {
        return name
            .split(' ')
            .filter(Boolean)
            .slice(0, 2)
            .map(part => part.charAt(0))
            .join('')
            .toUpperCase();
    }

    trackDoctor(_: number, doctor: Doctor): string {
        return doctor.id;
    }
}
