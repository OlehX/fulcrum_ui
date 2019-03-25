import React, { Component } from "react";
import { ProviderType } from "../domain/ProviderType";
import { ProviderMenuListItem } from "./ProviderMenuListItem";

export interface IProviderMenuParams {
  providerTypes: ProviderType[];
  selectedProviderType: ProviderType;

  onSelect: (providerType: ProviderType) => void;
}

export class ProviderMenu extends Component<IProviderMenuParams> {
  public render() {
    const listItems = this.props.providerTypes.map(e => (
      <ProviderMenuListItem
        key={e}
        providerType={e}
        selectedProviderType={this.props.selectedProviderType}
        onSelect={this.props.onSelect}
      />
    ));

    return (
      <div className="provider-menu">
        <div className="provider-menu__title">Select provider</div>
        <ul className="provider-menu__list">{listItems}</ul>
      </div>
    );
  }
}
