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
        return !this.props.completed/* &&
            (nextState !== this.state ||
            this.checkPropsChanged(nextProps))*/;
    }

    render() {
        let xScale: any;
        let yScale: any;
        let compose: any;
        let xPoint: any;
        let yPoint: any;
        let timings: number[] = [];
        let average = "0";
        let succeededAmount = 0;
        if (this.props.timings) {
            const step = Math.floor(this.props.timings!.succeeded.length / this.state.width);
            let timingSum = 0;
            if (this.props.timings.succeeded.length < this.state.width) {
                this.props.timings.succeeded.forEach(timing => {
                    timingSum += timing;
                });
            } else {
                timings = [];
                for (let i = 0; i < this.state.width; i++) {
                    const startingIndex = i*step;
                    const endingIndex = startingIndex + step;
                    const slice = this.props.timings.succeeded.slice(startingIndex, endingIndex);
                    const average = slice.reduce((sum, element) => sum+element, 0)/slice.length;
                    const lastEMA = timings.length > 0 ? timings[timings.length-1] : null;
                    if (lastEMA === null) {
                        timings.push(average);
                    } else {
                        timings.push(ALPHA * average + (1 - ALPHA) * lastEMA);
                    }
                    timingSum += average;
                }
                // const leftOver = this.props.timings.succeeded.length - (step * this.state.width);
                // console.log({leftOver});
                // const lastEndingIndex = (this.state.width-1)*step+step;
                // console.log({succeeded: this.props.timings.succeeded.length, lastEndingIndex})
                // timings = this.props.timings.succeeded.reduce<number[]>((a, t, i) => {
                //     if (i % (step) === 0) {
                //         const slice = this.props.timings!.succeeded.slice(i, i+step);
                //         const average = slice.reduce((sum, element) => sum+element, 0)/slice.length;
                //         const lastEMA = a.length > 0 ? a[a.length-1] : null;
                        // if (lastEMA === null) {
                        //     a.push(average);
                        // } else {
                        //     a.push(ALPHA * average + (1 - ALPHA) * lastEMA);
                        // }
                //     }
                //     timingSum += t;
                //     return a;
                // }, []);
                // console.log({
                //     full: this.props.timings.succeeded.length,
                //     reduced: timings.length,
                //     step,
                //     exactStep: this.props.timings.succeeded.length / this.state.width,
                //     leftover: this.props.timings.succeeded.length % step,
                //     exactLeftover: this.props.timings.succeeded.length % (this.props.timings.succeeded.length/this.state.width),
                //     width: this.state.width
                // });
            }
            average = (this.props.timings.succeeded.length === 0 ?
                0 : (timingSum / this.props.timings.succeeded.length)).toFixed(2);
            succeededAmount = this.props.timings.succeeded.length;

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
            // yPoint = compose(yScale, (d: number) => d);
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
                        // fill="#32deaa"
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
            <div>Average: {average}ms</div>
            <div>Succeeded requests: {succeededAmount}</div>
        </div>;
    }
}