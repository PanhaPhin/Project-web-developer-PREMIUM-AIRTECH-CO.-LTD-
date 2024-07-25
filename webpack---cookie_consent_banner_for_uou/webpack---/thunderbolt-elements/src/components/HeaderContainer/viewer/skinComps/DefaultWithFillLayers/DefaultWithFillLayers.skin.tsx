import React from 'react';
import { IHeaderContainerProps } from '../../../HeaderContainer.types';
import DefaultWithFillLayers from '../../../../ScreenWidthContainer/viewer/skinComps/DefaultWithFillLayers/DefaultWithFillLayers';
import HeaderContainer from '../../HeaderContainer';

const DefaultWithFillLayersHeader: React.FC<
  Omit<IHeaderContainerProps, 'skin'>
> = props => (
  <HeaderContainer {...props} skin={DefaultWithFillLayers}></HeaderContainer>
);

export default DefaultWithFillLayersHeader;
