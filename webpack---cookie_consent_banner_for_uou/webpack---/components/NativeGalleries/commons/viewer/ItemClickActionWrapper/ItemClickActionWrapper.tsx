import * as React from 'react';
import classNames from 'clsx';
import {
  activateBySpaceOrEnterButton,
  isEmptyObject,
} from '@wix/editor-elements-common-utils';
import Link from '@wix/thunderbolt-elements/src/components/Link/viewer/Link';
import type { ItemClickActionWrapperProps } from '../../GalleriesCommons.types';
import { TestIds } from '../../constants';

const ItemClickActionWrapper: React.FC<ItemClickActionWrapperProps> = props => {
  const {
    imageOnClickAction,
    openImageZoom,
    focusItemRoot,
    focusDisabledItems = false,
    imgTitle,
    imgAlt,
    link,
    children,
    skinsStyle,
    itemId,
    translations,
    onFocus = () => {},
    onBlur = () => {},
  } = props;

  const describedbyId = `describedby_${itemId}`;

  const onZoomClick = () => {
    if (focusItemRoot) {
      focusItemRoot();
    }

    openImageZoom();
  };

  switch (imageOnClickAction) {
    case 'zoomMode':
      return (
        <div
          className={classNames(
            skinsStyle.itemClickWrapper,
            skinsStyle.imageZoomBtn,
          )}
          data-testid={TestIds.imageZoomBtn}
          role="button"
          aria-haspopup="true"
          tabIndex={0}
          aria-label={imgAlt || imgTitle || undefined}
          aria-describedby={describedbyId}
          onClick={onZoomClick}
          onKeyDown={activateBySpaceOrEnterButton}
          onFocus={onFocus}
          onBlur={onBlur}
        >
          {children}
          <div style={{ display: 'none' }}>
            <span id={describedbyId} data-testid={TestIds.ariaDescribedbyId}>
              {translations.imageZoomDescribedByLabel}
            </span>
          </div>
        </div>
      );
    case 'goToLink':
      if (!isEmptyObject(link)) {
        return (
          <Link
            className={classNames(
              skinsStyle.itemClickWrapper,
              skinsStyle.imageLink,
            )}
            dataTestId={TestIds.link}
            {...(focusDisabledItems ? { tabIndex: 0 } : {})}
            {...link}
          >
            {children}
          </Link>
        );
      } else {
        break;
      }
    default:
  }

  return (
    <div
      className={skinsStyle.itemClickWrapper}
      role="img"
      data-testid={TestIds.disabledClickActionWrapper}
      {...(focusDisabledItems ? { tabIndex: 0 } : {})}
    >
      {children}
    </div>
  );
};

export default ItemClickActionWrapper;
