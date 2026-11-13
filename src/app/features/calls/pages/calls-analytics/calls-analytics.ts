
import {
    Component,
    computed,
    inject,
    signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { CallsService } from '../../services/calls.service';
import { CallsOverview } from '../../models/call.model';

@Component({
    selector: 'app-calls-analytics',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './calls-analytics.html',
})
export class CallsAnalytics {
    private readonly callsService = inject(CallsService);

    readonly overview = signal<CallsOverview | null>(null);
    readonly loading = signal(true);
    readonly errorMessage = signal('');

    readonly outcomeItems = computed(() => {
        const data = this.overview();

        if (!data) return [];

        const total = data.outcomes.reduce(
            (sum, item) => sum + item.count,
            0,
        );

        return data.outcomes.map((item) => ({
            ...item,
            percentage: total
                ? Math.round((item.count / total) * 100)
                : 0,
            label: this.getOutcomeLabel(item.outcome),
            color: this.getOutcomeColor(item.outcome),
        }));
    });

    readonly successRate = computed(() => {
        const data = this.overview();

        if (!data || data.totalCalls === 0) return 0;

        const successful =
            data.outcomes.find(
                (item) => item.outcome === 'APPOINTMENT_BOOKED',
            )?.count ?? 0;

        return Math.round(
            (successful / data.totalCalls) * 100,
        );
    });

    readonly completionRate = computed(() => {
        const data = this.overview();

        if (!data || data.totalCalls === 0) return 0;

        return Math.round(
            (data.completedCalls / data.totalCalls) * 100,
        );
    });

    readonly totalOutcomeCalls = computed(() => {
        return this.overview()?.outcomes.reduce(
            (sum, item) => sum + item.count,
            0,
        ) ?? 0;
    });

    constructor() {
        this.loadAnalytics();
    }

    loadAnalytics(): void {
        this.loading.set(true);
        this.errorMessage.set('');

        this.callsService.getOverview().subscribe({
            next: (response) => {
                this.overview.set(response);
                this.loading.set(false);
            },
            error: (error) => {
                console.error('Failed to load call analytics:', error);

                this.errorMessage.set(
                    error?.error?.message ??
                    'Unable to load call analytics. Please try again.',
                );

                this.loading.set(false);
            },
        });
    }

    getOutcomeLabel(outcome: string): string {
        const labels: Record<string, string> = {
            APPOINTMENT_BOOKED: 'Appointment booked',
            APPOINTMENT_CANCELLED: 'Appointment cancelled',
            HUMAN_TRANSFER: 'Human transfer',
            FAQ_RESOLVED: 'FAQ resolved',
            UNRESOLVED: 'Unresolved',
            UNKNOWN: 'Unknown',
        };

        return labels[outcome] ?? outcome;
    }

    getOutcomeColor(outcome: string): string {
        const colors: Record<string, string> = {
            APPOINTMENT_BOOKED: 'bg-emerald-500',
            APPOINTMENT_CANCELLED: 'bg-amber-500',
            HUMAN_TRANSFER: 'bg-blue-500',
            FAQ_RESOLVED: 'bg-teal-500',
            UNRESOLVED: 'bg-rose-500',
            UNKNOWN: 'bg-slate-400',
        };

        return colors[outcome] ?? 'bg-slate-400';
    }

    formatDuration(seconds: number): string {
        if (!seconds || seconds < 0) return '0 sec';

        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;

        if (minutes === 0) {
            return `${remainingSeconds} sec`;
        }

        return `${minutes} min ${remainingSeconds} sec`;
    }

    getOutcomeCount(outcome: string): number {
        return (
            this.overview()?.outcomes.find(
                (item) => item.outcome === outcome,
            )?.count ?? 0
        );
    }
}
