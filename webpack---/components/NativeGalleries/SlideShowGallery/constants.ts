import { TestIds as commonTestIds } from '../commons/constants';

export const TestIds = {
  root: 'slide-show-gallery',
  items: 'slide-show-gallery-items',
  ghostItem: 'gallery-item-ghost',
  item: commonTestIds.item,
  navButtons: commonTestIds.navButtons,
  prevButton: commonTestIds.prevButton,
  nextButton: commonTestIds.nextButton,
  prevButtonInner: commonTestIds.prevButtonInner,
  nextButtonInner: commonTestIds.nextButtonInner,
  playButton: 'slide-show-gallery-playButton',
  playButtonInner: 'slide-show-gallery-playButtonInner',
  counter: commonTestIds.counter,
  slideShowIcon: 'slide-show-gallery-icon',
} as const;

export const translations = {
  ARIA_LABEL_NAMESPACE: 'ariaLabels',
  SLIDE_SHOW_GALLERY_ARIA_LABEL_KEY: 'SlideShowGallery_AriaLabel_TopLevel',
  SLIDE_SHOW_GALLERY_ARIA_LABEL_DEFAULT: 'Slide show gallery',
  NAVIGATION_BUTTONS_ARIA_LABEL_KEY:
    'SlideShowGallery_AriaLabel_NavigationButtons',
  NAVIGATION_BUTTONS_ARIA_LABEL_DEFAULT: 'slides',
  NEXT_BUTTON_ARIA_LABEL_KEY: 'SlideShowGallery_AriaLabel_NextButton',
  NEXT_BUTTON_ARIA_LABEL_DEFAULT: 'next',
  PREV_BUTTON_ARIA_LABEL_KEY: 'SlideShowGallery_AriaLabel_PrevButton',
  PREV_BUTTON_ARIA_LABEL_DEFAULT: 'previous',
  PLAY_BUTTON_ARIA_LABEL_KEY: 'SlideShowGallery_AriaLabel_PlayButton',
  PLAY_BUTTON_ARIA_LABEL_DEFAULT: 'play',
};
