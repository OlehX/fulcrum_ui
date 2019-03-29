import BigNumber from "bignumber.js";
import { EventEmitter } from "events";
import Web3 from "web3";
import { Asset } from "../domain/Asset";
import { IPriceDataPoint } from "../domain/IPriceDataPoint";
import { LendRequest } from "../domain/LendRequest";
import { ProviderType } from "../domain/ProviderType";
import { TradeRequest } from "../domain/TradeRequest";
import { TradeTokenKey } from "../domain/TradeTokenKey";
import { Web3ConnectionFactory } from "../domain/Web3ConnectionFactory";
import { ProviderChangedEvent } from "./events/ProviderChangedEvent";
import { FulcrumProviderEvents } from "./FulcrumProviderEvents";

class FulcrumProvider {
  public static Instance: FulcrumProvider;

  public eventEmitter: EventEmitter;
  public providerType: ProviderType = ProviderType.None;
  public web3: Web3 | null = null;

  constructor() {
    // init
    this.eventEmitter = new EventEmitter();

    // singleton
    if (!FulcrumProvider.Instance) {
      FulcrumProvider.Instance = this;
    }

    return FulcrumProvider.Instance;
  }

  public async setWeb3Provider(providerType: ProviderType) {
    this.web3 = await Web3ConnectionFactory.getWeb3Connection(providerType);
    this.providerType = this.web3 ? providerType : ProviderType.None;

    this.eventEmitter.emit(
      FulcrumProviderEvents.ProviderChanged,
      new ProviderChangedEvent(this.providerType, this.web3)
    );
  }

  public onLendConfirmed = (request: LendRequest) => {
    if (request) {
      alert(`loan ${request.amount} of ${request.asset}`);
    }
  };

  public onTradeConfirmed = (request: TradeRequest) => {
    if (request) {
      alert(
        `${request.tradeType} ${request.positionType} ${request.amount} of ${request.asset} with ${
          request.leverage
        }x leverage`
      );
    }
  };

  // Rates for Lend and Trade are different
  // For Trade tokens (pTokens), call interestRate()
  // For Lend tokens (iTokens), call supplyInterestRate()
  public getTokenInterestRate = (asset: Asset): BigNumber => {
    const interestRate = Math.round(Math.random() * 1000) / 100;
    return new BigNumber(interestRate);
  };

  // will figure this out later
  public getPriceDataPoints = (selectedKey: TradeTokenKey, samplesCount: number): IPriceDataPoint[] => {
    const result: IPriceDataPoint[] = [];

    const priceBase = 40;
    let priceDiff = Math.round(Math.random() * 2000) / 100;
    let change24h = 0;
    for (let i = 0; i < samplesCount + 1; i++) {
      const priceDiffNew = Math.round(Math.random() * 2000) / 100;
      change24h = ((priceDiffNew - priceDiff) / (priceBase + priceDiff)) * 100;
      priceDiff = priceDiffNew;

      result.push({ price: priceBase + priceDiff, change24h: change24h });
    }

    return result;
  };

  /*
    both iTokens and pTokens, call tokenPrice()
    prices are returned as a BigNumber -> 10120000000000000000 = 10.12
    prices are in the underlying (borrowed) asset
    Long pTokens borrow the asset in the name (psETH borrows ETH)
    Short pTokens borrow DAI (plETH borrows DAI):
      ex: 
          iTokens:
          iETH price -> 10.12 ETH per iETH
          iDAI price -> 12.12 DAI per iDAI

          pTokens:
          plETH2x (ETH Long 2x leverage) -> 10.12 DAI per plETH2x
          pswBTC4x (wBTC Short 4x leverage) -> 10.12 wBTC per pswBTC4x
  */
  public getPriceLatestDataPoint = (selectedKey: TradeTokenKey): IPriceDataPoint => {
    const priceBase = 40;
    const priceDiff = Math.round(Math.random() * 2000) / 100;
    const change24h = Math.round(Math.random() * 1000) / 100 - 5;
    return {
      price: priceBase + priceDiff,
      change24h: change24h
    };
  };

  // both iTokens and pTokens have tokenPrice() (current price)  and checkpointPrice() (price at last checkpoint)
  // profit = (tokenPrice - checkpointPrice) * tokenBalance / 10**36
  public getProfit = (selectedKey: TradeTokenKey): BigNumber | null => {
    // should return null if no data (not traded asset), new BigNumber(0) if no profit
    return new BigNumber(Math.round(Math.random() * 1000) / 100);
  };

  // when buying a pToken (trade screen), you need to check "liquidity" to ensure there is enough to buy the pToken
  /*  some notes:
      "Short" tokens borrow from the iToken for the underlying asset (ex: psETH2x borrows from iETH) 
      "Long" tokens all borrow from the iDAI token (ex: plETH4x borrows from iDAI)
  
      You need to check the associated iToken liquidity when the user wants to buy to ensure there is enough:
        marketLiquidityForAsset(): max amount of asset (ETH, DAI, etc) that can be deposited to buy marketLiquidityForToken()
        marketLiquidityForToken(): max amount of pToken that can be bought

      pTokens pay interest and earn profits in the "borrowed" asset, so psETH in ETH, 
      psMKR in MKR, but for long tokens, plETH in DAI and plMKR in DAI. pTokens have mintWithToken and 
      burnToToken funtions though. So you can buy or cash out with any supported Kyber asset
  */
  
  public getMaxTradeValue = (selectedKey: TradeTokenKey): BigNumber => {
    return new BigNumber(10);
  };

  public getMaxLendValue = (asset: Asset): BigNumber => {
    return new BigNumber(15);
  };

  public getTradedAmountEstimate = (request: TradeRequest): BigNumber => {
    return request.amount.div(2);
  };

  public getLendedAmountEstimate = (request: LendRequest): BigNumber => {
    return request.amount.div(3);
  };
}

// singleton
const instance = new FulcrumProvider();
export default instance;
