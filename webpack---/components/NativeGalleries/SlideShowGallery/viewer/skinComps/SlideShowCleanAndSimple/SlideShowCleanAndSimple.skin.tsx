import * as React from 'react';
import type {
  ISlideShowGalleryImperativeActions,
  ISlideShowGalleryProps,
} from '../../../SlideShowGallery.types';
import SlideShowGallery from '../../SlideShowGallery';
import skinsItemStyle from '../../../../SlideShowGalleryItem/viewer/style/SlideShowCleanAndSimpleItem.scss';
import skinsStyle from './styles/SlideShowCleanAndSimple.scss';

const SlideShowGalleryLiftedShadowSkin: React.ForwardRefRenderFunction<
  ISlideShowGalleryImperativeActions,
  Omit<ISlideShowGalleryProps, 'skin'>
> = (props, ref) => (
  <SlideShowGallery
    ref={ref}
    {...props}
    skinsStyle={skinsStyle}
    skinsItemStyle={skinsItemStyle}
    overlay={<div className={skinsStyle.border} />}
    panelInImageWrapper
  />
);

export default React.forwardRef(SlideShowGalleryLiftedShadowSkin);
