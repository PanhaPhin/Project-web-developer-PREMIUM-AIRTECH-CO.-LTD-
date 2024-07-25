import * as React from 'react';
import classNames from 'clsx';
import {
  formatClassNames,
  getDataAttributes,
} from '@wix/editor-elements-common-utils';
import MeshContainer from '../../../thunderbolt-core-components/MeshContainer/viewer/MeshContainer';
import { IFooterContainerProps } from '../FooterContainer.types';
import semanticClassNames from '../FooterContainer.semanticClassNames';

const DEFAULT_TAB_INDEX = '-1';

const FooterContainer: React.FC<IFooterContainerProps> = props => {
  const {
    id,
    className,
    customClassNames = [],
    skin: FooterContainerClass,
    children,
    meshProps,
    fillLayers,
    isFooterTag,
  } = props;

  const sdkEventHandlers = {
    onMouseEnter: props.onMouseEnter,
    onMouseLeave: props.onMouseLeave,
    onClick: props.onClick,
    onDoubleClick: props.onDblClick,
  };

  const rootClassNames = classNames(
    className,
    formatClassNames(semanticClassNames.root, ...customClassNames),
  );

  return (
    <FooterContainerClass
      wrapperProps={{
        ...getDataAttributes(props),
        id,
        ...(isFooterTag && {
          tagName: 'footer',
        }),
        eventHandlers: sdkEventHandlers,
        tabIndex: DEFAULT_TAB_INDEX,
        className: rootClassNames,
      }}
      fillLayers={fillLayers}
      data-block-level-container="FooterContainer"
    >
      <MeshContainer id={id} {...meshProps}>
        {children}
      </MeshContainer>
    </FooterContainerClass>
  );
};

export default FooterContainer;
