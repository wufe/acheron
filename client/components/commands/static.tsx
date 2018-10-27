import * as React from 'react';

export const HeadCommand = () => <h1>Acheron</h1>;
export const BootingCommand = () => <h3>Booting up..</h3>;
export const EchoCommand = (props: {content: string, style?: string}) =>
    <div className="terminal-container">
        <div className={`echo ${props.style}`}>
            <span>{props.content}</span>
        </div>
    </div>