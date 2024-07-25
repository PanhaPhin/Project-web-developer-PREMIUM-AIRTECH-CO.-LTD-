import { createElement } from '../../utils/utils';
import { BaseProps } from '../../types';

export interface Props extends BaseProps {
  type: string;
  checked?: boolean;
  disabled: boolean;
}

export const Input = (props: Props): HTMLInputElement => {
  const { type, checked, disabled } = props;
  const input = createElement({
    tagName: 'input',
    ...props,
  }) as HTMLInputElement;
  input.type = type;
  input.checked = checked || false;
  input.disabled = disabled;
  return input;
};
