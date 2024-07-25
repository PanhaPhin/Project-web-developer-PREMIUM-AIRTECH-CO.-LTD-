import * as React from 'react';
import {
  GestureEventData,
  getCoords,
  getSwipeDirection,
  isValidTap,
  isValidSwipe,
  GestureEventType,
  SwipeDirectionToEventType,
} from './gestureUtils';

export type GestureEventHandler = (event: TouchEvent) => void;

const DEFAULT_EVENT_DATA: Partial<GestureEventData> = {
  touched: true,
  moved: false,
  deltaCoords: { x: 0, y: 0 },
} as const;

const getGestureRegistrationFunction =
  (
    eventType: GestureEventType,
    callback: GestureEventHandler,
    ref: React.RefObject<HTMLElement> | undefined,
  ) =>
  () => {
    let data: GestureEventData;

    const handleTouchStart = (event: TouchEvent) => {
      data = {
        ...DEFAULT_EVENT_DATA,
        numOfTouches: event.touches.length,
        startCoords: getCoords(event),
        startTime: Date.now(),
        evObj: { ...event },
      } as GestureEventData;
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (!data) {
        return;
      }
      const coords = getCoords(event);
      if (coords) {
        if (!data.startCoords) {
          data.startCoords = coords;
        }

        const deltaX = data.startCoords.x - coords.x;
        const deltaY = data.startCoords.y - coords.y;

        data.moved = true;
        data.deltaCoords = {
          x: deltaX,
          y: deltaY,
        };
      }
    };

    const handleTouchEnd = () => {
      if (!data) {
        return;
      }
      data.endTime = Date.now();
      if (eventType === 'onTap' && isValidTap(data)) {
        callback(data.evObj);
      } else if (isValidSwipe(data)) {
        const swipeDirection = getSwipeDirection(
          data.deltaCoords.x,
          data.deltaCoords.y,
        );
        const currentEventType = SwipeDirectionToEventType[swipeDirection];
        if (eventType === currentEventType) {
          callback(data.evObj);
        }
      }
    };

    if (ref && ref.current) {
      ref.current.addEventListener('touchstart', handleTouchStart, {
        passive: true,
      });
      ref.current.addEventListener('touchmove', handleTouchMove, {
        passive: true,
      });
      ref.current.addEventListener('touchend', handleTouchEnd, {
        passive: true,
      });
    }

    return () => {
      if (ref && ref.current) {
        ref.current.removeEventListener('touchstart', handleTouchStart);
        ref.current.removeEventListener('touchmove', handleTouchMove);
        ref.current.removeEventListener('touchend', handleTouchEnd);
      }
    };
  };

/**
 * @param eventType {Enum}
 * @param callback a function to be triggered for the relevant event
 * @param ref React ref of anElement to attach listeners to
 */
export const useGesture = (
  eventType: GestureEventType,
  callback: GestureEventHandler,
  ref: React.RefObject<HTMLElement> | undefined,
) =>
  // eslint-disable-next-line react-hooks/exhaustive-deps
  React.useEffect(getGestureRegistrationFunction(eventType, callback, ref), [
    eventType,
    ref,
    callback,
  ]);
