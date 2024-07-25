import * as React from 'react';
import { TransitionGroup } from 'react-transition-group';
import Transition from '@wix/thunderbolt-elements/src/components/Transition/Transition';
import type { ItemsContainerProps } from '../SlideShowGallery.types';
import { TestIds } from '../constants';

const SlideShowGalleryItemContainer: React.FC<ItemsContainerProps> = props => {
  const {
    skinsStyle,
    currentIndex = 0,
    isPlaying,
    transition,
    transitionDuration,
    reverse,
    onTransitionEnd,
    children,
  } = props;

  return transition === 'NoTransition' ? (
    <div
      data-testid={TestIds.items}
      aria-live={isPlaying ? 'off' : 'polite'}
      className={skinsStyle.itemsContainer}
    >
      {children}
    </div>
  ) : (
    <TransitionGroup
      data-testid={TestIds.items}
      className={skinsStyle.itemsContainer}
      aria-live={isPlaying ? 'off' : 'polite'}
      childFactory={child => React.cloneElement(child, { reverse })}
    >
      <Transition
        type={transition}
        key={currentIndex}
        timeout={transitionDuration}
        onExited={onTransitionEnd}
        unmountOnExit
      >
        {children}
      </Transition>
    </TransitionGroup>
  );
};

export default SlideShowGalleryItemContainer;
