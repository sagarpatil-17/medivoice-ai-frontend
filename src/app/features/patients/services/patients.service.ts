import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';

import {
    PatientDetails,
    PatientsResponse,
    CreatePatientRequest,
    UpdatePatientRequest,
    PatientAppointmentsResponse,
} from '../models/patient.model';

@Injectable({
    providedIn: 'root',
})
export class PatientsService {
    private readonly http = inject(HttpClient);

    private readonly apiUrl = `${environment.apiUrl}/patients`;

    getPatients(
        page = 1,
        limit = 10,
        search = '',
    ): Observable<PatientsResponse> {
        let params = new HttpParams()
            .set('page', page)
            .set('limit', limit);

        if (search.trim()) {
            params = params.set('search', search.trim());
        }

        return this.http.get<PatientsResponse>(this.apiUrl, {
            params,
        });
    }

    getPatient(id: string): Observable<PatientDetails> {
        return this.http.get<PatientDetails>(
            `${this.apiUrl}/${id}`,
        );
    }

    createPatient(
        payload: CreatePatientRequest,
    ): Observable<PatientDetails> {
        return this.http.post<PatientDetails>(
            this.apiUrl,
            payload,
        );
    }

    updatePatient(
        id: string,
        payload: UpdatePatientRequest,
    ): Observable<PatientDetails> {
        return this.http.patch<PatientDetails>(
            `${this.apiUrl}/${id}`,
            payload,
        );
    }

    getPatientAppointments(
        id: string,
    ): Observable<PatientAppointmentsResponse> {
        return this.http.get<PatientAppointmentsResponse>(
            `${this.apiUrl}/${id}/appointments`,
        );
    }
}