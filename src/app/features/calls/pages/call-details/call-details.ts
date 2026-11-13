
import {
    Component,
    computed,
    inject,
    OnInit,
    signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { CallsService } from '../../services/calls.service';
import {
    CallDetails as CallDetailsModel,
    CallStatus,
    CallOutcome,
} from '../../models/call.model';

@Component({
    selector: 'app-call-details',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './call-details.html',
})
export class CallDetails implements OnInit {
    private readonly route = inject(ActivatedRoute);
    private readonly callsService = inject(CallsService);

    readonly call = signal<CallDetailsModel | null>(null);
    readonly loading = signal(true);
    readonly errorMessage = signal('');

    readonly transcriptLines = computed(() => {
        const transcript = this.call()?.transcript;

        if (!transcript?.trim()) {
            return [];
        }

        return transcript
            .split('\n')
            .map(line => line.trim())
            .filter(Boolean);
    });

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('id');

        if (!id) {
            this.errorMessage.set('Invalid call ID.');
            this.loading.set(false);
            return;
        }

        this.loadCall(id);
    }

    loadCall(id: string): void {
        this.loading.set(true);
        this.errorMessage.set('');

        this.callsService.getCall(id)
            .pipe(finalize(() => this.loading.set(false)))
            .subscribe({
                next: response => this.call.set(response),
                error: () => {
                    this.errorMessage.set(
                        'Unable to load call details. Please try again.',
                    );
                },
            });
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

    transcriptSpeaker(line: string): string {
        const separator = line.indexOf(':');

        if (separator === -1) {
            return 'Conversation';
        }

        return line.slice(0, separator).trim();
    }

    transcriptMessage(line: string): string {
        const separator = line.indexOf(':');

        if (separator === -1) {
            return line;
        }

        return line.slice(separator + 1).trim();
    }

    isAssistantLine(line: string): boolean {
        const speaker = this.transcriptSpeaker(line).toLowerCase();

        return [
            'assistant',
            'bot',
            'ai',
            'assistant:',
        ].includes(speaker);
    }

    isRecordingUrlSafe(url: string | null): boolean {
        if (!url) return false;

        try {
            const parsed = new URL(url);

            return parsed.protocol === 'https:';
        } catch {
            return false;
        }
    }
}
