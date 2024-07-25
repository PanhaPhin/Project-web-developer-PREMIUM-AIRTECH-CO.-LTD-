import { BaseProps } from '../../types';
import { createElement } from '../../utils/utils';

export const Span = (props: BaseProps): HTMLSpanElement =>
  createElement({ tagName: 'span', ...props });
