import { useEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";
import {
  PRODUCT_RETURN_EVENT,
  clearProductReturnState,
  getLocationPath,
  readProductReturnState,
} from "../utils/productNavigation.js";

export default function ScrollToTop() {
  const location = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    const previousScrollRestoration = window.history.scrollRestoration;

    window.history.scrollRestoration = "manual";

    return () => {
      window.history.scrollRestoration = previousScrollRestoration;
    };
  }, []);

  useEffect(() => {
    const currentPath = getLocationPath(location);
    const savedReturn = readProductReturnState();
    const isSavedOrigin =
      savedReturn && getLocationPath(savedReturn.from) === currentPath;
    const isExplicitFallback =
      location.state?.restoreProductScroll === true;
    const shouldRestore =
      isSavedOrigin &&
      (navigationType === "POP" || isExplicitFallback);

    if (shouldRestore) {
      const targetScrollY = Math.max(0, Number(savedReturn.scrollY) || 0);
      const restoreDeadline = Date.now() + 5000;
      let animationFrameId;

      function restoreScrollWhenReady() {
        const maximumScrollY = Math.max(
          0,
          document.documentElement.scrollHeight - window.innerHeight
        );

        if (maximumScrollY >= targetScrollY || Date.now() >= restoreDeadline) {
          window.scrollTo({
            top: Math.min(targetScrollY, maximumScrollY),
            left: 0,
            behavior: "auto",
          });

          window.dispatchEvent(
            new CustomEvent(PRODUCT_RETURN_EVENT, {
              detail: { searchQuery: savedReturn.searchQuery || "" },
            })
          );
          clearProductReturnState();
          return;
        }

        animationFrameId = window.requestAnimationFrame(
          restoreScrollWhenReady
        );
      }

      animationFrameId = window.requestAnimationFrame(restoreScrollWhenReady);

      return () => window.cancelAnimationFrame(animationFrameId);
    }

    const isSavedProduct =
      savedReturn?.productPath && savedReturn.productPath === currentPath;

    if (savedReturn && !isSavedProduct) {
      clearProductReturnState();
    }

    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "auto",
    });
    return undefined;
  }, [location.pathname]);

  return null;
}
