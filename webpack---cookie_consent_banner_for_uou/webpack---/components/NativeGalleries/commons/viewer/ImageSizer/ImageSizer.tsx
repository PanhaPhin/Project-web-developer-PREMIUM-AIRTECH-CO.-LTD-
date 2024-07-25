import * as React from 'react';
import classNames from 'clsx';
import type { ImageSizerProps } from '../../../MatrixGalleryItem/MatrixGalleryItem.types';
import registerGalleryImagerSizer from './gallery-image-sizer';
import style from './style/ImageSizer.scss';

registerGalleryImagerSizer();

const ImageSizer: React.FC<ImageSizerProps> = props => {
  const { className, isFitMode, imageWidth, imageHeight, children } = props;

  return isFitMode ? (
    <gallery-image-sizer
      class={classNames(className, style.root)}
      data-image-width={imageWidth}
      data-image-height={imageHeight}
    >
      {children}
    </gallery-image-sizer>
  ) : (
    <div className={className}>{children}</div>
  );
};

export default ImageSizer;
