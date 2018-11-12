import { TExecutingStressCommandRequest } from "../net/types";

export enum TConsoleMessageType {
    HEAD = "head",
    BOOTING = "booting",
    STRESS = "stress",
    AUTH = "auth",
    ECHO = "echo",
    PERFORM = "perform"
}

export enum TStressMode {
    TIMEOUT = "timeout",
    REQUESTS = "requests",
    REQUESTS_PER_THREAD = "requests_per_thread"
}

export type TConsoleMessage<T = any> = {
    type: TConsoleMessageType;
    data?: T;
};

export type TPerformMessageData = {
    id: string;
    running: boolean;
    request: TExecutingStressCommandRequest;
    timings: {
        failed: number[];
        succeeded: number[];
    };
    totalSucceeded?: number;
    totalFailed?: number;
    totalTime?: number;
};

export type TStressRequestCommand = {
    mode: TStressMode;
    requests: number;
    threads: number;
    timeout: number;
    url: string;
};