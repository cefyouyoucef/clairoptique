const PRODUCT_RETURN_STORAGE_KEY = "clairoptique:product-return";
const PRODUCT_RETURN_EVENT = "clairoptique-product-return";

function getLocationPath(location) {
  if (!location?.pathname) return "";

  return `${location.pathname}${location.search || ""}${location.hash || ""}`;
}

function readProductReturnState() {
  try {
    const storedValue = window.sessionStorage.getItem(
      PRODUCT_RETURN_STORAGE_KEY
    );

    return storedValue ? JSON.parse(storedValue) : null;
  } catch {
    return null;
  }
}

function saveProductReturnState({
  location,
  productPath,
  searchQuery = "",
}) {
  const from = {
    pathname: location.pathname,
    search: location.search,
    hash: location.hash,
  };
  const scrollY = window.scrollY;
  const navigationState = { from, scrollY };

  try {
    window.sessionStorage.setItem(
      PRODUCT_RETURN_STORAGE_KEY,
      JSON.stringify({
        ...navigationState,
        fromKey: location.key,
        productPath,
        searchQuery,
      })
    );
  } catch {
    // React Router state still preserves the return route when storage is unavailable.
  }

  return navigationState;
}

function clearProductReturnState() {
  try {
    window.sessionStorage.removeItem(PRODUCT_RETURN_STORAGE_KEY);
  } catch {
    // Ignore unavailable session storage.
  }
}

export {
  PRODUCT_RETURN_EVENT,
  clearProductReturnState,
  getLocationPath,
  readProductReturnState,
  saveProductReturnState,
};
