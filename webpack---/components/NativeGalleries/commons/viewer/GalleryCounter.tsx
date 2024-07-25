import * as React from 'react';
import { TestIds } from '../constants';
import type { IGalleryCounterProps } from '../GalleriesCommons.types';

export const GalleryCounter: React.FunctionComponent<IGalleryCounterProps> = ({
  skinsStyle,
  currentIndex = 0,
  itemsLength = 0,
}) => {
  return (
    <div data-testid={TestIds.counter} className={skinsStyle.counter}>
      {`${currentIndex + 1}/${itemsLength}`}
    </div>
  );
};
