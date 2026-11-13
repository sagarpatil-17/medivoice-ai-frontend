import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';

import {
    DashboardOverview,
    RecentAppointmentsResponse,
    AppointmentTrendsResponse,
    AppointmentStatusResponse,
    DepartmentStatsResponse,
} from '../models/dashboard.model';

@Injectable({
    providedIn: 'root',
})
export class DashboardService {
    private readonly http = inject(HttpClient);

    private readonly apiUrl = `${environment.apiUrl}/dashboard`;

    getOverview(): Observable<DashboardOverview> {
        return this.http.get<DashboardOverview>(
            `${this.apiUrl}/overview`,
        );
    }

    getRecentAppointments(
        limit = 5,
    ): Observable<RecentAppointmentsResponse> {
        return this.http.get<RecentAppointmentsResponse>(
            `${this.apiUrl}/recent-appointments`,
            {
                params: { limit },
            },
        );
    }

    getAppointmentTrends(
        days: 7 | 30 = 7,
    ): Observable<AppointmentTrendsResponse> {
        return this.http.get<AppointmentTrendsResponse>(
            `${this.apiUrl}/appointment-trends`,
            {
                params: { days },
            },
        );
    }

    getAppointmentStatus(): Observable<AppointmentStatusResponse> {
        return this.http.get<AppointmentStatusResponse>(
            `${this.apiUrl}/appointment-status`,
        );
    }

    getDepartmentStats(): Observable<DepartmentStatsResponse> {
        return this.http.get<DepartmentStatsResponse>(
            `${this.apiUrl}/department-stats`,
        );
    }
}