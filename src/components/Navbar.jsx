import { useEffect, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext.jsx";
import { translate } from "../i18n/translations.js";

function Navbar() {
  const location = useLocation();
  const { language, t, toggleLanguage } = useLanguage();
  const inputRef = useRef(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const isAdminRoute = location.pathname.startsWith("/admin");
  const label = isAdminRoute ? (key) => translate("fr", key) : t;
  const languageButtonText =
    language === "fr" ? t("language.arabic") : t("language.french");
  const languageButtonLabel =
    language === "fr"
      ? t("language.switchToArabic")
      : t("language.switchToFrench");

  useEffect(() => {
    if (isSearchOpen) {
      window.requestAnimationFrame(() => inputRef.current?.focus({ preventScroll: true }));
    }
  }, [isSearchOpen]);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  function closeSearch() {
    setIsSearchOpen(false);
    setSearchTerm("");
  }

  function toggleSearch() {
    setIsSearchOpen((isOpen) => !isOpen);
    setIsMenuOpen(false);
  }

  function toggleMenu() {
    setIsMenuOpen((isOpen) => !isOpen);
    closeSearch();
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
            <input
              ref={inputRef}
              id="site-search-input"
              type="search"
              placeholder={label("nav.searchPlaceholder")}
              value={searchTerm}
              tabIndex={isSearchOpen ? 0 : -1}
              onChange={(event) => setSearchTerm(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Escape") closeSearch();
              }}
            />
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
          <p className="mobile-search-help">{label("nav.searchHelp")}</p>
        </div>
      </section>

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
            onClick={() => setIsMenuOpen(false)}
          >
            {"\u00d7"}
          </button>
        </div>
        {!isAdminRoute ? (
          <button
            className="language-switcher language-switcher-mobile"
            type="button"
            aria-label={languageButtonLabel}
            tabIndex={isMenuOpen ? 0 : -1}
            onClick={toggleLanguage}
          >
            {languageButtonText}
          </button>
        ) : null}
        <div className="mobile-menu-links">
          <NavLink to="/" end tabIndex={isMenuOpen ? 0 : -1}>
            {label("nav.home")}
          </NavLink>
          <NavLink to="/products" tabIndex={isMenuOpen ? 0 : -1}>
            {label("nav.collections")}
          </NavLink>
          <NavLink to="/verres" tabIndex={isMenuOpen ? 0 : -1}>
            {label("nav.lenses")}
          </NavLink>
          <NavLink to="/lentilles" tabIndex={isMenuOpen ? 0 : -1}>
            {label("nav.contactLenses")}
          </NavLink>
          <NavLink to="/about" tabIndex={isMenuOpen ? 0 : -1}>
            {label("nav.about")}
          </NavLink>
          <NavLink to="/contact" tabIndex={isMenuOpen ? 0 : -1}>
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
