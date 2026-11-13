
import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';

import {
    CallDetails,
    CallsOverview,
    CallsQuery,
    CallsResponse,
} from '../models/call.model';

@Injectable({
    providedIn: 'root',
})
export class CallsService {
    private readonly http = inject(HttpClient);

    private readonly apiUrl = `${environment.apiUrl}/calls`;

    getCalls(query: CallsQuery = {}): Observable<CallsResponse> {
        let params = new HttpParams();

        Object.entries(query).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                params = params.set(key, String(value));
            }
        });

        return this.http.get<CallsResponse>(this.apiUrl, { params });
    }

    getCall(id: string): Observable<CallDetails> {
        return this.http.get<CallDetails>(`${this.apiUrl}/${id}`);
    }

    getOverview(): Observable<CallsOverview> {
        return this.http.get<CallsOverview>(`${this.apiUrl}/overview`);
    }
}
