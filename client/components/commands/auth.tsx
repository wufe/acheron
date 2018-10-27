import * as React from 'react';
import { filterKeyEnter } from '../../utils/handlers';

type TProps = {
    onAuthenticationSubmission: (password: string) => void;
};

type TState = {
    submitted: boolean;
};

export class AuthCommand
    extends React.Component<TProps, TState> {

    constructor(props: TProps) {
        super(props);
        this.state = {
            submitted: false
        };
    }

    onKeyEnter = (event: React.KeyboardEvent<HTMLInputElement>) => {
        const password = (event.target as HTMLInputElement).value;
        this.setState({
            ...this.state,
            submitted: true
        });
        setTimeout(() => {
            this.props.onAuthenticationSubmission(password);
        }, 500);
    }

    render() {
        return <div className="terminal-container">
            <div>
                <span>Authenticate:</span>
            </div>
            <div>
                <span>$ acheron auth</span>
                {this.state.submitted ?
                    <span>*******</span> :
                    <input
                        type="password"
                        placeholder="password"
                        onKeyUp={filterKeyEnter(this.onKeyEnter)}
                        autoFocus={true} />}
            </div>
        </div>;
    }
}