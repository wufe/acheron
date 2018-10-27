import * as React from 'react';
import { HeadCommand, BootingCommand, EchoCommand } from '../commands/static';
import { StressCommand } from '../commands/stress';
import { TConsoleMessage, TConsoleMessageType, TStressRequestCommand } from '../console/types';
import { interval, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import Axios, { AxiosResponse } from 'axios';
import { LOGIN_URL } from '../../utils/constants';
import { TServerStatus, TExecutingStressCommandRequest, TExecutingStressCommandTimings } from '../net/types';
import { AuthCommand } from '../commands/auth';
import { authenticationHolder } from '../net/auth';
import { retrieveStatus, performRequest } from '../net/request';
import { PerformCommand } from '../commands/perform';

enum TApplicationStatus {
    IDLE = 'idle',
    BOOTING = 'booting',
    RUNNING = 'running',
    COMPLETED = 'completed'
}

type TState = {
    consoleMessages: TConsoleMessage[];
    logMessages: string[];
    status: TApplicationStatus;
    request?: TExecutingStressCommandRequest;
    timings?: TExecutingStressCommandTimings;
    runningStressId: string;
};

const CHECK_POLL_INTERVAL = 500;
const PERFORM_POLL_INTERVAL = 50;

export class App extends React.Component<any, TState> {
    intervalSubscription: Subscription;
    scrollingContent: HTMLDivElement | null;

    constructor(props: any) {
        super(props);
        this.state = {
            consoleMessages: [],
            logMessages: ['v1.0.0-alpha.1'],
            status: TApplicationStatus.BOOTING,
            runningStressId: ''
        };
    }

    addConsoleMessage<T = any>(message: TConsoleMessage<T>): Promise<void> {
        return new Promise(resolve => {
            this.setState({
                ...this.state,
                consoleMessages: [
                    ...this.state.consoleMessages,
                    message
                ]
            }, () => {
                if (this.scrollingContent)
                    this.scrollingContent.scrollTop = this.scrollingContent.scrollHeight;
                resolve();
            });
        });
    }

    registerPoll(milliseconds = CHECK_POLL_INTERVAL) {
        this.intervalSubscription = interval(milliseconds)
            .pipe(switchMap(_ => retrieveStatus(authenticationHolder)))
                .subscribe(response => {
                    if (response.data.status === TServerStatus.IDLE &&
                        this.state.status !== TApplicationStatus.IDLE) {
                        let consoleMessages = [...this.state.consoleMessages];
                        let promise = Promise.resolve();
                        if (consoleMessages.length === 0 ||
                            consoleMessages[consoleMessages.length-1].type !== TConsoleMessageType.STRESS) {
                            promise = this.addConsoleMessage({ type: TConsoleMessageType.STRESS });
                        }
                        promise.then(() => {
                            this.setState({
                                ...this.state,
                                status: TApplicationStatus.IDLE
                            });
                        });
                    } else if (response.data.status === TServerStatus.RUNNING) {
                        let timings = this.state.timings;
                        if (timings) {
                            timings.succeeded.push(...response.data.timings!.succeeded);
                            response.data.timings!.succeeded = [];
                            timings.failed.push(...response.data.timings!.failed);
                            response.data.timings!.failed = [];
                        } else {
                            timings = response.data.timings;
                        }
                        let promise = Promise.resolve();
                        if (this.state.status !== TApplicationStatus.RUNNING) {
                            promise = new Promise<void>(resolve => {
                                this.setState({
                                    ...this.state,
                                    status: TApplicationStatus.RUNNING,
                                    request: response.data.request,
                                    runningStressId: response.data.request!.id,
                                    timings: timings ? {...timings} : undefined
                                }, () => resolve());
                            }).then(() => this.addConsoleMessage({
                                type: TConsoleMessageType.PERFORM,
                                data: {
                                    uuid: response.data.request!.id
                                }
                            })).then(() => {
                                this.intervalSubscription.unsubscribe();
                                this.registerPoll(PERFORM_POLL_INTERVAL);
                            });
                        } else {
                            this.setState({
                                ...this.state,
                                timings
                            });
                        }
                    } else if (response.data.status === TServerStatus.COMPLETED) {
                        let timings = this.state.timings;
                        if (timings) {
                            timings.succeeded.push(...response.data.timings!.succeeded);
                            response.data.timings!.succeeded = [];
                            timings.failed.push(...response.data.timings!.failed);
                            response.data.timings!.failed = [];
                        } else {
                            timings = response.data.timings;
                        }
                        let promise = Promise.resolve();
                        if (this.state.status !== TApplicationStatus.RUNNING) {
                            promise = promise.then(() => new Promise<void>(resolve => {
                                this.setState({
                                    ...this.state,
                                    status: TApplicationStatus.RUNNING,
                                    request: response.data.request,
                                    runningStressId: response.data.request!.id,
                                    timings: timings ? {...timings} : undefined
                                }, () => resolve());
                            })).then(() => this.addConsoleMessage({
                                type: TConsoleMessageType.PERFORM,
                                data: {
                                    uuid: response.data.request!.id
                                }
                            }));
                        }
                        promise = promise.then(() => new Promise<void>(resolve => this.setState({
                            ...this.state,
                            status: TApplicationStatus.COMPLETED,
                            runningStressId: '',
                            timings: timings ? {...timings} : undefined
                        }, () => resolve()))).then(() => {
                            if (this.intervalSubscription)
                                this.intervalSubscription.unsubscribe();
                            this.registerPoll();
                        })
                    }
                }, error => {
                    const response: AxiosResponse = error.response;
                    if (response && response.status === 401) {
                        this.addConsoleMessage({ type: TConsoleMessageType.AUTH });
                    }
                });
    }

    componentDidMount() {
        this.addConsoleMessage({ type: TConsoleMessageType.HEAD })
            .then(() => this.addConsoleMessage({ type: TConsoleMessageType.BOOTING }));
        setTimeout(() => {
            this.registerPoll();
        }, 1000);
    }

    componentWillUnmount() {
        if (this.intervalSubscription)
            this.intervalSubscription.unsubscribe();
    }

    authenticate = (password: string) => {
        Axios.post<{token: string}>(LOGIN_URL, {
            password
        }).then(({data}) => {
            this.addConsoleMessage({
                type: TConsoleMessageType.ECHO,
                data: {
                    content: 'Successful authentication.',
                    style: 'success'
                }
            }).then(() => {
                authenticationHolder.token = data.token;
                this.registerPoll();
            });
        }).catch(_ => {
            this.addConsoleMessage({
                type: TConsoleMessageType.ECHO,
                data: {
                    content: 'Wrong credentials.',
                    style: 'error'
                }
            }).then(() => this.addConsoleMessage({ type: TConsoleMessageType.AUTH }));
        });
    };

    submitStressCommand = (stressCommand: TStressRequestCommand) => {
        // stop polling
        this.intervalSubscription.unsubscribe();
        this.addConsoleMessage({
            type: TConsoleMessageType.ECHO,
            data: { content: 'Checking server status..', style: 'info' }
        }).then(() => retrieveStatus())
            .then(({data}) => {
                if (data.status === TServerStatus.IDLE) {
                    const url = /^http/i.test(stressCommand.url) ? stressCommand.url : `http://${stressCommand.url}`;
                    this.addConsoleMessage({
                        type: TConsoleMessageType.ECHO,
                        data: { content: 'Server is ready, processing command..', style: '' }
                    }).then(() => performRequest({
                        iterations: stressCommand.requests,
                        mode: stressCommand.mode,
                        threads: stressCommand.threads,
                        timeout: stressCommand.timeout,
                        url
                    })).then(() => this.registerPoll(PERFORM_POLL_INTERVAL));
                } else {
                    this.addConsoleMessage({
                        type: TConsoleMessageType.ECHO,
                        data: { content: 'Server is busy.', style: 'warning' }
                    }).then(() => this.registerPoll());
                }
            })
    };

    wrongStressCommandSubmission = () => {
        this.addConsoleMessage({
            type: TConsoleMessageType.ECHO,
            data: { content: 'Could not parse command.', style: 'warning' }
        }).then(() => this.addConsoleMessage({ type: TConsoleMessageType.STRESS }));
    };

    render() {
        return (
            <div className="app-container dark-theme">
                <div className="boot-log">
                    {this.state.logMessages.map((m, i) => <div key={i}>{m}</div>)}
                </div>
                <div className="scrolling-container">
                    <div ref={ref => this.scrollingContent = ref} className="scrolling-content">
                        {this.state.consoleMessages.map((m, i) => {
                            switch (m.type) {
                                case TConsoleMessageType.HEAD:
                                    return <HeadCommand key={i} />;
                                case TConsoleMessageType.BOOTING:
                                    return <BootingCommand key={i} />;
                                case TConsoleMessageType.STRESS:
                                    return <StressCommand key={i}
                                        onStressCommandSubmission={this.submitStressCommand}
                                        onWrongStressCommandSubmission={this.wrongStressCommandSubmission} />;
                                case TConsoleMessageType.AUTH:
                                    return <AuthCommand key={i}
                                        onAuthenticationSubmission={this.authenticate} />;
                                case TConsoleMessageType.ECHO:
                                    return <EchoCommand key={i}
                                        {...m.data} />
                                case TConsoleMessageType.PERFORM:
                                    return <PerformCommand key={i}
                                        completed={this.state.runningStressId !== m.data.uuid}
                                        request={this.state.request}
                                        timings={this.state.timings} />
                                default:
                                    return null;
                            }
                        })}
                    </div>
                </div>
            </div>
        );
    }
}