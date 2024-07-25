import { createElement } from '../../utils/utils';
import { BaseProps } from '../../types';

export interface Props extends BaseProps {
  href?: string;
}

export const StyleSheet = (props: Props) => {
  const { className, dataHook, href } = props;
  const element = createElement<HTMLAnchorElement>({
    tagName: 'link',
    className,
    dataHook,
    attributes: { rel: 'stylesheet', type: 'text/css' },
  });

  if (href) {
    element.href = href;
  }

  return element;
};
