export {
  Theme,
  Audience,
  PrivacyPolicyType,
  ButtonPosition,
  CornerRadius,
} from '@wix/ambassador-serverless-cookie-consent-settings-serverless/types';
import {
  CookieBannerSettings as _CookieBannerSettings_,
  DeclineAllConfig as _DeclineAllConfig_,
  RevisitSettingsConfig as _RevisitSettingsConfig_,
  Theme,
} from '@wix/ambassador-serverless-cookie-consent-settings-serverless/types';

export const defaultTheme = Theme.dark;

export interface CookieBannerSettings extends _CookieBannerSettings_ {
  /* in this client the value is take from translations */ privacyPolicyUrl?: string;
}
export interface DeclineAllConfig extends _DeclineAllConfig_ {}
export interface RevisitSettingsConfig extends _RevisitSettingsConfig_ {}

export interface BaseProps {
  className?: string;
  dataHook?: string;
  id?: string;
  attributes?: any;
  innerText?: string;
  ariaLabel?: string;
  ariaLabelledBy?: string;
  ariaDescribedBy?: string;
  role?: string;
  /* used for performance analysis of components in runtime */
  dataCompType?: string;
}

export const DEFAULT_POLICY: ConsentPolicy = {
  essential: true,
  functional: false,
  analytics: false,
  advertising: false,
};

export const DEFAULT_POLICY_DETAILS: PolicyDetails = {
  defaultPolicy: true,
  policy: DEFAULT_POLICY,
};

type PolicySuccessCallback = (policy: ConsentPolicy) => void;
type PolicyErrorCallback = (error: Error) => void;
type GetCurrentConsentPolicy = () => PolicyDetails;
type ResetPolicy = () => void;
type SetConsentPolicy = (
  newPolicy: ConsentPolicy,
  successCallback?: PolicySuccessCallback,
  errorCallback?: PolicyErrorCallback,
) => void;

export interface PolicyDetails {
  defaultPolicy: boolean;
  policy?: ConsentPolicy;
  createdDate?: Date | any;
}

export interface ConsentPolicy {
  essential: boolean;
  functional: boolean;
  analytics: boolean;
  advertising: boolean;
  dataToThirdParty?: boolean;
}

export interface BaseComponentProps {}
export type IState = {
  [key: string]: any;
};

export abstract class BaseComponent<
  P extends BaseComponentProps,
  S extends IState,
> {
  static defaultProps: any;
  props: P;
  protected state: S;
  htmlElement!: HTMLElement;
  abstract render(): { element: HTMLElement; destroy?: () => void };
  rendered = false;

  constructor(props?: P) {
    this.props = {
      ...(props || Object.create({})),
      ...BaseComponent.defaultProps,
    };
    this.state = Object.create({});
  }

  setState(partial: Partial<S>) {
    this.state = {
      ...this.state,
      ...partial,
    };
    // const parent = this.htmlElement?.parentElement;
    // if (parent) {
    //   parent.removeChild(this.htmlElement);
    //   renderComponent(this, parent);
    // }
  }

  componentRendered(): void {
    // No-Op
  }

  onComponentUpdate(): void {}
}
