import { useState, useEffect, RefObject } from 'react';

const isIntersectionObserverSupported = () =>
  typeof window.IntersectionObserver === 'function';

/**
 * Custom hook for determining if DOM node is in viewport
 *
 * @param ref a reference to a DOM node
 * @param notSupportedValue a value to return if IntersectionObserver is not supported
 */
export function useInViewport(
  ref: RefObject<any>,
  notSupportedValue: boolean = false,
) {
  const [isIntersecting, setIntersecting] = useState(false);

  useEffect(() => {
    if (!isIntersectionObserverSupported()) {
      setIntersecting(notSupportedValue);
      return () => {};
    }

    const currentRef = ref.current;
    if (currentRef && isIntersectionObserverSupported()) {
      const observer = new window.IntersectionObserver(entries => {
        // FYI: there can be multiple entries even though we only observe one element, so to get last update we need to get the last entry
        const lastEntry = entries[entries.length - 1];
        setIntersecting(lastEntry.isIntersecting);
      });

      observer.observe(currentRef);

      return () => {
        observer.disconnect();
      };
    }

    return () => {};
  }, [ref, notSupportedValue]);

  return isIntersecting;
}
