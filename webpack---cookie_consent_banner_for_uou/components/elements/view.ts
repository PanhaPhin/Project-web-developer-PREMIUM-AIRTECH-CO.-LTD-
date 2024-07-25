import { BaseProps } from '../../types';
import { createElement } from '../../utils/utils';

export const View = (props: BaseProps): HTMLDivElement =>
  createElement({ tagName: 'div', ...props });
