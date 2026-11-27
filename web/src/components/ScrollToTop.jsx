import { useEffect, useLayoutEffect, useRef } from 'react';
import { useLocation } from 'react-router';

// The app scrolls the window: SiteLayout is min-h-screen and its main column
// has no overflow container. Keep the helper injectable so it can be tested.
const useIsomorphicLayoutEffect =
  typeof window === 'undefined' ? useEffect : useLayoutEffect;

export function resetScroll(win = typeof window === 'undefined' ? null : window) {
  if (!win || typeof win.scrollTo !== 'function') {
    return;
  }

  win.scrollTo({ top: 0, left: 0, behavior: 'instant' });
}

// Only a new screen resets the scroll. Search-param and filter changes keep the
// current position because the pathname does not change.
export function debeReiniciarScroll(pathnameAnterior, pathnameActual) {
  return pathnameAnterior !== pathnameActual;
}

export default function ScrollToTop() {
  const { pathname } = useLocation();
  const pathnameAnterior = useRef(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
      // The router owns scroll restoration; this keeps the browser from
      // restoring an old position after a pathname change.
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  // A new screen always starts at the top before the browser paints. The first
  // mount also resets, so a reload never restores an old position.
  useIsomorphicLayoutEffect(() => {
    if (debeReiniciarScroll(pathnameAnterior.current, pathname)) {
      resetScroll();
    }
    pathnameAnterior.current = pathname;
  }, [pathname]);

  return null;
}
