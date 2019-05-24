import React, { Component } from "react";
import { TradeRequest } from "../domain/TradeRequest";
import { TradeTokenKey } from "../domain/TradeTokenKey";
import { FulcrumProvider } from "../services/FulcrumProvider";
import { OwnTokenGridHeader } from "./OwnTokenGridHeader";
import { IOwnTokenGridRowProps, OwnTokenGridRow } from "./OwnTokenGridRow";
import { FulcrumProviderEvents } from "../services/events/FulcrumProviderEvents";
import { ProviderChangedEvent } from "../services/events/ProviderChangedEvent";

export interface IOwnTokenGridProps {
  showMyTokensOnly: boolean;
  selectedKey: TradeTokenKey;

  onShowMyTokensOnlyChange: (value: boolean) => void;
  onDetails: (key: TradeTokenKey) => void;
  onTrade: (request: TradeRequest) => void;
}

interface IOwnTokenGridState {
  tokenRowsData: IOwnTokenGridRowProps[];
}

export class OwnTokenGrid extends Component<IOwnTokenGridProps, IOwnTokenGridState> {
  constructor(props: IOwnTokenGridProps) {
    super(props);

    this.state = {
      tokenRowsData: []
    };

    FulcrumProvider.Instance.eventEmitter.on(FulcrumProviderEvents.ProviderChanged, this.onProviderChanged);
  }

  public async derivedUpdate() {
    const tokenRowsData = await OwnTokenGrid.getRowsData(this.props);
    this.setState({ ...this.state, tokenRowsData: tokenRowsData });
  }

  private onProviderChanged = async (event: ProviderChangedEvent) => {
    await this.derivedUpdate();
  };

  public componentWillUnmount(): void {
    FulcrumProvider.Instance.eventEmitter.removeListener(FulcrumProviderEvents.ProviderChanged, this.onProviderChanged);
  }

  public componentDidMount(): void {
    this.derivedUpdate();
  }

  public componentDidUpdate(
    prevProps: Readonly<IOwnTokenGridProps>,
    prevState: Readonly<IOwnTokenGridState>,
    snapshot?: any
  ): void {
    if (
      this.props.selectedKey !== prevProps.selectedKey ||
      this.props.showMyTokensOnly !== prevProps.showMyTokensOnly
    ) {
      this.derivedUpdate();
    }
  }

  public render() {
    const tokenRows = this.state.tokenRowsData.map(e => <OwnTokenGridRow key={`${e.currentKey.toString()}`} {...e} />);

    return (
      <div className="trade-token-grid">
        <OwnTokenGridHeader
          showMyTokensOnly={this.props.showMyTokensOnly}
          onShowMyTokensOnlyChange={this.props.onShowMyTokensOnlyChange}
        />
        {tokenRows}
      </div>
    );
  }

  private static getRowsData = async (props: IOwnTokenGridProps): Promise<IOwnTokenGridRowProps[]> => {
    const rowsData: IOwnTokenGridRowProps[] = [];

    const pTokens = await FulcrumProvider.Instance.getPTokensAvailable();
    for (const pToken of pTokens) {
      const balance = await FulcrumProvider.Instance.getPositionTokenBalance(pToken);

      if (balance.gt(0)) {
        rowsData.push({
          selectedKey: props.selectedKey,
          currentKey: pToken,
          balance: balance,
          onDetails: props.onDetails,
          onTrade: props.onTrade
        });
      }
    }

    return rowsData;
  };
}
