import css from './button-actions.scss';
import { Button, Link, View } from '../elements';
import { translate } from '../../services/i18n/i18n';
import { translationKeys } from '../../constants/constants';
import { DataHook } from '../../constants/data-hooks';
import { BaseComponentProps, Theme } from '../../types';
import { savePolicy } from '../../services/consent-policy-manager/consent-policy-manager';
import { getClassStr, renderComponent } from '../../utils/utils';
import { SettingsComponent } from '../settings/settings.component';
import { CornerRadius } from '@wix/ambassador-serverless-cookie-consent-settings-serverless/types';
import { logger } from '../../services/bi-logger/bi-logger-service';

interface Props extends BaseComponentProps {
  theme: Theme;
  cornerRadius?: CornerRadius;
  declineAll?: boolean;
  onCloseClicked: () => void;
}

const secondaryButtonThemeMapper = {
  [Theme.dark]: Theme.light,
  [Theme.light]: Theme.dark,
  [Theme.custom]: Theme.custom,
  [Theme.unknown_theme]: Theme.unknown_theme,
};

export const ButtonActions = ({
  onCloseClicked,
  declineAll,
  theme = Theme.light,
  cornerRadius = CornerRadius.square,
}: Props) => {
  const onAcceptClick = async () => {
    const msid = window.wixEmbedsAPI?.getMetaSiteId() || '';
    logger.acceptButtonClicked(msid);
    void savePolicy({
      policy: {
        essential: true,
        functional: true,
        analytics: true,
        advertising: true,
      },
      successCallback: onCloseClicked,
      errorCallback: onCloseClicked,
    });
  };

  const onDeclineClick = async () => {
    const msid = window.wixEmbedsAPI?.getMetaSiteId() || '';
    logger.declineAllClicked(msid);
    void savePolicy({
      policy: {
        essential: true,
        functional: false,
        analytics: false,
        advertising: false,
      },
      successCallback: onCloseClicked,
      errorCallback: onCloseClicked,
    });
  };

  
  const onSettingsClicked = async () => {
    const msid = window.wixEmbedsAPI?.getMetaSiteId() || '';
    logger.openedPanel('banner', msid);
    await renderComponent(new SettingsComponent());
  };

  const buttonsContainer = View({
    className: `${DataHook.buttons} ${css.buttonActions} ${
      declineAll ? css.declineAll : ''
    }`,
  });

  const cornerRadiusClassName = css[cornerRadius];

  buttonsContainer.appendChild(
    Button({
      dataHook: DataHook.acceptPolicyButton,
      className: getClassStr([css.acceptButton, cornerRadiusClassName]),
      theme: secondaryButtonThemeMapper[theme],
      text: translate(translationKeys.acceptCookiesButton),
      onClick: onAcceptClick,
    }),
  );
  const settingsButtonConstructor = declineAll ? Link : Button;
  const declineAllClassName = declineAll
    ? css.settingsLink
    : css.settingsButton;

  let settingsButtonConfig = {
    text: translate(translationKeys.openSettingsButton),
    dataHook: DataHook.settingsButton,
    onClick: onSettingsClicked,
    className: getClassStr([declineAllClassName, cornerRadiusClassName]),
  };
  if (!declineAll) {
    settingsButtonConfig = {
      ...settingsButtonConfig,
      // @ts-expect-error
      theme,
      secondary: true,
    };
  }

  if (declineAll) {
    buttonsContainer.appendChild(
      Button({
        dataHook: DataHook.declineAllButton,
        text: translate(translationKeys.declineCookiesButton),
        theme,
        className: getClassStr([css.declineButton, cornerRadiusClassName]),
        onClick: onDeclineClick,
        secondary: true,
      }),
    );
  }

  const settingsButton = settingsButtonConstructor(settingsButtonConfig);

  buttonsContainer.appendChild(settingsButton);

  return buttonsContainer;
};
