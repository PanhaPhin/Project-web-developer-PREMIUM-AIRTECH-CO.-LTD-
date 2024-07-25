import css from './close-button.scss';
import { createElement } from '../../utils/utils';
import { BaseProps } from '../../types';
import { translate } from '../../services/i18n/i18n';

export interface Props extends BaseProps {
  onClick: (event: MouseEvent) => void;
  invert: boolean;
  alt?: string;
  color: string;
}

export const CloseButton = (props: Props) => {
  const { onClick, invert, dataHook, alt, ariaLabel } = props;
  const themeClass = invert ? css.dark : '';
  const image = createElement<HTMLImageElement>({
    tagName: 'img',
    alt: ariaLabel || translate('close.button.label'),
    className: `${css.closeButtonImage} ${themeClass}`,
  });
  if (alt) {
    image.alt = alt;
  }

  const svgAsString = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><g><g><g><path fill="${props.color}" id="close-svg-path" d="M17.294 6l.706.706L12.705 12 18 17.294l-.706.706L12 12.705 6.706 18 6 17.294 11.295 12 6 6.706 6.706 6 12 11.295 17.294 6z" transform="translate(-471.000000, -646.000000) translate(471.000000, 646.000000)"/></g></g></g></svg>`;
  const encoded = window.btoa(svgAsString);
  image.src = `data:image/svg+xml;base64,${encoded}`;

  const button = createElement<HTMLButtonElement>({
    tagName: 'button',
    className: `${css.closeButton} ${props.className || ''}`,
    ariaLabel: ariaLabel || translate('close.button.label'),
    dataHook,
  });
  button.onclick = onClick;
  button.appendChild(image);

  return button;
};
