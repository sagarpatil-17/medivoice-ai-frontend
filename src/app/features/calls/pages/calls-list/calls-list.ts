
import {
    Component,
    computed,
    inject,
    OnInit,
    signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { CallsService } from '../../services/calls.service';
import {
    Call,
    CallOutcome,
    CallStatus,
} from '../../models/call.model';

@Component({
    selector: 'app-calls-list',
    standalone: true,
    imports: [CommonModule, RouterLink, FormsModule],
    templateUrl: './calls-list.html',
})
export class CallsList implements OnInit {
    private readonly callsService = inject(CallsService);

    readonly calls = signal<Call[]>([]);
    readonly loading = signal(true);
    readonly errorMessage = signal('');

    readonly currentPage = signal(1);
    readonly pageSize = 10;
    readonly totalCalls = signal(0);
    readonly totalPages = signal(0);

    readonly selectedStatus = signal<CallStatus | ''>('');
    readonly selectedOutcome = signal<CallOutcome | ''>('');
    readonly search = signal('');

    readonly statuses: (CallStatus | '')[] = [
        '',
        'QUEUED',
        'RINGING',
        'IN_PROGRESS',
        'TRANSFERRING',
        'COMPLETED',
        'FAILED',
        'NO_ANSWER',
    ];

    readonly outcomes: (CallOutcome | '')[] = [
        '',
        'APPOINTMENT_BOOKED',
        'APPOINTMENT_CANCELLED',
        'HUMAN_TRANSFER',
        'FAQ_RESOLVED',
        'UNRESOLVED',
        'UNKNOWN',
    ];

    readonly showingFrom = computed(() =>
        this.totalCalls() === 0
            ? 0
            : (this.currentPage() - 1) * this.pageSize + 1,
    );

    readonly showingTo = computed(() =>
        Math.min(this.currentPage() * this.pageSize, this.totalCalls()),
    );

    ngOnInit(): void {
        this.loadCalls();
    }

    loadCalls(): void {
        this.loading.set(true);
        this.errorMessage.set('');

        this.callsService.getCalls({
            page: this.currentPage(),
            limit: this.pageSize,
            status: this.selectedStatus() || undefined,
            outcome: this.selectedOutcome() || undefined,
            search: this.search().trim() || undefined,
        })
            .pipe(finalize(() => this.loading.set(false)))
            .subscribe({
                next: (response) => {
                    this.calls.set(response.data);
                    this.totalCalls.set(response.meta.total);
                    this.totalPages.set(response.meta.totalPages);
                },
                error: () => {
                    this.errorMessage.set('Unable to load call history.');
                },
            });
    }

    applyFilters(): void {
        this.currentPage.set(1);
        this.loadCalls();
    }

    clearFilters(): void {
        this.search.set('');
        this.selectedStatus.set('');
        this.selectedOutcome.set('');
        this.currentPage.set(1);
        this.loadCalls();
    }

    changePage(page: number): void {
        if (page < 1 || page > this.totalPages()) return;

        this.currentPage.set(page);
        this.loadCalls();
    }

    statusClass(status: CallStatus): string {
        const classes: Record<CallStatus, string> = {
            QUEUED: 'bg-slate-100 text-slate-700',
            RINGING: 'bg-blue-100 text-blue-700',
            IN_PROGRESS: 'bg-amber-100 text-amber-700',
            TRANSFERRING: 'bg-purple-100 text-purple-700',
            COMPLETED: 'bg-emerald-100 text-emerald-700',
            FAILED: 'bg-red-100 text-red-700',
            NO_ANSWER: 'bg-orange-100 text-orange-700',
        };

        return classes[status];
    }

    outcomeLabel(outcome: CallOutcome): string {
        return outcome.replaceAll('_', ' ');
    }

    formatDuration(seconds: number | null): string {
        if (seconds === null) return '—';

        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;

        return `${minutes}m ${remainingSeconds}s`;
    }
}
