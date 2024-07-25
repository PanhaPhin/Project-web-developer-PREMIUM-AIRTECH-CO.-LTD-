import { Span } from '../span';
import css from './tooltip.scss';
import { View } from '../view';

let tooltip: HTMLDivElement;
let tooltipText: HTMLSpanElement;

export const initTooltip = () => {
  tooltip = View({ className: css.tooltip });

  tooltipText = Span({ className: css.bubble, innerText: 'Tooltip' });
  tooltip.appendChild(tooltipText);
  tooltip.appendChild(Span({ className: css.tooltipTriangle }));
  document.body.appendChild(tooltip);
};

const showTooltip = (element: HTMLElement, text: string) => (event: any) => {
  if (!tooltip) {
    initTooltip();
  }
  tooltipText.innerText = text;
  tooltip.style.display = 'inline-block';
  const elementBounds = element.getBoundingClientRect();
  const tooltipBounds = tooltip.getBoundingClientRect();
  tooltip.style.top = `${elementBounds.y - tooltipBounds.height + 8}px`;
  tooltip.style.left = `${
    elementBounds.x + elementBounds.width / 2 - tooltipBounds.width / 2
  }px`;
};

const hideTooltip = () => () => {
  tooltip.style.display = 'none';
};

export const showOnHover = (element: HTMLElement, text: string) => {
  element.onmouseover = showTooltip(element, text);
  element.onmouseout = hideTooltip();
};
