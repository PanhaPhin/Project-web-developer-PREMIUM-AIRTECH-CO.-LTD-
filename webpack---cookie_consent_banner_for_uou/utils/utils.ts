import { BaseComponent, BaseComponentProps, BaseProps, IState } from '../types';
import { StyleSheet } from '../components/elements';
import { fontCssBaseUrl } from '../constants/constants';

export interface CreateElementOptions extends BaseProps {
  alt?: string;
  tagName: string;
  innerHtml?: string;
}

export const CSS_VARS_PREFIX = '--cookie-banner-';

export const createElement = <T extends HTMLElement>({
  tagName,
  className,
  dataHook,
  id,
  alt,
  attributes,
  innerHtml,
  innerText,
  ariaLabel,
  ariaLabelledBy,
  ariaDescribedBy,
  role,
  dataCompType,
}: CreateElementOptions): T => {
  let element = document.createElement(tagName) as T;

  if (innerHtml) {
    const div = document.createElement('div');
    div.innerHTML = innerHtml;
    element = div.firstElementChild as T;
  }

  if (className) {
    element.className = className;
  }
  if (id) {
    element.id = id;
  }
  if (attributes) {
    Object.keys(attributes).forEach((attr) => {
      element.setAttribute(attr, attributes[attr]);
    });
  }

  if (innerText) {
    element.innerText = innerText;
  }
  if (dataHook) {
    element.setAttribute('data-hook', dataHook);
  }
  if (ariaLabel) {
    element.setAttribute('aria-label', ariaLabel);
  }
  if (ariaLabelledBy) {
    element.setAttribute('aria-labelledby', ariaLabelledBy);
  }
  if (ariaDescribedBy) {
    element.setAttribute('aria-describedby', ariaDescribedBy);
  }
  if (alt) {
    element.setAttribute('alt', alt);
  }
  if (role) {
    element.setAttribute('role', role);
  }
  if (dataCompType) {
    element.setAttribute('data-comp-type', dataCompType);
  }

  return element as T;
};

export const classNames = (classesObject: any): string => {
  let className: string = '';
  Object.keys(classesObject).forEach((clz) => {
    if (classesObject[clz]) {
      className = !className ? clz : `${className} ${clz}`;
    }
  });
  return className;
};

export const getClassStr = (classes: string[]) => {
  return classes.join(' ');
};

export function renderComponent<T extends BaseComponentProps, S extends IState>(
  component: BaseComponent<T, S>,
  target: HTMLElement = document.body,
): Promise<void> {
  component.htmlElement = component.render().element;
  target.appendChild(component.htmlElement);

  if (!component.rendered) {
    return new Promise((resolve) => setTimeout(resolve, 10)).then(() => {
      component.componentRendered();
      component.rendered = true;
    });
  }
  component.onComponentUpdate();
  return Promise.resolve();
}

export const getUrlParam: (queryParam: string) => string | null = (
  queryParam,
) => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(queryParam);
};

export const applyCssVariable = (varName: string, value?: string) => {
  if (value) {
    document.documentElement.style.setProperty(
      `${CSS_VARS_PREFIX}${varName}`,
      value,
    );
  }
};

export const removeCssVariable = (varName: string) => {
  document.documentElement.style.removeProperty(`${CSS_VARS_PREFIX}${varName}`);
};

export const getCssVariable = (varName: string) => {
  return document.documentElement.style.getPropertyValue(
    `${CSS_VARS_PREFIX}${varName}`,
  );
};

export const applyFontStyleSheet = (fontFamily?: string) => {
  if (fontFamily) {
    document.head.appendChild(
      StyleSheet({
        href: `${fontCssBaseUrl}${encodeURIComponent(
          fontFamily.replace(/"/g, ''),
        )}`,
      }),
    );
  }
};

export const observeElementSize = (
  element: HTMLSpanElement,
  callback: (entry: ResizeObserverEntry) => void,
) => {
  const resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      if (entry?.target === element) {
        callback(entry);
      }
    }
  });

  resizeObserver.observe(element);

  return () => resizeObserver.unobserve(element);
};
