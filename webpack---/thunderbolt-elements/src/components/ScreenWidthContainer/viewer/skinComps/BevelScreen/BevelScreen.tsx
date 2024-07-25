import * as React from 'react';
import WrapperElement from '../../WrapperElement';
import { SkinScreenWidthContainerProps } from '../../../SkinScreenWidthContainer';
import skinStyles from './styles/skins.scss';

const BevelScreen: React.FC<SkinScreenWidthContainerProps> = ({
  wrapperProps,
  children,
}) => {
  return (
    <WrapperElement
      {...wrapperProps}
      skinClassName={skinStyles.BevelScreen}
      skinStyles={skinStyles}
    >
      <div className={skinStyles.screenWidthBackground}>
        <div className={skinStyles.bg} />
      </div>
      <div className={skinStyles.centeredContent}>
        <div className={skinStyles.centeredContentBg}></div>
        <div className={skinStyles.inlineContent}>{children}</div>
      </div>
    </WrapperElement>
  );
};

export default BevelScreen;
