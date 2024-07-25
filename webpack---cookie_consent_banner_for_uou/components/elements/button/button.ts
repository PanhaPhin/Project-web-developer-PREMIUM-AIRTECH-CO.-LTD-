import { createElement } from '../../../utils/utils';
import { BaseProps, Theme } from '../../../types';
import css from './button.scss';

export interface Props extends BaseProps {
  theme?: Theme;
  text: string;
  secondary?: boolean;
  onClick(): void;
}

export const Button = ({
  text,
  theme,
  onClick,
  className,
  secondary,
  dataHook,
}: Props) => {
  const element = createElement({ tagName: 'button', dataHook });
  element.className = `${className || ''} ${css.button} ${
    (theme && css[theme]) || ''
  } ${secondary ? css.secondary : ''}`;
  element.onclick = onClick;
  element.innerText = text;

  return element;
};
