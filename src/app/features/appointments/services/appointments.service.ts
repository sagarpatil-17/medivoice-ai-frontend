
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';

import {
    Appointment,
    AppointmentAvailabilityResponse,
    AppointmentsResponse,
    AppointmentQuery,
    CreateAppointmentRequest,
    RescheduleAppointmentRequest,
    CancelAppointmentRequest,
} from '../models/appointment.model';

@Injectable({
    providedIn: 'root',
})
export class AppointmentsService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = `${environment.apiUrl}/appointments`;

    getAppointments(
        query: AppointmentQuery = {},
    ): Observable<AppointmentsResponse> {
        let params = new HttpParams()
            .set('page', query.page ?? 1)
            .set('limit', query.limit ?? 10);

        if (query.patientId) {
            params = params.set('patientId', query.patientId);
        }

        if (query.doctorId) {
            params = params.set('doctorId', query.doctorId);
        }

        if (query.status) {
            params = params.set('status', query.status);
        }

        if (query.from) {
            params = params.set('from', query.from);
        }

        if (query.to) {
            params = params.set('to', query.to);
        }

        return this.http.get<AppointmentsResponse>(this.apiUrl, {
            params,
        });
    }

    getAppointment(id: string): Observable<Appointment> {
        return this.http.get<Appointment>(`${this.apiUrl}/${id}`);
    }

    checkAvailability(
        doctorId: string,
        date: string,
    ): Observable<AppointmentAvailabilityResponse> {
        return this.http.post<AppointmentAvailabilityResponse>(
            `${this.apiUrl}/availability`,
            { doctorId, date },
        );
    }

    createAppointment(
        payload: CreateAppointmentRequest,
    ): Observable<Appointment> {
        return this.http.post<Appointment>(this.apiUrl, payload);
    }

    rescheduleAppointment(
        id: string,
        payload: RescheduleAppointmentRequest,
    ): Observable<Appointment> {
        return this.http.patch<Appointment>(
            `${this.apiUrl}/${id}/reschedule`,
            payload,
        );
    }

    cancelAppointment(
        id: string,
        payload: CancelAppointmentRequest,
    ): Observable<Appointment> {
        return this.http.patch<Appointment>(
            `${this.apiUrl}/${id}/cancel`,
            payload,
        );
    }

    completeAppointment(id: string): Observable<Appointment> {
        return this.http.patch<Appointment>(
            `${this.apiUrl}/${id}/complete`,
            {},
        );
    }

    markNoShow(id: string): Observable<Appointment> {
        return this.http.patch<Appointment>(
            `${this.apiUrl}/${id}/no-show`,
            {},
        );
    }
}
