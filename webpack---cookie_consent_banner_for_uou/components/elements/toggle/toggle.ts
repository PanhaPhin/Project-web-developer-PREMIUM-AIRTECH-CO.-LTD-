import { BaseProps } from '../../../types';
import css from './toggle.scss';
import { Span } from '../span';
import { Input } from '../input';
import { Label } from '../label';
import { DataHook } from '../../../constants/data-hooks';
import { showOnHover } from '../tooltip/tooltip-service';
import { createElement } from '../../../utils/utils';

export interface Props extends BaseProps {
  checked?: boolean;
  enabled: boolean;
  tooltip?: string;
  onCheckedChanged(): void;
}
const toggleInputId = 'consent-banner-toggleEnabled-input-id';
let toggleId = 0;

export const Toggle = (props: Props) => {
  const {
    enabled,
    checked,
    dataHook,
    tooltip,
    onCheckedChanged,
    ariaLabelledBy,
    ariaDescribedBy,
  } = props;
  const container = Span({
    dataHook,
  });

  function updateContainerClassName(event?: any) {
    if (event?.target?.matches(':focus-visible')) {
      container.className = `${css.toggle} ${props.className} ${css.focus}`;
      return;
    }
    container.className = `${css.toggle} ${props.className}`;
  }

  const input = Input({
    className: css.input,
    type: 'checkbox',
    disabled: !enabled,
    checked,
    ariaDescribedBy,
    ariaLabelledBy,
    dataHook: DataHook.sectionComponentToggleInput,
    id: `${toggleInputId}_${toggleId++}`,
  });

  input.addEventListener('keydown', (event) => {
    const ENTER_KEY_CODE = 13;
    //NOTE: keyCode is checked as well for older browsers compatibility.
    if (event.key === 'Enter' || event.keyCode === ENTER_KEY_CODE) {
      event.preventDefault();
      input.checked = !input.checked;
      input.dispatchEvent(new Event('change'));
      onCheckedChanged();
    }
  });

  input.addEventListener('focusin', updateContainerClassName);
  input.addEventListener('focusout', updateContainerClassName);

  input.onclick = onCheckedChanged;
  const knob = Span({ className: css.knob });
  const label = Label({ className: css.label, forElement: input.id });
  label.appendChild(Span({ className: css.track }));
  label.appendChild(knob);

  if (tooltip) {
    showOnHover(label, tooltip);
  }

  const falseSvg = createElement({
    tagName: 'svg',
    innerHtml: `<svg class="${css.icon} ${css.iconFalse}" viewBox="0 0 11 2" fill="currentColor" width="10" height="2">
    <path d="M0 0H10V2H0z"/>
      </svg>`,
  });
  const trueSvg = createElement({
    tagName: 'svg',
    innerHtml: `<svg class="${css.icon} ${css.iconTrue}" viewBox="0 0 11 8" fill="currentColor" width="10" height="8">
        <path d="M3.8 5L1.2 2.5 0 3.7 3.8 7.5 10 1.2 8.8 0z"/>
      </svg>`,
  });

  knob.appendChild(falseSvg);
  knob.appendChild(trueSvg);
  container.appendChild(input);
  container.appendChild(label);

  updateContainerClassName();

  return container;
};
