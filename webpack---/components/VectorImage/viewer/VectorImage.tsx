import * as React from 'react';
import type { IVectorImageProps } from '../VectorImage.types';
import VectorImageBase from './VectorImageBase';

const VectorImage: React.FC<IVectorImageProps> = props => {
  return <VectorImageBase {...props} tag="div" />;
};

export default VectorImage;
