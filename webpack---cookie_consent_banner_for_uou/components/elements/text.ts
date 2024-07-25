import { createElement } from '../../utils/utils';
import { BaseProps } from '../../types';

export interface Props extends BaseProps {
  text: string;
  title?: boolean;
  subtitle?: boolean;
}

export const Text = (props: Props): HTMLElement => {
  const { title = false, text, subtitle = false } = props;
  let element: HTMLElement;
  if (title) {
    element = createElement({ tagName: 'h2', ...props });
  } else if (subtitle) {
    element = createElement({ tagName: 'h3', ...props });
  } else {
    element = createElement({ tagName: 'p', ...props });
  }
  element.innerText = text;
  return element;
};
