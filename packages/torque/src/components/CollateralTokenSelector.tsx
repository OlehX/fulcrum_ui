import React, { Component } from "react";
import { Asset } from "../domain/Asset";
import { CollateralTokenSelectorItem } from "./CollateralTokenSelectorItem";

export interface ICollateralTokenSelectorProps {
  selectedCollateral: Asset;

  onCollateralChange: (asset: Asset) => void;
  onClose: () => void;
}

export class CollateralTokenSelector extends Component<ICollateralTokenSelectorProps> {
  private readonly assets: Asset[] = [
    Asset.ETH,
    Asset.DAI,
    Asset.USDC,
    Asset.WBTC,
    // Asset.MKR,
    Asset.ZRX,
    Asset.BAT,
    Asset.REP,
    Asset.KNC
  ];

  public render() {
    const tokenItems = this.assets.map(e => (
      <CollateralTokenSelectorItem
        key={e}
        asset={e}
        selectedCollateral={this.props.selectedCollateral}
        onCollateralChange={this.props.onCollateralChange}
      />
    ));

    return (
      <div className="collateral-token-selector">
        <section className="dialog-content">
          <div className="collateral-token-selector__items">{tokenItems}</div>
        </section>
      </div>
    );
  }
}