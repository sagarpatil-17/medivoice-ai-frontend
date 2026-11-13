
export type CallStatus =
    | 'QUEUED'
    | 'RINGING'
    | 'IN_PROGRESS'
    | 'TRANSFERRING'
    | 'COMPLETED'
    | 'FAILED'
    | 'NO_ANSWER';

export type CallOutcome =
    | 'APPOINTMENT_BOOKED'
    | 'APPOINTMENT_CANCELLED'
    | 'HUMAN_TRANSFER'
    | 'FAQ_RESOLVED'
    | 'UNRESOLVED'
    | 'UNKNOWN';

export interface Call {
    id: string;
    vapiCallId: string;
    status: CallStatus;
    outcome: CallOutcome;
    callType: string | null;
    customerNumber: string | null;
    startedAt: string | null;
    endedAt: string | null;
    durationSeconds: number | null;
    endedReason: string | null;
    createdAt: string;
}

export interface CallDetails extends Call {
    transcript: string | null;
    summary: string | null;
    recordingUrl: string | null;
    appointmentId: string | null;
    vapiStatus: string | null;
    updatedAt: string;
}

export interface CallsResponse {
    data: Call[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface CallsQuery {
    page?: number;
    limit?: number;
    status?: CallStatus;
    outcome?: CallOutcome;
    search?: string;
    from?: string;
    to?: string;
}

export interface CallsOverview {
    totalCalls: number;
    completedCalls: number;
    failedCalls: number;
    noAnswerCalls: number;
    inProgressCalls: number;
    averageDurationSeconds: number;
    outcomes: {
        outcome: CallOutcome;
        count: number;
    }[];
}
