import React, { PureComponent } from "react";
import { ButtonLanding, ButtonLandingColor } from "../components/ButtonLanding";
import { WalletType } from "../domain/WalletType";
import { Footer } from "../layout/Footer";
import { HeaderHome } from "../layout/HeaderHome";
import { NavService } from "../services/NavService";
import { TorqueProvider } from "../services/TorqueProvider";
import siteConfig from "../config/SiteConfig.json";


export interface ILandingPageProps {
  isRiskDisclosureModalOpen: () => void;
}

export class LandingPage extends PureComponent<ILandingPageProps> {
  public render() {
    const accountAddress =
      TorqueProvider.Instance.accounts.length > 0 && TorqueProvider.Instance.accounts[0]
        ? TorqueProvider.Instance.accounts[0].toLowerCase()
        : null;

    const walletUrl = NavService.Instance.getWalletAddress("b");
    const trackLoansUrl =
      accountAddress
        ? NavService.Instance.getDashboardAddress(WalletType.Web3, accountAddress)
        : NavService.Instance.getWalletAddress("t");

    return (
      <div className="landing-page">
        <HeaderHome isLoading={false} />
        <main className="landing-page__main">
          <div className="landing-page__jumbo">
            <h1>
              <span className="landing-page__jumbo-header">Borrowing Made Simple</span>
            </h1>
            <div className="landing-page__jumbo-action-container">
              {!siteConfig.BorrowDisabled || (accountAddress && accountAddress.toLowerCase() === "0xadff3ada12ed0f8a87e31e5a04dfd2ee054e1118") ? <ButtonLanding color={ButtonLandingColor.Blue} subtitle={"New user?"} title={"Borrow"} url={walletUrl} /> : undefined}
              <ButtonLanding color={ButtonLandingColor.Green} subtitle={"Existing user?"} title={"Track your loans"} url={trackLoansUrl} />
            </div>
          </div>
        </main>
        <Footer isRiskDisclosureModalOpen={this.props.isRiskDisclosureModalOpen}/>
      </div>
    );
  }

  public componentDidMount(): void {
    const htmls = document.getElementsByTagName("html");
    this.addClass(htmls[0], "html-landing-page-active");
  }

  public componentWillUnmount(): void {
    const htmls = document.getElementsByTagName("html");
    this.removeClass(htmls[0], "html-landing-page-active");
  }

  private hasClass = (ele: Element, cls: string) => {
    return !!ele.className.match(new RegExp("(\\s|^)" + cls + "(\\s|$)"));
  };

  private addClass = (ele: Element, cls: string) => {
    if (!this.hasClass(ele, cls)) ele.className += " " + cls;
  };

  private removeClass = (ele: Element, cls: string) => {
    if (this.hasClass(ele, cls)) {
      const reg = new RegExp("(\\s|^)" + cls + "(\\s|$)");
      ele.className = ele.className.replace(reg, " ");
    }
  };
}
