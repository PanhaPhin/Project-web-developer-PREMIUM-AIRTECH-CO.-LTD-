import { createElement } from '../../utils/utils';
import { BaseProps } from '../../types';

export interface Props extends BaseProps {
  text: string;
  href?: string;
  target?: string;
  onClick?(): void;
}

export const Link = (props: Props) => {
  const { text, onClick, className, dataHook, href, target } = props;
  const element = createElement<HTMLAnchorElement>({
    tagName: href ? 'a' : 'span',
    className,
    dataHook,
  });
  if (href) {
    element.href = href;
  } else {
    element.role = 'button';
    element.tabIndex = 0;
  }
  if (target) {
    element.target = target;
  }
  element.innerText = text;

  if (onClick) {
    element.onclick = onClick;
    element.onkeyup = (e: any) => {
      if (e.key === 'Enter' || e.key === ' ') {
        onClick();
      }
    };
    element.onkeydown = (e: any) => {
      if (e.key === ' ') {
        e.preventDefault();
      }
    };
  }

  return element;
};
