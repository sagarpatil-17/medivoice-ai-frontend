import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import {
    Department,
    DepartmentsResponse,
} from '../models/department.model';

@Injectable({
    providedIn: 'root',
})
export class DepartmentsService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = `${environment.apiUrl}/departments`;

    getDepartments(
        page = 1,
        limit = 100,
        search = '',
    ): Observable<DepartmentsResponse> {
        let params = new HttpParams()
            .set('page', page)
            .set('limit', limit);

        if (search.trim()) {
            params = params.set('search', search.trim());
        }

        return this.http.get<DepartmentsResponse>(this.apiUrl, { params });
    }

    getDepartment(id: string): Observable<Department> {
        return this.http.get<Department>(`${this.apiUrl}/${id}`);
    }
}