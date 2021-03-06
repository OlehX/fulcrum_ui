import { BigNumber } from "@0x/utils";
import React, { Component } from "react";
import { Asset } from "../domain/Asset";
import { AssetDetails } from "../domain/AssetDetails";
import { AssetsDictionary } from "../domain/AssetsDictionary";
import { IPriceDataPoint } from "../domain/IPriceDataPoint";
import { PositionType } from "../domain/PositionType";
import { TradeRequest } from "../domain/TradeRequest";
import { TradeTokenKey } from "../domain/TradeTokenKey";
import { TradeType } from "../domain/TradeType";
import { FulcrumProviderEvents } from "../services/events/FulcrumProviderEvents";
import { ProviderChangedEvent } from "../services/events/ProviderChangedEvent";
import { TradeTransactionMinedEvent } from "../services/events/TradeTransactionMinedEvent";
import { FulcrumProvider } from "../services/FulcrumProvider";
import { PositionTypeMarkerAlt } from "./PositionTypeMarkerAlt";
import siteConfig from "../config/SiteConfig.json";

import { LeverageSelector } from "./LeverageSelector";
import { Preloader } from "./Preloader";


export interface ITradeTokenCardMobileProps {
  selectedKey: TradeTokenKey;

  asset: Asset;
  defaultUnitOfAccount: Asset;
  positionType: PositionType;
  defaultTokenizeNeeded: boolean;
  changeActiveBtn: (activeType: string) => void;

  onSelect: (key: TradeTokenKey) => void;
  onTrade: (request: TradeRequest) => void;
}

interface ITradeTokenCardMobileState {
  assetDetails: AssetDetails | null;
  leverage: number;
  version: number;

  isLong: boolean;
  latestPriceDataPoint: IPriceDataPoint;
  interestRate: BigNumber;
  balance: BigNumber;
  isLoading: boolean;
}

export class TradeTokenCardMobile extends Component<ITradeTokenCardMobileProps, ITradeTokenCardMobileState> {

  constructor(props: ITradeTokenCardMobileProps, context?: any) {
    super(props, context);

    const assetDetails = AssetsDictionary.assets.get(props.asset);
    this._isMounted = false;
    this.state = {
      leverage: this.props.positionType === PositionType.SHORT ? 1 : 2,
      isLong: this.props.positionType === PositionType.LONG,
      assetDetails: assetDetails || null,
      latestPriceDataPoint: FulcrumProvider.Instance.getPriceDefaultDataPoint(),
      interestRate: new BigNumber(0),
      balance: new BigNumber(0),
      version: 2,
      isLoading: true
    };

    FulcrumProvider.Instance.eventEmitter.on(FulcrumProviderEvents.ProviderAvailable, this.onProviderAvailable);
    FulcrumProvider.Instance.eventEmitter.on(FulcrumProviderEvents.ProviderChanged, this.onProviderChanged);
    FulcrumProvider.Instance.eventEmitter.on(FulcrumProviderEvents.TradeTransactionMined, this.onTradeTransactionMined);
  }

  private _isMounted: boolean;

  private getTradeTokenGridRowSelectionKeyRaw(props: ITradeTokenCardMobileProps, leverage: number = this.state.leverage) {
    const key = new TradeTokenKey(props.asset, props.defaultUnitOfAccount, props.positionType, leverage, props.defaultTokenizeNeeded, 2);

    // check for version 2, and revert back to version if not found
    if (key.erc20Address === "") {
      key.setVersion(1);
    }

    return key;
  }

  private getTradeTokenGridRowSelectionKey(leverage: number = this.state.leverage) {
    return this.getTradeTokenGridRowSelectionKeyRaw(this.props, leverage);
  }

  private async derivedUpdate() {
    let version = 2;

    const tradeTokenKey = new TradeTokenKey(this.props.asset, this.props.defaultUnitOfAccount, this.props.positionType, this.state.leverage, this.props.defaultTokenizeNeeded, version);
    if (tradeTokenKey.erc20Address === "") {
      tradeTokenKey.setVersion(1);
      version = 1;
    }

    const latestPriceDataPoint = await FulcrumProvider.Instance.getTradeTokenAssetLatestDataPoint(tradeTokenKey);
    const interestRate = await FulcrumProvider.Instance.getTradeTokenInterestRate(tradeTokenKey);
    const balance = await FulcrumProvider.Instance.getPTokenBalanceOfUser(tradeTokenKey);

    this._isMounted && this.setState({
      ...this.state,
      latestPriceDataPoint: latestPriceDataPoint,
      interestRate: interestRate,
      balance: balance,
      version: version
    });
    if (latestPriceDataPoint.price != 0) {
      this._isMounted && this.setState({
        isLoading: false,
      });
    }
  }

  private onProviderAvailable = async () => {
    await this.derivedUpdate();
  };

  private onProviderChanged = async (event: ProviderChangedEvent) => {
    await this.derivedUpdate();
  };

  private onTradeTransactionMined = async (event: TradeTransactionMinedEvent) => {
    if (event.key.toString() === this.getTradeTokenGridRowSelectionKey().toString()) {
      await this.derivedUpdate();
    }
  };

  public componentWillUnmount(): void {
    this._isMounted = false;

    FulcrumProvider.Instance.eventEmitter.removeListener(FulcrumProviderEvents.ProviderAvailable, this.onProviderAvailable);
    FulcrumProvider.Instance.eventEmitter.removeListener(FulcrumProviderEvents.ProviderChanged, this.onProviderChanged);
    FulcrumProvider.Instance.eventEmitter.removeListener(FulcrumProviderEvents.TradeTransactionMined, this.onTradeTransactionMined);
  }

  public componentDidMount(): void {
    this._isMounted = true;

    this.derivedUpdate();
  }

  public componentDidUpdate(
    prevProps: Readonly<ITradeTokenCardMobileProps>,
    prevState: Readonly<ITradeTokenCardMobileState>,
    snapshot?: any
  ): void {
    const currentTradeTokenKey = this.getTradeTokenGridRowSelectionKey(this.state.leverage);
    const prevTradeTokenKey = this.getTradeTokenGridRowSelectionKeyRaw(prevProps, prevState.leverage);

    if (
      prevState.leverage !== this.state.leverage ||
      (prevProps.selectedKey.toString() === prevTradeTokenKey.toString()) !==
      (this.props.selectedKey.toString() === currentTradeTokenKey.toString())
    ) {
      this.derivedUpdate();
    }
  }

  public render() {
    if (!this.state.assetDetails) {
      return null;
    }

    const tradeTokenKey = this.getTradeTokenGridRowSelectionKey(this.state.leverage);
    const bnPrice = new BigNumber(this.state.latestPriceDataPoint.price);
    const bnLiquidationPrice = new BigNumber(this.state.latestPriceDataPoint.liquidationPrice);
   
    return (
      <div className="trade-token-card-mobile">
        <div className="trade-token-card-mobile__header">
          <div className="asset-name">
            <span>{this.state.assetDetails.displayName}&nbsp;</span>
            <PositionTypeMarkerAlt assetDetails={this.state.assetDetails} value={this.props.positionType} />
          </div>
          <div className="poisition-type-switch">
            <button className={"" + (this.state.isLong ? 'btn-active' : '')} onClick={() => this.props.changeActiveBtn('long')}>
              Long
          </button>
            <button className={"" + (!this.state.isLong ? 'btn-active' : '')} onClick={() => this.props.changeActiveBtn('short')}>
              Short
          </button>
          </div>
        </div>
        <div className="trade-token-card-mobile__body">
          <div className="trade-token-card-mobile__body-row">
            <div className="trade-token-card-mobile__leverage">
              <LeverageSelector
                asset={this.props.asset}
                value={this.state.leverage}
                minValue={this.props.positionType === PositionType.SHORT ? 1 : 2}
                maxValue={5}
                onChange={this.onLeverageSelect}
              />
            </div>
            {this.renderActions(this.state.balance.eq(0))}
          </div>
          <div className="trade-token-card-mobile__body-row">
            <div title={`$${bnPrice.toFixed(18)}`} className="trade-token-card-mobile__price">
              <span>Asset Price</span>
              <span>
                {!this.state.isLoading ?
                  <React.Fragment><span className="fw-normal">$</span>{bnPrice.toFixed(2)}</React.Fragment>
                  : <Preloader width="74px"/>
                }
              </span>
            </div>
            <div title={`$${bnLiquidationPrice.toFixed(18)}`} className="trade-token-card-mobile__price">
              <span>Liquidation Price</span>
              <span>
                {!this.state.isLoading ?
                  <React.Fragment><span className="fw-normal">$</span>{bnLiquidationPrice.toFixed(2)}</React.Fragment>
                  : <Preloader width="74px"/>
                }
              </span>
            </div>
            <div title={this.state.interestRate.gt(0) ? `${this.state.interestRate.toFixed(18)}%` : ``} className="trade-token-card-mobile__profit">
              <span>Interest APR</span>
              <span>
                {this.state.interestRate.gt(0) && !this.state.isLoading
                  ? <React.Fragment>{this.state.interestRate.toFixed(4)}<span className="fw-normal">%</span></React.Fragment>
                  : <Preloader width="74px"/>
                }
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  private renderActions = (isBuyOnly: boolean) => {
    return (
      <div className="trade-token-card-mobile__action">
        <button className="trade-token-card-mobile____buy-button" disabled={siteConfig.TradeBuyDisabled} onClick={this.onBuyClick}>
          {TradeType.BUY}
        </button>
      </div>
    )
  };

  public onLeverageSelect = (value: number) => {
    const key = this.getTradeTokenGridRowSelectionKey(value);

    this._isMounted && this.setState({ ...this.state, leverage: value, version: key.version, isLoading: true });

    this.props.onSelect(this.getTradeTokenGridRowSelectionKey(value));
  };

  public onSelectClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();

    this.props.onSelect(this.getTradeTokenGridRowSelectionKey());
  };

  public onBuyClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();

    this.props.onTrade(
      new TradeRequest(
        TradeType.BUY,
        this.props.asset,
        this.props.defaultUnitOfAccount, // TODO: depends on which one they own
        Asset.ETH,
        this.props.positionType,
        this.state.leverage,
        new BigNumber(0),
        this.props.defaultTokenizeNeeded, // TODO: depends on which one they own
        this.state.version
      )
    );
  };

  public onSellClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();

    this.props.onTrade(
      new TradeRequest(
        TradeType.SELL,
        this.props.asset,
        this.props.defaultUnitOfAccount, // TODO: depends on which one they own
        this.props.selectedKey.positionType === PositionType.SHORT ? this.props.selectedKey.asset : Asset.DAI,
        this.props.positionType,
        this.state.leverage,
        new BigNumber(0),
        this.props.defaultTokenizeNeeded, // TODO: depends on which one they own
        this.state.version
      )
    );
  };
}
