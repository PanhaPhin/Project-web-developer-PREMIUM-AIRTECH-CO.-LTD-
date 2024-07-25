import * as React from 'react';
import classNames from 'clsx';

import {
  getAriaAttributes,
  getDataAttributes,
} from '@wix/editor-elements-common-utils';
import MeshContainer from '@wix/thunderbolt-elements/src/thunderbolt-core-components/MeshContainer/viewer/MeshContainer';
import type {
  IContainerLogicProps,
  IContainerImperativeActions,
} from '../../Container.types';
import styles from './common.scss';
import { ARIA_LABEL_DEFAULT } from './constants';

const ContainerLogicComp: React.ForwardRefRenderFunction<
  IContainerImperativeActions,
  IContainerLogicProps
> = (props, ref) => {
  const {
    id,
    className,
    meshProps,
    renderSlot,
    children,
    onClick,
    onKeyPress,
    onDblClick,
    onFocus,
    onBlur,
    onMouseEnter,
    onMouseLeave,
    translations,
    hasPlatformClickHandler,
    a11y = {},
    ariaAttributes = {},
    tabIndex,
    role,
    style,
  } = props;

  const rootElementRef = React.useRef<HTMLDivElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (onKeyPress) {
      // Prevent browser scroll
      e.key === ' ' && e.preventDefault();
      onKeyPress(e);
    }
  };

  const { 'aria-label-interactions': ariaLabelInteractions, ...a11yAttr } =
    a11y;

  if (ariaLabelInteractions) {
    a11yAttr['aria-label'] = translations?.ariaLabel || ARIA_LABEL_DEFAULT;
  }

  const meshContainerProps = {
    id,
    children,
    ...meshProps,
  };

  const containerClassName = classNames(className, {
    [styles.clickable]: hasPlatformClickHandler,
  });

  React.useImperativeHandle(ref, () => {
    return {
      focus: () => {
        rootElementRef.current?.focus();
      },
      blur: () => {
        rootElementRef.current?.blur();
      },
    };
  });

  return (
    <div
      id={id}
      {...getDataAttributes(props)}
      ref={rootElementRef}
      className={containerClassName}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      onFocus={onFocus}
      onBlur={onBlur}
      onDoubleClick={onDblClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={style}
      {...a11yAttr}
      {...getAriaAttributes({ ...ariaAttributes, tabIndex, role })}
    >
      {renderSlot({
        containerChildren: <MeshContainer {...meshContainerProps} />,
      })}
    </div>
  );
};

export const ContainerLogic = React.forwardRef(ContainerLogicComp);
