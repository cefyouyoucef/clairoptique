import { useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import ProductCard from "../components/ProductCard.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import { useProducts } from "../context/ProductsContext.jsx";
import { prioritizePromotedProducts } from "../utils/productPromotion.js";

const filters = [
  "Tous",
  "Optiques",
  "Solaires",
  "Verres",
  "Lentilles",
  "Homme",
  "Femme",
];
const PRODUCTS_PER_PAGE = 5;
const filterTranslationKeys = {
  Tous: "collections.filters.all",
  Optiques: "collections.filters.optical",
  Solaires: "collections.filters.sunglasses",
  Verres: "collections.filters.lenses",
  Lentilles: "collections.filters.contactLenses",
  Homme: "collections.filters.men",
  Femme: "collections.filters.women",
};

function normalizeValue(value) {
  return String(value || "").trim().toLowerCase();
}

function getFilterFromSearchParams(searchParams) {
  const requestedFilter = normalizeValue(searchParams.get("category"));

  return (
    filters.find((filter) => normalizeValue(filter) === requestedFilter) ||
    "Tous"
  );
}

function getPageFromSearchParams(searchParams) {
  const requestedPage = Number.parseInt(searchParams.get("page"), 10);

  return Number.isInteger(requestedPage) && requestedPage > 0
    ? requestedPage
    : 1;
}

function Products() {
  const { t } = useLanguage();
  const { products, productsError, productsStatus } = useProducts();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeFilter = getFilterFromSearchParams(searchParams);
  const currentPage = getPageFromSearchParams(searchParams);
  const productsSectionRef = useRef(null);

  const filteredProducts = useMemo(() => {
    const selectedFilter = normalizeValue(activeFilter);
    const matchingProducts =
      selectedFilter === "tous"
        ? products
        : products.filter((product) => {
            const productCategory = normalizeValue(product.category);
            const productGender = normalizeValue(product.gender);

            return (
              productCategory === selectedFilter ||
              productGender === selectedFilter
            );
          });

    return prioritizePromotedProducts(matchingProducts);
  }, [activeFilter, products]);

  const totalPages = Math.ceil(
    filteredProducts.length / PRODUCTS_PER_PAGE
  );
  const safeTotalPages = Math.max(totalPages, 1);
  const visiblePages =
    currentPage <= 3
      ? Array.from(
          { length: Math.min(3, totalPages) },
          (_, index) => index + 1
        )
      : [currentPage];
  const pageStartIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;

  const paginatedProducts = filteredProducts.slice(
    pageStartIndex,
    pageStartIndex + PRODUCTS_PER_PAGE
  );

  useEffect(() => {
    if (
      productsStatus === "success" &&
      currentPage > safeTotalPages
    ) {
      const nextSearchParams = new URLSearchParams(searchParams);

      if (safeTotalPages === 1) {
        nextSearchParams.delete("page");
      } else {
        nextSearchParams.set("page", String(safeTotalPages));
      }

      setSearchParams(nextSearchParams, { replace: true });
    }
  }, [
    currentPage,
    productsStatus,
    safeTotalPages,
    searchParams,
    setSearchParams,
  ]);

  function handleFilterChange(filter) {
    const nextSearchParams = new URLSearchParams(searchParams);

    if (filter === "Tous") {
      nextSearchParams.delete("category");
    } else {
      nextSearchParams.set("category", normalizeValue(filter));
    }

    nextSearchParams.delete("page");
    setSearchParams(nextSearchParams);
  }

  function scrollToProductsTop() {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        const element = productsSectionRef.current;

        if (!element) return;

        const headerOffset = 90;

        const targetTop =
          element.getBoundingClientRect().top +
          window.scrollY -
          headerOffset;

        window.scrollTo({
          top: Math.max(0, targetTop),
          left: 0,
          behavior: "auto",
        });
      });
    });
  }

  function handlePageChange(nextPage) {
    if (
      nextPage < 1 ||
      nextPage > safeTotalPages ||
      nextPage === currentPage
    ) {
      return;
    }

    const nextSearchParams = new URLSearchParams(searchParams);

    if (nextPage === 1) {
      nextSearchParams.delete("page");
    } else {
      nextSearchParams.set("page", String(nextPage));
    }

    setSearchParams(nextSearchParams);
    scrollToProductsTop();
  }

  return (
    <section className="section page-section">
      <div className="container">
        <div className="page-heading">
          <p className="eyebrow">{t("collections.eyebrow")}</p>
          <h1>{t("collections.title")}</h1>
          <p className="filter-intro">
            {t("collections.intro")}
          </p>
        </div>

        <div className="filter-row" aria-label={t("collections.filtersLabel")}>
          {filters.map((filter) => (
            <button
              className={filter === activeFilter ? "filter active" : "filter"}
              key={filter}
              type="button"
              onClick={() => handleFilterChange(filter)}
            >
              {t(filterTranslationKeys[filter])}
            </button>
          ))}
        </div>

        <div className="products-results">
          {productsStatus === "loading" ? (
            <div className="empty-state">
              <p>{t("collections.loading")}</p>
            </div>
          ) : null}

          {productsStatus === "error" ? (
            <div className="empty-state">
              <h2>{t("common.error")}</h2>
              <p>{t(productsError)}</p>
            </div>
          ) : null}

          {productsStatus === "success" && filteredProducts.length > 0 ? (
            <>
              <div className="products-grid" ref={productsSectionRef}>
                {paginatedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {productsStatus === "success" && totalPages > 1 ? (
                <nav
                  className="products-pagination"
                  aria-label={t("collections.paginationLabel")}
                >
                  <button
                    className="pagination-button pagination-nav"
                    type="button"
                    aria-label="Page précédente"
                    disabled={currentPage === 1}
                    onClick={() => handlePageChange(currentPage - 1)}
                  >
                    ‹
                  </button>

                  {visiblePages.map((pageNumber) => (
                    <button
                      className={
                        pageNumber === currentPage
                          ? "pagination-button active"
                          : "pagination-button"
                      }
                      key={pageNumber}
                      type="button"
                      aria-current={
                        pageNumber === currentPage ? "page" : undefined
                      }
                      onClick={() => handlePageChange(pageNumber)}
                    >
                      {pageNumber}
                    </button>
                  ))}

                  <button
                    className="pagination-button pagination-nav"
                    type="button"
                    aria-label="Page suivante"
                    disabled={currentPage === safeTotalPages}
                    onClick={() => handlePageChange(currentPage + 1)}
                  >
                    ›
                  </button>
                </nav>
              ) : null}
            </>
          ) : null}

          {productsStatus === "success" && filteredProducts.length === 0 ? (
            <div className="empty-state">
              <h2>{t("collections.empty")}</h2>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export default Products;
