import { BaseProps } from '../../types';
import { createElement } from '../../utils/utils';

export const Section = (props: BaseProps): HTMLDivElement =>
  createElement({ tagName: 'section', ...props });
