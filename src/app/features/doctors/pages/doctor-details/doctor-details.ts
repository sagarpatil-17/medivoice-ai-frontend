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
import { CreateDoctorScheduleRequest, DoctorSchedule, UpdateDoctorScheduleRequest } from '../../models/doctor-schedule.model';
import { DoctorsService } from '../../services/doctors.service';
import { DoctorSchedulesService } from '../../services/doctor-schedules.service';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
    selector: 'app-doctor-details',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterLink],
    templateUrl: './doctor-details.html',
})
export class DoctorDetails {
    private readonly route = inject(ActivatedRoute);
    private readonly doctorsService = inject(DoctorsService);
    private readonly schedulesService = inject(DoctorSchedulesService);
    private readonly destroyRef = inject(DestroyRef);
    private readonly fb = inject(FormBuilder);

    readonly doctor = signal<Doctor | null>(null);
    readonly schedules = signal<DoctorSchedule[]>([]);
    readonly loading = signal(true);
    readonly errorMessage = signal('');

    readonly canManageSchedules = signal(true);
    readonly savingSchedule = signal(false);
    readonly scheduleError = signal('');
    readonly scheduleSuccess = signal('');

    readonly editingScheduleId = signal<string | null>(null);
    readonly showScheduleForm = signal(false);

    readonly scheduleForm = this.fb.nonNullable.group({
        dayOfWeek: [1, Validators.required],
        startTime: ['09:00', Validators.required],
        endTime: ['17:00', Validators.required],
        slotDurationMinutes: [30, [
            Validators.required,
            Validators.min(5),
            Validators.max(240),
        ]],
        breakStartTime: [''],
        breakEndTime: [''],
    });

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

    openAddSchedule(): void {
        this.editingScheduleId.set(null);
        this.scheduleError.set('');
        this.scheduleSuccess.set('');

        this.scheduleForm.reset({
            dayOfWeek: 1,
            startTime: '09:00',
            endTime: '17:00',
            slotDurationMinutes: 30,
            breakStartTime: '',
            breakEndTime: '',
        });

        this.showScheduleForm.set(true);
    }

    openEditSchedule(schedule: DoctorSchedule): void {
        this.editingScheduleId.set(schedule.id);
        this.scheduleError.set('');
        this.scheduleSuccess.set('');

        this.scheduleForm.reset({
            dayOfWeek: schedule.dayOfWeek,
            startTime: schedule.startTime,
            endTime: schedule.endTime,
            slotDurationMinutes: schedule.slotDurationMinutes,
            breakStartTime: schedule.breakStartTime ?? '',
            breakEndTime: schedule.breakEndTime ?? '',
        });

        this.showScheduleForm.set(true);
    }

    closeScheduleForm(): void {
        this.showScheduleForm.set(false);
        this.editingScheduleId.set(null);
        this.scheduleError.set('');
    }

    saveSchedule(): void {
        if (this.scheduleForm.invalid || this.savingSchedule()) {
            this.scheduleForm.markAllAsTouched();
            return;
        }

        const doctorId = this.route.snapshot.paramMap.get('id');

        if (!doctorId) return;

        const value = this.scheduleForm.getRawValue();

        const start = this.toMinutes(value.startTime);
        const end = this.toMinutes(value.endTime);

        if (end <= start) {
            this.scheduleError.set('End time must be later than start time.');
            return;
        }

        const hasBreakStart = !!value.breakStartTime;
        const hasBreakEnd = !!value.breakEndTime;

        if (hasBreakStart !== hasBreakEnd) {
            this.scheduleError.set(
                'Please provide both break start and break end times.',
            );
            return;
        }

        if (hasBreakStart && hasBreakEnd) {
            const breakStart = this.toMinutes(value.breakStartTime);
            const breakEnd = this.toMinutes(value.breakEndTime);

            if (
                breakStart <= start ||
                breakEnd >= end ||
                breakEnd <= breakStart
            ) {
                this.scheduleError.set(
                    'Break must be within the shift and have a valid duration.',
                );
                return;
            }
        }

        this.savingSchedule.set(true);
        this.scheduleError.set('');
        this.scheduleSuccess.set('');

        const payload: CreateDoctorScheduleRequest = {
            doctorId,
            dayOfWeek: Number(value.dayOfWeek),
            startTime: value.startTime,
            endTime: value.endTime,
            slotDurationMinutes: Number(value.slotDurationMinutes),
            breakStartTime: value.breakStartTime || undefined,
            breakEndTime: value.breakEndTime || undefined,
            isActive: true,
        };

        const editingId = this.editingScheduleId();

        const request = editingId
            ? this.schedulesService.updateSchedule(editingId, {
                dayOfWeek: payload.dayOfWeek,
                startTime: payload.startTime,
                endTime: payload.endTime,
                slotDurationMinutes: payload.slotDurationMinutes,
                breakStartTime: payload.breakStartTime ?? null,
                breakEndTime: payload.breakEndTime ?? null,
            } satisfies UpdateDoctorScheduleRequest)
            : this.schedulesService.createSchedule(payload);

        request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: () => {
                this.savingSchedule.set(false);
                this.showScheduleForm.set(false);
                this.editingScheduleId.set(null);
                this.scheduleSuccess.set(
                    editingId ? 'Schedule updated successfully.' : 'Schedule added successfully.',
                );
                this.reloadSchedules(doctorId);
            },
            error: (error) => {
                this.savingSchedule.set(false);
                this.scheduleError.set(
                    error?.error?.message || 'Unable to save schedule.',
                );
            },
        });
    }

    deactivateSchedule(schedule: DoctorSchedule): void {
        const confirmed = window.confirm(
            `Deactivate the ${this.getDayName(schedule.dayOfWeek)} shift (${schedule.startTime} - ${schedule.endTime})?`,
        );

        if (!confirmed) return;

        this.schedulesService
            .deactivateSchedule(schedule.id)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: () => {
                    this.scheduleSuccess.set('Schedule deactivated successfully.');

                    const doctorId = this.route.snapshot.paramMap.get('id');
                    if (doctorId) this.reloadSchedules(doctorId);
                },
                error: (error) => {
                    this.scheduleError.set(
                        error?.error?.message || 'Unable to deactivate schedule.',
                    );
                },
            });
    }

    private reloadSchedules(doctorId: string): void {
        this.schedulesService
            .getDoctorSchedules(doctorId)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (schedules) => this.schedules.set(schedules),
                error: () => this.scheduleError.set('Unable to refresh schedules.'),
            });
    }

    private toMinutes(time: string): number {
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
    }
}