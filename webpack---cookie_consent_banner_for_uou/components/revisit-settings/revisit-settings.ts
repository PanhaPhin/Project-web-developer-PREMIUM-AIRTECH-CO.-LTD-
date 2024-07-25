import css from './revisit-settings.scss';
import { Button, Paragraph, View } from '../elements';
import { DataHook } from '../../constants/data-hooks';
import { translationKeys } from '../../constants/constants';
import { classNames, getCssVariable, renderComponent } from '../../utils/utils';
import {
  BaseComponent,
  BaseComponentProps,
  CookieBannerSettings,
  CornerRadius,
  defaultTheme,
  Theme,
} from '../../types';
import { translate } from '../../services/i18n/i18n';
import { getStore } from '../../services/configuration/configuration-store';
import { CloseButton } from '../close-button';
import { SettingsComponent } from '../settings/settings.component';
import { logger } from '../../services/bi-logger/bi-logger-service';

export interface Props extends BaseComponentProps {
  settings: CookieBannerSettings;
  locale?: string;
}

const VERTICAL_LANGUAGES = ['ja', 'ko', 'zh'];

export class RevisitSettings extends BaseComponent<Props, {}> {
  htmlElement!: HTMLElement;

  onCloseClicked = (event: MouseEvent) => {
    const msid = window.wixEmbedsAPI?.getMetaSiteId() || '';
    logger.hideSettingsClicked('mini_banner', msid);
    document.body.removeChild(this.htmlElement);
    event.stopPropagation();
    event.preventDefault();
  };

  getClasses = (show: boolean): string => {
    const { locale, settings } = this.props;
    const { theme, customThemeConfig, revisitSettingsConfig } = settings;
    return classNames({
      [css.revisitSettingsContainer]: true,
      [css[theme || defaultTheme]]: true,
      [css[`position-${revisitSettingsConfig?.buttonPosition}`]]: true,
      [css.show]: show,
      [css.verticalLanguage]: locale && VERTICAL_LANGUAGES.includes(locale),
      [css[
        (theme === Theme.custom && customThemeConfig?.cornerRadius) ||
          CornerRadius.square
      ]]: true,
    });
  };

  render() {
    const { theme } = getStore().settings;

    const container = View({
      className: this.getClasses(true),
      dataHook: DataHook.revisitSettingsContainer,
      role: 'region',
      ariaLabel: translate('revisit.settings.description.label'),
    });

    const p = Paragraph({
      innerText: translate(translationKeys.revisitSettingsButton),
      className: css.text,
      dataHook: DataHook.revisitSettingsButtonText,
    });

    const revisitSettingsButton = Button({
      dataHook: DataHook.revisitSettingsButton,
      className: css.revisitSettingsButton,
      text: '',
      theme: theme || defaultTheme,
      onClick: async () => {
        const msid = window.wixEmbedsAPI?.getMetaSiteId() || '';
        logger.openedPanel('mini_banner', msid);
        await renderComponent(new SettingsComponent());
      },
    });

    revisitSettingsButton.appendChild(p);

    const closeButton = CloseButton({
      onClick: this.onCloseClicked,
      invert: theme === Theme.dark,
      dataHook: DataHook.revisitSettingsCloseButton,
      className: css.closeRevisitSettings,
      ariaLabel: translate('close.revisit.settings.label'),
      color: getCssVariable('secondary-color'),
    });

    container.appendChild(revisitSettingsButton);
    container.appendChild(closeButton);

    this.htmlElement = container;

    return { element: container };
  }
}
