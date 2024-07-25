import { BaseProps } from '../../types';
import { createElement } from '../../utils/utils';

export const Paragraph = (props: BaseProps): HTMLParagraphElement =>
  createElement({ tagName: 'p', ...props });
