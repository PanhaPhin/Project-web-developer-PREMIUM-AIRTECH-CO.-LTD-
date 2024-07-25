import css from './App.scss';
import { Link, Span, View } from '../elements';
import { CloseButton } from '../close-button';
import { ButtonActions } from '../button-actions';
import { RevisitSettings } from '../revisit-settings';
import { DataHook } from '../../constants/data-hooks';
import {
  animationTimingSlow,
  tallBannerHeight,
  translationKeys,
  consentPolicyUpdateRequestedEvent,
} from '../../constants/constants';

import {
  applyCssVariable,
  applyFontStyleSheet,
  classNames,
  getCssVariable,
  observeElementSize,
  removeCssVariable,
  renderComponent,
} from '../../utils/utils';
import {
  BaseComponent,
  BaseComponentProps,
  CookieBannerSettings,
  PrivacyPolicyType,
  Theme,
  CornerRadius,
} from '../../types';
import { translate } from '../../services/i18n/i18n';
import {
  getStore,
  IStore,
} from '../../services/configuration/configuration-store';
import { logger } from '../../services/bi-logger/bi-logger-service';
import { SettingsComponent } from '../settings/settings.component';

export interface Props extends BaseComponentProps {
  settings: CookieBannerSettings;
  withoutAnimation?: boolean;
  locale?: string;
}

export class App extends BaseComponent<Props, {}> {
  revisitSettings: RevisitSettings | undefined;

  applyTheme = () => {
    const { theme, customThemeConfig } = getStore().settings;

    if (theme === Theme.custom) {
      applyCssVariable('primary-color', customThemeConfig!.primaryColor?.value);
      applyCssVariable(
        'secondary-color',
        customThemeConfig!.secondaryColor?.value,
      );
      applyCssVariable('font-family', customThemeConfig!.fontFamily);
      applyCssVariable('font-size', customThemeConfig!.fontSize);
      applyFontStyleSheet(customThemeConfig!.fontFamily);
    } else {
      removeCssVariable('primary-color');
      removeCssVariable('secondary-color');
      removeCssVariable('font-family');
      removeCssVariable('font-size');
    }
  };

  onCloseClicked = () => {
    if (!this.revisitSettings) {
      this.htmlElement.className = this.getComponentClasses(false);
      this.htmlElement.ontransitionend = this.onTransitionEnded;
    }
    const msid = window.wixEmbedsAPI?.getMetaSiteId() || '';
    logger.hideSettingsClicked('banner', msid);

    const { revisitSettingsConfig } = this.props.settings;

    if (revisitSettingsConfig?.enabled && !this.revisitSettings) {
      this.revisitSettings = new RevisitSettings(this.props);
      void renderComponent(this.revisitSettings, document.body);
    }
  };

  onTransitionEnded = () => {
    this.htmlElement.ontransitionend = null;
    document.body.removeChild(this.htmlElement);
  };

  storeChanged = async (newStore: IStore) => {
    setTimeout(() => {
      if (newStore.policySubmitted) {
        this.onCloseClicked();
      }
    }, animationTimingSlow);
  };

  componentRendered() {
    getStore().addStoreListener(this.storeChanged);
    if (!this.displayRevisitSettings()) {
      this.htmlElement.className = `${DataHook.root} ${this.getComponentClasses(
        true,
      )}`;
      this.htmlElement.focus();
    }
  }

  getComponentClasses = (show: boolean): string => {
    const { theme = Theme.dark } = getStore().settings;
    return classNames({
      [css.root]: true,
      [css[theme]]: true,
      [css.show]: show,
    });
  };

  renderViewPrivacyPolicyLink(container: HTMLElement) {
    const {
      settings: { privacyPolicyType, privacyPolicyPage },
    } = this.props;

    let policyLinkVisible = !!privacyPolicyPage;

    const baseUrl = window.wixEmbedsAPI?.getExternalBaseUrl();
    const baseUrlEndsWithSlash = baseUrl?.charAt(baseUrl.length - 1) === '/';
    let viewPolicyHref = `${window.wixEmbedsAPI?.getExternalBaseUrl()}${
      baseUrlEndsWithSlash ? '' : '/'
    }${privacyPolicyPage}`;

    let viewPolicyTarget = '_self';
    if (privacyPolicyType === PrivacyPolicyType.external_url) {
      viewPolicyHref = translate(translationKeys.policyExternalUrl, '');
      policyLinkVisible = !!viewPolicyHref;
      viewPolicyTarget = '_blank';
    }

    if (!policyLinkVisible) {
      return;
    }

    const msid = window.wixEmbedsAPI?.getMetaSiteId() || '';

    container.appendChild(
      Link({
        text: translate(translationKeys.viewPrivacyPolicy),
        className: css.viewPolicyLink,
        dataHook: DataHook.viewPolicyLink,
        href: viewPolicyHref,
        target: viewPolicyTarget,
        onClick: () => logger.cookieLinkClicked(msid),
      }),
    );
  }

  renderBanner() {
    const {
      theme = Theme.dark,
      declineAllConfig,
      customThemeConfig,
    } = getStore().settings;

    this.applyTheme();
    // If we want to have this GEO, we should add a
    const declineAll =
      (declineAllConfig || this.props?.settings?.declineAllConfig)?.enabled ||
      false;
    const DESCRIPTION_ID = 'cookies_policy_description';
    const component = View({
      className: `${DataHook.root} ${this.getComponentClasses(
        !!this.props.withoutAnimation,
      )}`,

      dataHook: DataHook.root,
      role: 'dialog',
      ariaLabelledBy: DESCRIPTION_ID,
      dataCompType: 'cookie-banner-root-uou',
    });
    const textContainer = View({ className: css.textContainer });

    const getTextFromHtml = (htmlText: string) =>
      htmlText.replace(/(<([^>]+)>)/gi, '');
    const textSpan = Span({
      id: DESCRIPTION_ID,
      innerText: getTextFromHtml(translate(translationKeys.policyBannerText)),
      dataHook: DataHook.description,
      className: `${DataHook.description} ${css.textDescription}`,
    });

    textContainer.appendChild(textSpan);
    this.renderViewPrivacyPolicyLink(textSpan);

    const buttonsContainer = ButtonActions({
      declineAll,
      theme,
      cornerRadius:
        theme === Theme.custom
          ? customThemeConfig?.cornerRadius
          : CornerRadius.square,
      onCloseClicked: this.onCloseClicked,
    });

    const contentWrapper = View({ className: css.contentWrapper });
    contentWrapper.appendChild(textContainer);
    contentWrapper.appendChild(buttonsContainer);

    const container = View({
      className: `${DataHook.root}-container ${css.container}`,
    });
    component.appendChild(container);
    container.appendChild(contentWrapper);

    /* TODO: Not sure why this is needed, ask Adi C
    //Generfied to not care about how many buttons, but this seems to be handled by flex and CSS
    const buttonContainerChildren: HTMLCollection = buttonsContainer.children;
    Array.prototype.forEach.call(buttonContainerChildren, (child: HTMLElement) => child.style.flexGrow = '0');

    setTimeout(() => {
      const widths: Array<number> | any = Array.prototype.map.call(buttonContainerChildren, (child: HTMLElement): number => child.clientWidth);
      const maxWidth = Math.max(...widths);
      //@ts-ignore
      Array.prototype.forEach.call(buttonContainerChildren, (child: HTMLElement) => {
        child.style.flexBasis = `${maxWidth}px`
        child.style.flexGrow = '1';
      });
     }, 0);
     */

    const closeButtonContainer = Span({
      className: `${DataHook.closeButton}-container ${css.closeButtonContainer}`,
    });
    closeButtonContainer.appendChild(
      CloseButton({
        onClick: this.onCloseClicked,
        invert: theme === Theme.dark,
        dataHook: DataHook.closeButton,
        color: getCssVariable('secondary-color'),
      }),
    );

    container.append(closeButtonContainer);

    component.tabIndex = -1;
    component.setAttribute('role', 'alert');

    const containerHeightObserverDestroy = containerHeightObserver({
      container,
      contentWrapper,
      buttonsContainer,
    });

    return {
      element: component,
      destroy: containerHeightObserverDestroy,
    };
  }

  displayRevisitSettings() {
    const {
      settings: { revisitSettingsConfig },
      policySubmitted,
    } = getStore();
    return revisitSettingsConfig?.enabled && policySubmitted;
  }

  initOpenSettingsListener() {
    document.addEventListener(consentPolicyUpdateRequestedEvent, () => {
      const settingsForm = document.querySelector(
        `[data-hook="${DataHook.settingsContainer}"]`,
      );
      if (settingsForm === null) {
        renderComponent(new SettingsComponent());
      }
    });
  }

  render() {
    this.initOpenSettingsListener();
    if (this.displayRevisitSettings()) {
      this.applyTheme();
      this.revisitSettings = new RevisitSettings(this.props);
      return this.revisitSettings.render();
    } else {
      return this.renderBanner();
    }
  }
}

const containerHeightObserver = ({
  container,
  contentWrapper,
  buttonsContainer,
}: {
  container: HTMLElement;
  contentWrapper: HTMLElement;
  buttonsContainer: HTMLDivElement;
}) =>
  observeElementSize(container, (entry: ResizeObserverEntry) => {
    const isTwoLineContainer =
      buttonsContainer.clientHeight < contentWrapper.clientHeight;
    const isTallContainer =
      entry.contentRect?.height >= tallBannerHeight || isTwoLineContainer;

    const classes = entry.target.classList;
    classes.toggle(css.tallContainer, isTallContainer);

    const translateBy = isTwoLineContainer ? '28px' : '0px';
    buttonsContainer.style.transform = `translateX(${translateBy})`;
  });
