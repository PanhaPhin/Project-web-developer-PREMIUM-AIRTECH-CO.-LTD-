import React from 'react';
import Page from '../../Page';
import type { SkinPageProps } from '../SkinPage';
import skinsStyles from './styles/BasicPageSkin.scss';
import type { BasePageSkinProps } from './BasePageSkin';
import BasePageSkin from './BasePageSkin';

const BasicPageSkin: React.FC<
  Omit<BasePageSkinProps, 'skinsStyle'>
> = props => <BasePageSkin {...props} skinsStyle={skinsStyles} />;

const BasicPage: React.FC<SkinPageProps> = props => (
  <Page {...props} skin={BasicPageSkin} />
);

export default BasicPage;
