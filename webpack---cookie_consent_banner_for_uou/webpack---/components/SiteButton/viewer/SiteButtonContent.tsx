import type { ForwardRefRenderFunction, ReactNode, RefObject } from 'react';
import React from 'react';
import classnames from 'clsx';
import type { IFocusPropsSDKActions } from '@wix/editor-elements-corvid-utils';
import type { AriaAttributes } from '@wix/editor-elements-common-utils';
import { activateBySpaceOrEnterButton } from '@wix/editor-elements-common-utils';
import Link from '@wix/thunderbolt-elements/src/components/Link/viewer/Link';
import { TestIds, ElementType } from '../constants';
import type { ISiteButtonImperativeActions } from '../SiteButton.types';
import type { SkinButtonProps } from './skinComps/SkinButton.types';
import styles from './SiteButtonContent.scss';

export type SiteButtonContentCompProps = {
  linkProps: SkinButtonProps['linkProps'];
  a11yProps: Partial<AriaAttributes>;
  elementType: SkinButtonProps['elementType'];
  className: string;
  children: ReactNode;
  autoFocus?: boolean;
  disabled?: boolean;
} & IFocusPropsSDKActions;

const SiteButtonContent: ForwardRefRenderFunction<
  ISiteButtonImperativeActions,
  SiteButtonContentCompProps
> = (
  {
    elementType,
    linkProps,
    a11yProps,
    className,
    children,
    autoFocus,
    onBlur,
    onFocus,
    disabled,
  },
  ref,
) => {
  const buttonRef = React.useRef<
    HTMLAnchorElement | HTMLDivElement | HTMLButtonElement
  >(null);

  React.useImperativeHandle(ref, () => ({
    focus: () => buttonRef.current?.focus(),
    blur: () => buttonRef.current?.blur(),
  }));

  const buttonClassName = classnames(className, styles['site-button-content']);

  switch (elementType) {
    case ElementType.Link:
      return (
        <Link
          {...(linkProps || {})}
          {...a11yProps}
          className={buttonClassName}
          ref={buttonRef as RefObject<HTMLAnchorElement | HTMLDivElement>}
          data-testid={TestIds.linkElement}
          onFocusCapture={onFocus}
          onBlurCapture={onBlur}
        >
          {children}
        </Link>
      );
    case ElementType.Button:
      return (
        <button
          {...a11yProps}
          ref={buttonRef as RefObject<HTMLButtonElement>}
          data-testid={TestIds.buttonElement}
          className={buttonClassName}
          autoFocus={autoFocus}
          onFocus={onFocus}
          onBlur={onBlur}
          disabled={disabled}
          onKeyDown={activateBySpaceOrEnterButton}
        >
          {children}
        </button>
      );
    default:
      return null;
  }
};

export default React.forwardRef(SiteButtonContent);
