import { BaseProps } from '../../types';
import { createElement } from '../../utils/utils';

export interface Props extends BaseProps {
  forElement: string;
}

export const Label = (props: Props): HTMLLabelElement => {
  const { forElement } = props;
  const label = createElement({
    tagName: 'label',
    ...props,
  }) as HTMLLabelElement;
  label.htmlFor = forElement;
  return label;
};
