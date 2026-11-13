import {
    Component,
    computed,
    DestroyRef,
    inject,
    signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';

import { Doctor } from '../../models/doctor.model';
import { DoctorSchedule } from '../../models/doctor-schedule.model';
import { DoctorsService } from '../../services/doctors.service';
import { DoctorSchedulesService } from '../../services/doctor-schedules.service';

@Component({
    selector: 'app-doctor-details',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './doctor-details.html',
})
export class DoctorDetails {
    private readonly route = inject(ActivatedRoute);
    private readonly doctorsService = inject(DoctorsService);
    private readonly schedulesService = inject(DoctorSchedulesService);
    private readonly destroyRef = inject(DestroyRef);

    readonly doctor = signal<Doctor | null>(null);
    readonly schedules = signal<DoctorSchedule[]>([]);
    readonly loading = signal(true);
    readonly errorMessage = signal('');

    readonly days = [
        { value: 0, label: 'Sunday' },
        { value: 1, label: 'Monday' },
        { value: 2, label: 'Tuesday' },
        { value: 3, label: 'Wednesday' },
        { value: 4, label: 'Thursday' },
        { value: 5, label: 'Friday' },
        { value: 6, label: 'Saturday' },
    ];

    readonly weeklySchedule = computed(() =>
        this.days.map((day) => ({
            ...day,
            schedules: this.schedules()
                .filter((schedule) => schedule.dayOfWeek === day.value)
                .sort((a, b) => a.startTime.localeCompare(b.startTime)),
        })),
    );

    constructor() {
        const doctorId = this.route.snapshot.paramMap.get('id');

        if (!doctorId) {
            this.errorMessage.set('Doctor ID is missing.');
            this.loading.set(false);
            return;
        }

        this.loadDoctorDetails(doctorId);
    }

    loadDoctorDetails(doctorId: string): void {
        this.loading.set(true);
        this.errorMessage.set('');

        forkJoin({
            doctor: this.doctorsService.getDoctor(doctorId),
            schedules: this.schedulesService.getDoctorSchedules(doctorId),
        })
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: ({ doctor, schedules }) => {
                    this.doctor.set(doctor);
                    this.schedules.set(schedules);
                    this.loading.set(false);
                },
                error: (error) => {
                    this.errorMessage.set(
                        error?.error?.message ||
                        'Unable to load doctor details. Please try again.',
                    );
                    this.loading.set(false);
                },
            });
    }

    getInitials(name: string): string {
        return name
            .split(' ')
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0])
            .join('')
            .toUpperCase();
    }

    getDayName(dayOfWeek: number): string {
        return this.days.find((day) => day.value === dayOfWeek)?.label ?? '';
    }

    formatTime(time: string): string {
        const [hours, minutes] = time.split(':').map(Number);
        const date = new Date();
        date.setHours(hours, minutes, 0, 0);

        return date.toLocaleTimeString('en-IN', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
        });
    }

    retry(): void {
        const doctorId = this.route.snapshot.paramMap.get('id');

        if (doctorId) {
            this.loadDoctorDetails(doctorId);
        }
    }
}