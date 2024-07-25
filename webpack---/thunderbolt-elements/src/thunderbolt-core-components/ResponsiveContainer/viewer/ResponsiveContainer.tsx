import React, { ReactElement, useCallback } from 'react';
import { getAriaAttributes } from '@wix/editor-elements-common-utils/src/commons/a11y';
import classNames from 'clsx';
import { IResponsiveContainerProps } from '../ResponsiveContainer.types';
import { TestIds } from '../constants';
import style from './style/ResponsiveContainer.scss';

const OverflowWrapper = React.forwardRef<
  HTMLDivElement,
  {
    className: string;
    children?: React.ReactElement;
    isExperimentFixRoundBorderOn?: boolean;
  }
>(({ children, className, isExperimentFixRoundBorderOn }, ref) => {
  const roundBorderClassName = isExperimentFixRoundBorderOn
    ? [style['container-overflow']]
    : [];
  return (
    <div
      className={classNames(className, ...roundBorderClassName)}
      data-testid={TestIds.overflow}
      ref={ref}
    >
      {children}
    </div>
  );
});

const ResponsiveContainer: React.ForwardRefRenderFunction<
  HTMLDivElement,
  IResponsiveContainerProps
> = (
  {
    containerLayoutClassName,
    overlowWrapperClassName,
    hasOverflow,
    hasScrollOverflow,
    shouldOmitWrapperLayers,
    children,
    role,
    label,
    extraRootClass = '',
    ariaLive,
    ariaAttributes,
    tabIndex: tabIndexFromProps,
    isExperimentFixRoundBorderOn,
    tagName = 'div',
  },
  ref,
) => {
  const hasOverflowWrapper = !shouldOmitWrapperLayers && hasOverflow;
  const tabIndexWithOverflow = hasScrollOverflow ? tabIndexFromProps || 0 : -1;

  const tabIndex = hasOverflowWrapper ? tabIndexWithOverflow : undefined;

  const wrapWithOverflowWrapperIfNeeded = useCallback(
    (reactChildren: ReactElement) =>
      hasOverflowWrapper ? (
        <OverflowWrapper
          className={classNames(overlowWrapperClassName, extraRootClass)}
          isExperimentFixRoundBorderOn={isExperimentFixRoundBorderOn}
        >
          {reactChildren}
        </OverflowWrapper>
      ) : (
        reactChildren
      ),
    [
      hasOverflowWrapper,
      overlowWrapperClassName,
      extraRootClass,
      isExperimentFixRoundBorderOn,
    ],
  );

  const classes = hasOverflow
    ? containerLayoutClassName
    : classNames(containerLayoutClassName, extraRootClass);

  const childProps: Record<string, any> = {
    ref,
    'data-testid': TestIds.content,
    tabIndex,
    ...(role ? { role } : {}),
    ...(label ? { 'aria-label': label } : {}),
    ...(ariaLive ? { 'aria-live': ariaLive } : {}),
    ...getAriaAttributes(ariaAttributes),
  };

  if (tagName === 'multi-column-layouter') {
    childProps.class = classes;
    childProps.style = { visibility: 'hidden' };
  } else {
    childProps.className = classes;
  }

  return wrapWithOverflowWrapperIfNeeded(
    shouldOmitWrapperLayers ? (
      <React.Fragment>{children()}</React.Fragment>
    ) : (
      React.createElement(tagName || 'div', childProps, children())
    ),
  );
};

export default React.forwardRef(ResponsiveContainer);
