import BigNumber from "bignumber.js";
import moment from "moment";
import React, { Component, ReactNode } from "react";
import { Line, LineChart, ResponsiveContainer, Tooltip, TooltipProps } from "recharts";
import { IPriceDataPoint } from "../domain/IPriceDataPoint";
import { Change24HMarker, Change24HMarkerSize } from "./Change24HMarker";

export interface IPriceGraphProps {
  data: IPriceDataPoint[];
}

interface IPriceGraphState {
  priceBaseLine: number;
  data: IPriceDataPoint[];
  displayedDataPoint: IPriceDataPoint | null;
}

export class PriceGraph extends Component<IPriceGraphProps, IPriceGraphState> {
  private _latestDataPoint: IPriceDataPoint | null = null;

  constructor(props: IPriceGraphProps, context?: any) {
    super(props, context);

    this.state = { priceBaseLine: 0, data: [], displayedDataPoint: null };
  }

  public componentWillReceiveProps(nextProps: Readonly<IPriceGraphProps>, nextContext: any): void {
    const priceMin = nextProps.data.map(e => e.price).reduce((a, b) => Math.min(a, b));
    const priceMax = nextProps.data.map(e => e.price).reduce((a, b) => Math.max(a, b));
    const priceBaseLine = priceMin - (priceMax - priceMin) * 0.3;
    const normalizedData = nextProps.data.map(e => {
      return { ...e, price: e.price - priceBaseLine };
    });

    this.setState({
      ...this.state,
      priceBaseLine: priceBaseLine,
      data: normalizedData,
      displayedDataPoint: nextProps.data[nextProps.data.length - 1]
    });
  }

  public render() {
    const timeStampFromText = this.state.displayedDataPoint
      ? moment.unix(this.props.data.map(e => e.timeStamp).reduce((a, b) => Math.min(a, b))).format("MMM DD, hh:mm A")
      : "-";
    const timeStampToText = this.state.displayedDataPoint
      ? moment.unix(this.props.data.map(e => e.timeStamp).reduce((a, b) => Math.max(a, b))).format("MMM DD, hh:mm A")
      : "-";

    const timeStampText = this.state.displayedDataPoint
      ? moment.unix(this.state.displayedDataPoint.timeStamp).format("MMM DD, hh:mm A")
      : "-";
    const price = this.state.displayedDataPoint
      ? new BigNumber(this.state.priceBaseLine + this.state.displayedDataPoint.price)
      : new BigNumber(0);
    const priceText = price.toFixed(2);
    const change24h = this.state.displayedDataPoint
      ? new BigNumber(this.state.displayedDataPoint.change24h)
      : new BigNumber(0);

    return (
      <div className="price-graph">
        <div className="price-graph__hovered-time-container">
          <div className="price-graph__hovered-time">{`${timeStampText}`}</div>
          <div className="price-graph__hovered-time-delimiter">
            <div />
          </div>
        </div>
        <div className="price-graph__hovered-price-marker">{`$${priceText}`}</div>
        <div className="price-graph__hovered-change-1h-marker">
          <Change24HMarker value={change24h} size={Change24HMarkerSize.LARGE} />
        </div>
        <div className="price-graph__graph-container">
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={this.state.data}>
              <Tooltip content={this.renderTooltip} />

              <Line
                type="monotone"
                dataKey="price"
                animationDuration={500}
                dot={false}
                activeDot={false}
                stroke="#ffffff"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="price-graph__timeline">
          <div className="price-graph__timeline-from">{timeStampFromText}</div>
          <div className="price-graph__timeline-to">{timeStampToText}</div>
        </div>
      </div>
    );
  }

  public renderTooltip = (e: TooltipProps): ReactNode => {
    if (e.active) {
      if (e.payload) {
        const value = e.payload[0].payload as IPriceDataPoint;
        if (this._latestDataPoint) {
          if (value === this._latestDataPoint) {
            return;
          }
        }

        this._latestDataPoint = value;
        this.setState({ ...this.state, displayedDataPoint: value });
      }
    }
    return null;
  };
}
