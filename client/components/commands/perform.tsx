import * as React from 'react';
import { TExecutingStressCommandRequest, TExecutingStressCommandTimings } from '../net/types';
const { Group } = require('@vx/group');
const { AreaClosed, Line, Bar } = require('@vx/shape');
const { curveMonotoneX } = require('@vx/curve');
const { LinearGradient } = require('@vx/gradient');
const { GridRows, GridColumns } = require('@vx/grid');
const { scaleLinear, scaleBand, scaleTime } = require('@vx/scale');

type TProps = {
    request?: TExecutingStressCommandRequest;
    timings: TExecutingStressCommandTimings;
    completed: boolean;
    totalSucceeded?: number;
    totalFailed?: number;
    totalTime?: number;
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
            height: 100,
            width: 800
        };
    }

    checkPropsChanged = (nextProps: TProps) => {
        const {request, timings, completed} = nextProps;
        return request !== this.props.request ||
            timings !== this.props.timings ||
            completed !== this.props.completed;
    };

    shouldComponentUpdate(nextProps: TProps, nextState: TState) {
        return !this.props.completed;
    }

    render() {
        const {succeeded} = this.props.timings;
        let xScale: any;
        let yScale: any;
        let compose: any;
        let xPoint: any;
        let yPoint: any;
        let timings: number[] = [];
        let average = "0";
        let succeededAmount = 0;
        if (this.props.timings) {
            const step = Math.floor(succeeded.length / this.state.width);
            if (succeeded.length < this.state.width) {
                timings = [...succeeded];
            } else {
                timings = [];
                // exponential moving average calculation
                for (let i = 0; i < this.state.width; i++) {
                    const startingIndex = i*step;
                    const endingIndex = startingIndex + step;
                    const slice = succeeded.slice(startingIndex, endingIndex);
                    const average = slice.reduce((sum, element) => sum+element, 0)/slice.length;
                    const lastEMA = timings.length > 0 ? timings[timings.length-1] : null;
                    if (lastEMA === null) {
                        timings.push(average);
                    } else {
                        timings.push(ALPHA * average + (1 - ALPHA) * lastEMA);
                    }
                }
            }
            if (!succeeded.length) {
                average = (0).toFixed(2);
            } else {
                const sum = succeeded.reduce((s, i) => s + i, 0);
                average = (sum / succeeded.length).toFixed(2);
            }
            succeededAmount = succeeded.length;

            xScale = scaleBand({
                rangeRound: [0, timings.length],
                domain: timings.map((x, i) => i),
                padding: 0
            });
            yScale = scaleLinear({
                rangeRound: [this.state.height, 0],
                domain: [0, Math.max(...timings)]
            });
            compose = (scale: any, accessor: any) => (data: any) => scale(accessor(data));
            xPoint = (d: number, i: number) => i;
            yPoint = (d: number) => d;

        }
        
        return <div className="terminal-container">
            <div className="display-flex space-between-content">
                <span>Performing stress test</span>
                <button className="action">Stop</button>
            </div>
            <div className="graph-command">
                {this.props.timings && <svg width={this.state.width} height={this.state.height}>
                    <rect
                        x={0}
                        y={0}
                        width={timings.length}
                        height={this.state.height}
                        fill="#222222"
                        rx={0} />
                    <defs>
                        <linearGradient
                            id="gradient"
                            x1="0%"
                            y1="0%"
                            x2="0%"
                            y2="100%">
                            <stop
                                offset="0%"
                                stopColor="#FFFFFF"
                                stopOpacity={1}
                            />
                            <stop
                                offset="100%"
                                stopColor="#FFFFFF"
                                stopOpacity={0.2}
                            />
                        </linearGradient>
                    </defs>
                    <GridRows
                        lineStyle={{ pointerEvents: 'none' }}
                        scale={yScale}
                        width={timings.length}
                        strokeDasharray="2,2"
                        stroke="rgba(255,255,255,0.05)" />
                    <GridColumns
                        lineStyle={{ pointerEvents: 'none' }}
                        scale={xScale}
                        height={this.state.height}
                        strokeDasharray="2,2"
                        stroke="rgba(255,255,255,0.05)" />
                    <AreaClosed
                        data={timings}
                        xScale={xScale}
                        yScale={yScale}
                        x={xPoint}
                        y={yPoint}
                        strokeWidth={1}
                        stroke={'url(#gradient)'}
                        fill={'url(#gradient)'}
                        curve={curveMonotoneX} />
                </svg>}
            </div>
            <div>Average (ms per request): {average}ms</div>
            <div>Succeeded requests: {this.props.totalSucceeded || succeededAmount}</div>
            {!!this.props.totalTime && <div>Total time elapsed: {this.props.totalTime}ms</div>}
            {!!this.props.totalTime && !!this.props.totalSucceeded && <div>Total average: {(this.props.totalTime / this.props.totalSucceeded).toFixed(2)}ms</div>}
        </div>;
    }
}