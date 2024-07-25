interface Coordinates {
  x: number;
  y: number;
}

export interface GestureEventData {
  touched: boolean;
  moved: boolean;
  numOfTouches: number;
  deltaCoords: Coordinates;
  startCoords: Coordinates;
  evObj: TouchEvent;
  startTime: number;
  endTime: number;
}

export type GestureEventType =
  | 'onSwipeLeft'
  | 'onSwipeRight'
  | 'onSwipeUp'
  | 'onSwipeDown'
  | 'onTap';

export type SwipeDirection = 'left' | 'right' | 'up' | 'down';

export const SwipeDirectionToEventType: Record<
  SwipeDirection,
  GestureEventType
> = {
  left: 'onSwipeLeft',
  right: 'onSwipeRight',
  up: 'onSwipeUp',
  down: 'onSwipeDown',
};

export const getCoords = (event: TouchEvent): Coordinates | void => {
  if (event.touches && event.touches.length) {
    const touch = event.touches[0];
    return {
      x: touch.pageX,
      y: touch.pageY,
    };
  }
};

export const isValidSwipe = (data: GestureEventData) => {
  return (
    data.moved &&
    data.numOfTouches === 1 &&
    data.endTime - data.startTime < 500 &&
    (Math.abs(data.deltaCoords.x) > 100 || Math.abs(data.deltaCoords.y) > 60)
  );
};

export const isValidTap = (data: GestureEventData) => {
  return data.touched && !data.moved && data.numOfTouches === 1;
};

export const getSwipeDirection = (
  deltaX: number,
  deltaY: number,
): SwipeDirection => {
  let direction: SwipeDirection;
  if (Math.abs(deltaX) > Math.abs(deltaY)) {
    direction = deltaX > 0 ? 'left' : 'right';
  } else {
    direction = deltaY > 0 ? 'up' : 'down';
  }
  return direction;
};
