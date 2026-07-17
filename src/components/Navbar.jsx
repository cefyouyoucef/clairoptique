import { useEffect, useMemo, useRef, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  getProductCategoryLabel,
  getProductPlaceholder,
  handleProductImageError,
} from "./ProductCard.jsx";
import {
  formatPrice,
  getProductImagePath,
} from "../utils/productPresentation.js";
import { useLanguage } from "../context/LanguageContext.jsx";
import { useProducts } from "../context/ProductsContext.jsx";
import {
  getLocalizedProductName,
  translate,
} from "../i18n/translations.js";
import {
  normalizeSearchText,
  productMatchesSearch,
} from "../utils/productSearch.js";

function getSearchGenderLabel(gender, language) {
  const genderKeys = {
    Homme: "product.gender.men",
    Femme: "product.gender.women",
    Enfant: "product.gender.children",
    Tous: "product.gender.all",
  };

  return genderKeys[gender]
    ? translate(language, genderKeys[gender])
    : String(gender || "");
}

function getSearchColorAliases(color) {
  const colorAliases = {
    noir: ["أسود"],
    marron: ["بني"],
    bleu: ["أزرق"],
    "argenté": ["فضي"],
    "or rose": ["ذهبي وردي"],
    transparent: ["شفاف"],
  };

  return colorAliases[normalizeSearchText(color)] || [];
}

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { language, t, toggleLanguage } = useLanguage();
  const { products, productsError, productsStatus } = useProducts();
  const inputRef = useRef(null);
  const searchButtonRef = useRef(null);
  const searchPanelRef = useRef(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const isAdminRoute = location.pathname.startsWith("/admin");
  const label = isAdminRoute ? (key) => translate("fr", key) : t;
  const languageButtonText =
    language === "fr" ? t("language.arabic") : t("language.french");
  const languageButtonLabel =
    language === "fr"
      ? t("language.switchToArabic")
      : t("language.switchToFrench");
  const normalizedSearchQuery = normalizeSearchText(searchQuery);
  const searchResults = useMemo(() => {
    if (!normalizedSearchQuery) return [];

    return products.filter((product) =>
      productMatchesSearch(product, normalizedSearchQuery, [
        getLocalizedProductName(product, language),
        getLocalizedProductName(product, "fr"),
        getLocalizedProductName(product, "ar"),
        getProductCategoryLabel(product.category, "fr"),
        getProductCategoryLabel(product.category, "ar"),
        getSearchGenderLabel(product.gender, "fr"),
        getSearchGenderLabel(product.gender, "ar"),
        ...getSearchColorAliases(product.color),
      ])
    );
  }, [language, normalizedSearchQuery, products]);

  useEffect(() => {
    if (isSearchOpen) {
      window.requestAnimationFrame(() => inputRef.current?.focus({ preventScroll: true }));
    }
  }, [isSearchOpen]);

  useEffect(() => {
    setIsMenuOpen(false);
    setIsSearchOpen(false);
    setSearchQuery("");
  }, [location.pathname]);

  useEffect(() => {
    if (!isSearchOpen) return undefined;

    function handlePointerDown(event) {
      const clickedInsidePanel = searchPanelRef.current?.contains(event.target);
      const clickedSearchButton = searchButtonRef.current?.contains(event.target);

      if (!clickedInsidePanel && !clickedSearchButton) {
        closeSearch();
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        closeSearch();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isSearchOpen]);

  function closeSearch() {
    setIsSearchOpen(false);
    setSearchQuery("");
  }

  function toggleSearch() {
    setIsSearchOpen((isOpen) => !isOpen);
    setIsMenuOpen(false);
  }

  function toggleMenu() {
    setIsMenuOpen((isOpen) => !isOpen);
    closeSearch();
  }

  function closeMenu() {
    setIsMenuOpen(false);
  }

  function handleSearchResultClick(product) {
    closeSearch();
    navigate(`/products/${product.id}`);
  }

  return (
    <>
      <header className="site-header">
        <div className="brand">
          <img className="brand-logo" src="/images/logo.png" alt="Clair'Optique" />
          <span>Clair'Optique</span>
        </div>

        <div className="header-actions">
          {!isAdminRoute ? (
            <button
              className="language-switcher language-switcher-desktop"
              type="button"
              aria-label={languageButtonLabel}
              onClick={toggleLanguage}
            >
              {languageButtonText}
            </button>
          ) : null}
          <button
            ref={searchButtonRef}
            className={isSearchOpen ? "search-button active" : "search-button"}
            type="button"
            aria-expanded={isSearchOpen}
            aria-label={label("nav.search")}
            aria-controls="site-search-panel"
            onClick={toggleSearch}
          >
            <svg
              aria-hidden="true"
              fill="none"
              height="22"
              viewBox="0 0 24 24"
              width="22"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="m21 21-4.35-4.35m1.35-5.65a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.4"
              />
            </svg>
          </button>

          <button
            className={isMenuOpen ? "mobile-menu-button active" : "mobile-menu-button"}
            type="button"
            aria-expanded={isMenuOpen}
            aria-label={label("nav.openMenu")}
            aria-controls="mobile-navigation"
            onClick={toggleMenu}
          >
            {"\u2630"}
          </button>
        </div>
      </header>

      <button
        className={isSearchOpen ? "mobile-search-backdrop is-open" : "mobile-search-backdrop"}
        type="button"
        aria-label={label("nav.closeSearch")}
        tabIndex={-1}
        onClick={closeSearch}
      />

      <section
        ref={searchPanelRef}
        className={
          isSearchOpen
            ? "search-panel mobile-search-overlay is-open open"
            : "search-panel mobile-search-overlay"
        }
        id="site-search-panel"
        aria-label={label("nav.searchLabel")}
        aria-hidden={!isSearchOpen}
      >
        <div className="search-panel-inner mobile-search-card">
          <div className="mobile-search-row">
            <div className="search-input-wrap">
              <input
                ref={inputRef}
                id="site-search-input"
                type="search"
                placeholder={label("nav.searchPlaceholder")}
                value={searchQuery}
                tabIndex={isSearchOpen ? 0 : -1}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
              {searchQuery ? (
                <button
                  className="search-clear-button"
                  type="button"
                  aria-label={label("nav.clearSearch")}
                  tabIndex={isSearchOpen ? 0 : -1}
                  onClick={() => {
                    setSearchQuery("");
                    inputRef.current?.focus();
                  }}
                >
                  {"\u00d7"}
                </button>
              ) : null}
            </div>
            <button
              className="search-close-button mobile-search-close"
              type="button"
              aria-label={label("nav.closeSearch")}
              tabIndex={isSearchOpen ? 0 : -1}
              onClick={closeSearch}
            >
              {"\u00d7"}
            </button>
          </div>
          {normalizedSearchQuery ? (
            <div
              className="search-results-panel"
              role="region"
              aria-live="polite"
              aria-label={label("nav.searchResults")}
            >
              {productsStatus === "loading" ? (
                <p className="search-results-state">
                  {label("collections.loading")}
                </p>
              ) : null}

              {productsStatus === "error" ? (
                <p className="search-results-state">
                  {label(productsError || "collections.loadError")}
                </p>
              ) : null}

              {productsStatus === "success" && searchResults.length === 0 ? (
                <p className="search-results-state">
                  {label("nav.noSearchResults")}
                </p>
              ) : null}

              {productsStatus === "success"
                ? searchResults.map((product) => {
                    const productName = getLocalizedProductName(product, language);
                    const imagePath = getProductImagePath(product);
                    const productMeta =
                      product.brand ||
                      getProductCategoryLabel(product.category, language);

                    return (
                      <button
                        className="search-result-item"
                        type="button"
                        key={product.id}
                        onClick={() => handleSearchResultClick(product)}
                      >
                        <img
                          className="search-result-image"
                          src={imagePath || getProductPlaceholder(productName)}
                          alt=""
                          data-image-path={imagePath}
                          onError={(event) =>
                            handleProductImageError(event, productName)
                          }
                        />
                        <span className="search-result-copy">
                          <strong>{productName}</strong>
                          <span>{productMeta}</span>
                        </span>
                        <strong className="search-result-price">
                          {formatPrice(product.price)}
                        </strong>
                      </button>
                    );
                  })
                : null}
            </div>
          ) : (
            <p className="mobile-search-help">{label("nav.searchHelp")}</p>
          )}
        </div>
      </section>

      {isMenuOpen ? (
        <div
          className="mobile-menu-backdrop"
          onClick={closeMenu}
          role="presentation"
        />
      ) : null}

      <nav
        className={isMenuOpen ? "mobile-menu open" : "mobile-menu"}
        id="mobile-navigation"
        aria-label={label("nav.mobileNavigation")}
        aria-hidden={!isMenuOpen}
      >
        <div className="mobile-menu-top">
          <span>{label("nav.menu")}</span>
          <button
            className="mobile-menu-close"
            type="button"
            aria-label={label("nav.closeMenu")}
            tabIndex={isMenuOpen ? 0 : -1}
            onClick={closeMenu}
          >
            {"\u00d7"}
          </button>
        </div>
        {!isAdminRoute ? (
          <button
            className="language-switcher-mobile"
            type="button"
            tabIndex={isMenuOpen ? 0 : -1}
            onClick={toggleLanguage}
          >
            <span className="language-switcher-icon" aria-hidden="true">
              🌐
            </span>

            <span>{languageButtonText}</span>
          </button>
        ) : null}
        <div className="mobile-menu-links">
          <NavLink
            to="/"
            end
            tabIndex={isMenuOpen ? 0 : -1}
            onClick={closeMenu}
          >
            {label("nav.home")}
          </NavLink>
          <NavLink
            to="/products"
            tabIndex={isMenuOpen ? 0 : -1}
            onClick={closeMenu}
          >
            {label("nav.collections")}
          </NavLink>
          <NavLink
            to="/verres"
            tabIndex={isMenuOpen ? 0 : -1}
            onClick={closeMenu}
          >
            {label("nav.lenses")}
          </NavLink>
          <NavLink
            to="/lentilles"
            tabIndex={isMenuOpen ? 0 : -1}
            onClick={closeMenu}
          >
            {label("nav.contactLenses")}
          </NavLink>
          <NavLink
            to="/about"
            tabIndex={isMenuOpen ? 0 : -1}
            onClick={closeMenu}
          >
            {label("nav.about")}
          </NavLink>
          <NavLink
            to="/contact"
            tabIndex={isMenuOpen ? 0 : -1}
            onClick={closeMenu}
          >
            {label("nav.contact")}
          </NavLink>
        </div>
      </nav>

      <nav className="bottom-nav" aria-label={label("nav.mainNavigation")}>
        <NavLink to="/" end>
          {label("nav.home")}
        </NavLink>
        <NavLink to="/products">{label("nav.collections")}</NavLink>
        <NavLink to="/verres">{label("nav.lenses")}</NavLink>
        <NavLink to="/lentilles">{label("nav.contactLenses")}</NavLink>
        <NavLink to="/about">{label("nav.about")}</NavLink>
        <NavLink to="/contact">{label("nav.contact")}</NavLink>
      </nav>
    </>
  );
}

export default Navbar;
