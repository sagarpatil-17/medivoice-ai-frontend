import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import {
    CreateDoctorScheduleRequest,
    DoctorSchedule,
    UpdateDoctorScheduleRequest,
} from '../models/doctor-schedule.model';

@Injectable({
    providedIn: 'root',
})
export class DoctorSchedulesService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = `${environment.apiUrl}/doctor-schedules`;

    getDoctorSchedules(doctorId: string): Observable<DoctorSchedule[]> {
        return this.http.get<DoctorSchedule[]>(
            `${this.apiUrl}/doctor/${doctorId}`,
        );
    }

    createSchedule(
        payload: CreateDoctorScheduleRequest,
    ): Observable<DoctorSchedule> {
        return this.http.post<DoctorSchedule>(this.apiUrl, payload);
    }

    deactivateSchedule(id: string): Observable<DoctorSchedule> {
        return this.http.patch<DoctorSchedule>(
            `${this.apiUrl}/${id}/deactivate`,
            {},
        );
    }

    updateSchedule(
        id: string,
        payload: UpdateDoctorScheduleRequest,
    ): Observable<DoctorSchedule> {
        return this.http.patch<DoctorSchedule>(
            `${this.apiUrl}/${id}`,
            payload,
        );
    }
}