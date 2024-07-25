import * as React from 'react';
import classNames from 'clsx';
import { TestIds } from '../constants';
import type { INavigationButtonsProps } from '../GalleriesCommons.types';
import { GalleryCounter } from './GalleryCounter';

export const NavigationButtons: React.FunctionComponent<
  INavigationButtonsProps
> = ({
  translations,
  skinsStyle,
  moveToPrevItem,
  moveToNextItem,
  withCounter = false,
  currentIndex,
  itemsLength,
  reverse,
  buttonPrevContent,
  buttonNextContent,
}) => {
  return (
    <nav
      aria-label={translations.navigationButtonAriaLabel}
      className={skinsStyle.navButtons}
      data-testid={TestIds.navButtons}
    >
      <button
        className={classNames(skinsStyle.navButton, skinsStyle.buttonPrev)}
        data-testid={TestIds.prevButton}
        type="button"
        aria-label={
          reverse
            ? translations.nextButtonAriaLabel
            : translations.prevButtonAriaLabel
        }
        onClick={reverse ? moveToNextItem : moveToPrevItem}
      >
        <span
          className={skinsStyle.arrow}
          data-testid={TestIds.prevButtonInner}
          role="presentation"
          aria-hidden="true"
        >
          {buttonPrevContent}
        </span>
      </button>
      {withCounter && (
        <GalleryCounter
          skinsStyle={skinsStyle}
          currentIndex={currentIndex}
          itemsLength={itemsLength}
        />
      )}
      <button
        className={classNames(skinsStyle.navButton, skinsStyle.buttonNext)}
        data-testid={TestIds.nextButton}
        type="button"
        aria-label={
          reverse
            ? translations.prevButtonAriaLabel
            : translations.nextButtonAriaLabel
        }
        onClick={reverse ? moveToPrevItem : moveToNextItem}
      >
        <span
          className={skinsStyle.arrow}
          data-testid={TestIds.nextButtonInner}
          role="presentation"
          aria-hidden="true"
        >
          {buttonNextContent}
        </span>
      </button>
    </nav>
  );
};
