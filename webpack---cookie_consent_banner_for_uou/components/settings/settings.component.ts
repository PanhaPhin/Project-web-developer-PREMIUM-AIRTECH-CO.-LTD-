import { classNames, renderComponent } from '../../utils/utils';
import {
  BaseComponent,
  BaseComponentProps,
  ConsentPolicy,
  IState,
  Theme,
} from '../../types';
import css from './settings.scss';
import { DataHook } from '../../constants/data-hooks';
import { Button, Section, Span, Text, View } from '../elements';
import { SectionComponent } from '../section/section.component';
import { CloseButton } from '../close-button';
import { translate } from '../../services/i18n/i18n';
import {
  ConfigData,
  getStore,
} from '../../services/configuration/configuration-store';
import { savePolicy } from '../../services/consent-policy-manager/consent-policy-manager';
import { translationKeys } from '../../constants/constants';
import { logger } from '../../services/bi-logger/bi-logger-service';

export interface State extends IState {
  startConsentPolicy: ConsentPolicy;
  consentPolicy: ConsentPolicy;
}

export interface Props extends BaseComponentProps {
  consentPolicy: ConsentPolicy;
}

export class SettingsComponent extends BaseComponent<
  BaseComponentProps,
  State
> {
  backgroundView!: HTMLDivElement;
  closing: boolean = false;

  constructor(props?: Props) {
    super(props);
    this.setState({
      consentPolicy: { ...getStore().consentPolicy },
      startConsentPolicy: { ...getStore().consentPolicy },
    });
  }

  componentRendered(): void {
    document.body.className = `${document.body.className} ${css.bodyPreventScrolling}`;
    this.showComponent();
    this.setState({
      lastActiveElement: document.activeElement,
    });
    this.htmlElement.focus();
  }

  onComponentUpdate(): void {
    this.showComponent();
  }

  showComponent(): void {
    this.backgroundView.onclick = this.closeDialog;
    this.htmlElement.className = this.getComponentClasses(true);
  }

  onSaveClicked = () => {
    const msid = window.wixEmbedsAPI?.getMetaSiteId() || '';
    logger.onSettingsChanged(
      JSON.stringify(this.state.startConsentPolicy),
      JSON.stringify(this.state.consentPolicy),
      msid,
    );
    void savePolicy({
      policy: this.state.consentPolicy,
      successCallback: this.onSaveSuccessful,
      errorCallback: this.onSaveFailed,
    });
  };

  onSaveSuccessful = () => {
    this.closeDialog();
  };
  onSaveFailed = () => {};

  closeDialog = () => {
    this.closing = true;
    document.body.className = `${document.body.className.replace(
      css.bodyPreventScrolling,
      '',
    )}`;
    this.htmlElement.className = this.getComponentClasses(false);
    this.backgroundView.ontransitionend = this.onCloseTransitionEnd;
  };

  onCloseTransitionEnd = () => {
    if (!this.closing) {
      return;
    }
    const parent = this.htmlElement.parentElement;
    if (parent) {
      parent.removeChild(this.htmlElement);
      this.state.lastActiveElement?.focus();
    }
    this.backgroundView.ontransitionend = null;
  };

  getComponentClasses = (show: boolean): string => {
    return classNames({
      [css.root]: true,
      [css.show]: show,
    });
  };

  onToggleChanged = (policyKeys: string[]) => {
    const newState: State = {
      consentPolicy: this.state.consentPolicy,
      startConsentPolicy: this.state.startConsentPolicy,
    };
    policyKeys.forEach(
      (policy) =>
        (newState.consentPolicy[policy as keyof ConsentPolicy] =
          !this.state.consentPolicy[policy as keyof ConsentPolicy]),
    );
    this.setState(newState);
  };

  render() {
    const configs = getStore().configuration;
    const root = View({
      className: css.root,
      dataHook: DataHook.settingsContainer,
      dataCompType: 'cookie-banner-modal-uou',
    });
    root.onkeyup = (event: any) => {
      if (event.key === 'Escape') {
        this.closeDialog();
      }
    };

    this.backgroundView = View({ className: css.background });
    const dialog = Section({
      className: css.dialog,
      dataHook: DataHook.settingsDialog,
    });
    root.appendChild(this.backgroundView);

    const sections = Section({ className: css.content });

    const titleId = 'settings.title.id';
    dialog.appendChild(
      Text({
        title: true,
        id: titleId,
        className: css.head,
        text: translate('settings.title'),
      }),
    );

    const closeButtonContainer = Span({ className: css.closeButtonContainer });
    closeButtonContainer.appendChild(
      CloseButton({
        onClick: this.closeDialog,
        invert: false,
        ariaLabel: translate('close.settings.label'),
        color: '#000',
      }),
    );

    dialog.appendChild(closeButtonContainer);
    configs.forEach((config: ConfigData) => {
      const toggleChecked = this.state.consentPolicy[
        config.policyKeys[0] as keyof ConsentPolicy
      ] as boolean;
      renderComponent(
        new SectionComponent({
          title: translate(config.titleKey),
          description: translate(config.descriptionKey),
          onToggleChanged: this.onToggleChanged,
          toggleTooltip: config.toggleTooltip
            ? translate(config.toggleTooltip)
            : undefined,
          toggleEnabled: config.toggleEnabled,
          policyKeys: config.policyKeys,
          toggleChecked,
        }),
        sections,
      );
    });

    const footer = View({ className: css.foot });
    const saveButton = Button({
      dataHook: DataHook.settingsSaveButton,
      className: css.button,
      text: translate(translationKeys.displaySaveDefault),
      onClick: this.onSaveClicked,
      theme: Theme.dark,
    });

    footer.appendChild(saveButton);
    dialog.appendChild(sections);
    root.appendChild(dialog);
    dialog.appendChild(footer);
    root.tabIndex = -1;
    root.setAttribute('aria-labelledby', titleId);
    root.setAttribute('role', 'dialog');

    return { element: root };
  }
}
