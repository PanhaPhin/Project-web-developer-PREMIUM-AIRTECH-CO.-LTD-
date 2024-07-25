import React from 'react';
import Page from '../../Page';
import type { SkinPageProps } from '../SkinPage';
import skinsStyles from './styles/TransparentPageSkin.scss';
import type { BasePageSkinProps } from './BasePageSkin';
import BasePageSkin from './BasePageSkin';

const TransparentPageSkin: React.FC<
  Omit<BasePageSkinProps, 'skinsStyle'>
> = props => <BasePageSkin {...props} skinsStyle={skinsStyles} />;

const TransparentPage: React.FC<SkinPageProps> = props => (
  <Page {...props} skin={TransparentPageSkin} />
);

export default TransparentPage;
