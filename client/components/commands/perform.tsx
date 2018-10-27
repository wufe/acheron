import * as React from 'react';
import { TExecutingStressCommandRequest, TExecutingStressCommandTimings } from '../net/types';
const { Group } = require('@vx/group');
const { Bar } = require('@vx/shape');
const { scaleLinear, scaleBand } = require('@vx/scale');

type TProps = {
    request?: TExecutingStressCommandRequest;
    timings?: TExecutingStressCommandTimings;
    completed: boolean;
};

type TState = {
    width: number;
    height: number;
};

const ALPHA = 0.2;

export class PerformCommand extends React.Component<TProps, TState> {

    constructor(props: TProps) {
        super(props);
        this.state = {
            height: 50,
            width: 800
        };
    }

    shouldComponentUpdate() {
        return !this.props.completed;
    }

    render() {
        let xScale: any;
        let yScale: any;
        let compose: any;
        let yPoint: any;
        let timings: number[] = [];
        if (this.props.timings) {
            const step = Math.ceil(this.props.timings!.succeeded.length / this.state.width);
            timings = this.props.timings.succeeded.length < this.state.width ?
                this.props.timings.succeeded :
                this.props.timings.succeeded.reduce<number[]>((a, t, i) => {
                    if (i % (step) === 0) {
                        const slice = this.props.timings!.succeeded.slice(i, i+step);
                        const average = slice.reduce((sum, element) => sum+element, 0)/slice.length;
                        const lastAverage = a.length > 0 ? a[a.length-1] : null;
                        if (lastAverage === null) {
                            a.push(average);
                        } else {
                            a.push(ALPHA * average + (1 - ALPHA) * lastAverage);
                        }
                    }
                    return a;
                }, []);

            xScale = scaleBand({
                rangeRound: [0, this.state.width],
                domain: timings.map((x, i) => i),
                padding: 0
            });
            yScale = scaleLinear({
                rangeRound: [this.state.height, 0],
                domain: [0, Math.max(...timings)]
            });
            compose = (scale: any, accessor: any) => (data: any) => scale(accessor(data));
            yPoint = compose(yScale, (d: number) => d);
        }
        
        return <div className="terminal-container">
            <div>Performing stress test</div>
            <div className="graph-command">
                {this.props.timings && <svg width={this.state.width} height={this.state.height}>
                    {timings.map((d, i) => {
                        const barHeight = this.state.height - yScale(d);
                        return (
                            <Group key={`bar-${i}`}>
                                <Bar
                                    x={i+1}
                                    y={this.state.height - barHeight}
                                    height={barHeight}
                                    width={1}
                                    fill='#bb0000' />
                            </Group>
                        );
                    })}
                </svg>}
            </div>
        </div>;
    }
}