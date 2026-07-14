import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ProductCard, {
  handleProductImageError,
} from "../components/ProductCard.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import { getProducts } from "../utils/productStorage.js";

const advantageKeys = ["choice", "quality", "speed"];

function Home() {
  const { t } = useLanguage();
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [productsStatus, setProductsStatus] = useState("loading");
  const [productsError, setProductsError] = useState("");

  useEffect(() => {
    let isActive = true;

    async function loadProducts() {
      try {
        setProductsStatus("loading");
        const nextProducts = await getProducts();
        if (!isActive) return;

        const popularProducts = nextProducts.filter((product) => product.featured === true);
        const homeProducts =
          popularProducts.length > 0 ? popularProducts.slice(0, 3) : nextProducts.slice(0, 3);

        setFeaturedProducts(homeProducts);
        setProductsStatus("success");
      } catch {
        if (!isActive) return;
        setProductsError("collections.loadError");
        setProductsStatus("error");
      }
    }

    loadProducts();
    window.addEventListener("storage", loadProducts);
    window.addEventListener("clairoptique-products-changed", loadProducts);

    return () => {
      isActive = false;
      window.removeEventListener("storage", loadProducts);
      window.removeEventListener("clairoptique-products-changed", loadProducts);
    };
  }, []);

  const whatsappLink = `https://wa.me/213559925559?text=${encodeURIComponent(
    t("home.whatsappMessage")
  )}`;

  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">Clair'Optique</p>
            <h1>
              {t("home.heroTitle")}
              <br />
              {t("home.heroBrandLine")}
            </h1>
            <p className="hero-subtitle">{t("home.heroSubtitle")}</p>
            <div className="hero-actions">
              <Link className="btn btn-primary hero-button" to="/products">
                {t("home.discoverCollections")}
              </Link>
              <a
                className="btn btn-secondary hero-button hero-whatsapp-button"
                href={whatsappLink}
                target="_blank"
                rel="noreferrer"
              >
                {t("home.contactWhatsApp")}
              </a>
            </div>
          </div>

          <div className="hero-visual">
            <img
              src="/images/products/lunette-optique-noire.jpg"
              alt={t("home.heroImageOptical")}
              className="hero-product hero-product-main"
              onError={(event) =>
                handleProductImageError(event, t("home.heroImageOptical"))
              }
            />
            <img
              src="/images/products/lunette-soleil-femme.jpg"
              alt={t("home.heroImageSunglasses")}
              className="hero-product hero-product-small"
              onError={(event) =>
                handleProductImageError(event, t("home.heroImageSunglasses"))
              }
            />
          </div>

          <div className="hero-actions hero-actions-mobile">
            <Link className="btn btn-primary hero-button" to="/products">
              {t("home.discoverCollections")}
            </Link>
            <a
              className="btn btn-secondary hero-button hero-whatsapp-button"
              href={whatsappLink}
              target="_blank"
              rel="noreferrer"
            >
              {t("home.contactWhatsApp")}
            </a>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-heading">
            <p className="eyebrow">{t("home.whyEyebrow")}</p>
            <h2>{t("home.whyTitle")}</h2>
          </div>

          <div className="advantages-grid">
            {advantageKeys.map((advantageKey) => (
              <article className="advantage-card" key={advantageKey}>
                <span className="advantage-label" aria-hidden="true">
                  {t(`home.advantage.${advantageKey}.label`)}
                </span>
                <h3>{t(`home.advantage.${advantageKey}.title`)}</h3>
                <p>{t(`home.advantage.${advantageKey}.text`)}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section featured-section">
        <div className="container">
          <div className="section-heading featured-heading">
            <p className="eyebrow">{t("home.featuredEyebrow")}</p>
            <h2>{t("home.featuredTitle")}</h2>
            <p>{t("home.featuredSubtitle")}</p>
          </div>

          <div className="featured-link-row">
            <Link className="btn btn-secondary" to="/products">
              {t("home.viewAll")}
            </Link>
          </div>

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

          {productsStatus === "success" && featuredProducts.length > 0 ? (
            <div className="products-grid">
              {featuredProducts.map((product) => (
                <ProductCard product={product} key={product.id} />
              ))}
            </div>
          ) : null}

          {productsStatus === "success" && featuredProducts.length === 0 ? (
            <div className="empty-state">
              <h2>{t("collections.empty")}</h2>
            </div>
          ) : null}
        </div>
      </section>
    </>
  );
}

export default Home;
