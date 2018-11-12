export enum TServerStatus {
    IDLE = "idle",
    RUNNING = "running",
    COMPLETED = "completed"
}

export type TExecutingStressCommandRequest = {
    id: string;
    iterations: number;
    method: string;
    mode: string;
    threads: number;
    timeout: number;
    url: string;
};

export type TExecutingStressCommandTimings = {
    failed: number[];
    succeeded: number[];
};

export type TStatusResponsePayload = {
    status: TServerStatus;
    request?: TExecutingStressCommandRequest;
    timings?: TExecutingStressCommandTimings;
    totalSucceeded?: number;
    totalFailed?: number;
    totalTime?: number;
};