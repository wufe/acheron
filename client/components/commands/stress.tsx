import * as React from 'react';
import { TStressMode, TStressRequestCommand } from '../console/types';
import { filterKeyEnter } from '../../utils/handlers';

type TProps = {
    onStressCommandSubmission: (stressRequest: TStressRequestCommand) => any;
    onWrongStressCommandSubmission: () => any;
};

type TState = {
    mode: TStressMode;
    requests: string;
    submitted: boolean;
    threads: string;
    timeout: string;
    url: string;
};

export class StressCommand extends React.Component<TProps, TState> {

    constructor(props: any) {
        super(props);
        this.state = {
            mode: TStressMode.TIMEOUT,
            requests: '100',
            submitted: false,
            threads: '10',
            timeout: '3000',
            url: ''
        };
    }

    valueChanged(stateProperty: keyof TState) {
        return (event: React.ChangeEvent) => {
            const value = (event.target as (HTMLInputElement | HTMLSelectElement)).value;
            this.setState({
                ...this.state,
                [stateProperty]: value
            });
        }
    }

    parseCommandAndSubmit = (event: React.KeyboardEvent) => {
        this.setState({
            ...this.state,
            submitted: true
        }, () => {
            const requests = parseInt(this.state.requests);
            const threads = parseInt(this.state.threads);
            const timeout = parseInt(this.state.timeout);
            if (isNaN(requests) || isNaN(threads) || isNaN(timeout) || !this.state.url.trim()) {
                this.props.onWrongStressCommandSubmission();
            } else {
                this.props.onStressCommandSubmission({
                    mode: this.state.mode,
                    requests,
                    threads,
                    timeout,
                    url: this.state.url
                });
            }
        });
    };

    render() {
        return <div className="terminal-container">
            <div>
                <span>Compile the command template then press enter to start a stress test:</span>
            </div>
            <div>
                <span>$ acheron stress start --url</span>
                {this.state.submitted && <span>"{this.state.url}"</span>}
                {!this.state.submitted && <input
                    autoFocus={true}
                    onChange={this.valueChanged('url')}
                    onKeyUp={filterKeyEnter(this.parseCommandAndSubmit)}
                    placeholder="https://"
                    type="text"
                    value={this.state.url} />}
                {this.state.submitted && <span>{this.state.mode}</span>}
                {!this.state.submitted && <select
                    value={this.state.mode}
                    onChange={this.valueChanged('mode')}>
                    <option
                        value={TStressMode.TIMEOUT}>--timeout</option>
                    <option
                        value={TStressMode.REQUESTS}>--requests</option>
                </select>}
                {this.state.submitted && this.state.mode === TStressMode.TIMEOUT && <span>{this.state.timeout}</span>}
                {!this.state.submitted && this.state.mode === TStressMode.TIMEOUT && <input
                    onChange={this.valueChanged('timeout')}
                    onKeyUp={filterKeyEnter(this.parseCommandAndSubmit)}
                    placeholder="3000"
                    title="Timeout in milliseconds"
                    type="text"
                    value={this.state.timeout} />}
                {this.state.submitted && this.state.mode === TStressMode.REQUESTS && <span>{this.state.requests}</span>}
                {!this.state.submitted && this.state.mode === TStressMode.REQUESTS && <input
                    onChange={this.valueChanged('requests')}
                    onKeyUp={filterKeyEnter(this.parseCommandAndSubmit)}
                    placeholder="3000"
                    title="Amount of requests to be performed"
                    type="text"
                    value={this.state.requests} />}
                <span>--threads</span>
                {this.state.submitted && <span>{this.state.threads}</span>}
                {!this.state.submitted && <input
                    onChange={this.valueChanged('threads')}
                    onKeyUp={filterKeyEnter(this.parseCommandAndSubmit)}
                    placeholder="10"
                    title="Number of threads to be used to perform requests"
                    type="text"
                    value={this.state.threads} />}
            </div>
        </div>
    }
}