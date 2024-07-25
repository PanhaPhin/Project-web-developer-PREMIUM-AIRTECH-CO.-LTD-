import classnames from 'clsx';
import React from 'react';
import { formatClassNames } from '@wix/editor-elements-common-utils';
import { TestIds } from '../../../constants';
import { SkinPageProps } from '../SkinPage';
import semanticClassNames from '../../../Page.semanticClassNames';
import styles from './styles/ResponsivePageWithColorBG.scss';

const ResponsivePageWithColorBG: React.FC<SkinPageProps> = ({
  id,
  className,
  customClassNames = [],
  pageDidMount,
  onClick,
  onDblClick,
  children,
  onMouseEnter,
  onMouseLeave,
}) => {
  return (
    <div
      id={id}
      className={classnames(styles.root, className)}
      ref={pageDidMount}
      onClick={onClick}
      onDoubleClick={onDblClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div
        className={classnames(
          styles.bg,
          formatClassNames(semanticClassNames.root, ...customClassNames),
        )}
        data-testid={TestIds.background}
      />
      <div>{children()}</div>
    </div>
  );
};

export default ResponsivePageWithColorBG;
