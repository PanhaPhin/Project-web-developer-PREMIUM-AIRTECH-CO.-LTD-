import { useEffect, useRef } from 'react';

/**
 * Custom hook for using setInterval in a React component
 * Written by Dan Abramov:
 * https://overreacted.io/making-setinterval-declarative-with-react-hooks/
 *
 * @param callback function to run in intervals
 * @param delay The time, in milliseconds the timer should delay in between
 * executions of the specified function
 * Pass null for pausing an interval
 */
export function useInterval(callback: Function, delay: number | null) {
  const savedCallback = useRef<Function>(() => {});

  // Remember the latest callback.
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the interval.
  useEffect(() => {
    function tick() {
      savedCallback.current();
    }

    if (delay !== null) {
      const id = setInterval(tick, delay);
      return () => clearInterval(id);
    }

    return () => {};
  }, [delay]);
}
