import { useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import ProductCard from "../components/ProductCard.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import { useProducts } from "../context/ProductsContext.jsx";

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

    if (selectedFilter === "tous") {
      return products;
    }

    return products.filter((product) => {
      const productCategory = normalizeValue(product.category);
      const productGender = normalizeValue(product.gender);

      return productCategory === selectedFilter || productGender === selectedFilter;
    });
  }, [activeFilter, products]);

  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
  const safeTotalPages = Math.max(totalPages, 1);
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

  function scrollToProducts() {
    window.requestAnimationFrame(() => {
      productsSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
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
    scrollToProducts();
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

        <div className="products-results" ref={productsSectionRef}>
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
              <div className="products-grid">
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
                    disabled={currentPage === 1}
                    onClick={() => handlePageChange(currentPage - 1)}
                  >
                    {t("collections.previous")}
                  </button>

                  {Array.from({ length: totalPages }, (_, index) => {
                    const pageNumber = index + 1;

                    return (
                      <button
                        className={
                          pageNumber === currentPage
                            ? "pagination-button active"
                            : "pagination-button"
                        }
                        key={pageNumber}
                        type="button"
                        aria-current={pageNumber === currentPage ? "page" : undefined}
                        onClick={() => handlePageChange(pageNumber)}
                      >
                        {pageNumber}
                      </button>
                    );
                  })}

                  <button
                    className="pagination-button pagination-nav"
                    type="button"
                    disabled={currentPage === totalPages}
                    onClick={() => handlePageChange(currentPage + 1)}
                  >
                    {t("collections.next")}
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
