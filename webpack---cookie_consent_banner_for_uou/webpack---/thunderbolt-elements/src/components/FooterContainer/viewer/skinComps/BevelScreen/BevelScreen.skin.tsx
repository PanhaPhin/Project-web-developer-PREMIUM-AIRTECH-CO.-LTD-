import React from 'react';
import { IFooterContainerProps } from '../../../FooterContainer.types';
import BevelScreen from '../../../../ScreenWidthContainer/viewer/skinComps/BevelScreen/BevelScreen';
import FooterContainer from '../../FooterContainer';

const BevelScreenFooter: React.FC<
  Omit<IFooterContainerProps, 'skin'>
> = props => <FooterContainer {...props} skin={BevelScreen}></FooterContainer>;

export default BevelScreenFooter;
