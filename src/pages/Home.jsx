import { useMemo } from "react";
import { Link } from "react-router-dom";
import ProductCard from "../components/ProductCard.jsx";
import { WHATSAPP_NUMBER } from "../config/contact.js";
import { useLanguage } from "../context/LanguageContext.jsx";
import { useProducts } from "../context/ProductsContext.jsx";

const advantageKeys = ["choice", "quality", "speed"];

function Home() {
  const { t } = useLanguage();
  const { products, productsError, productsStatus } = useProducts();
  const featuredProducts = useMemo(() => {
    const popularProducts = products.filter((product) => product.featured === true);

    return popularProducts.length > 0
      ? popularProducts.slice(0, 3)
      : products.slice(0, 3);
  }, [products]);

  const whatsappLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
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
            src="/images/hero-sunglasses.png"
            alt={t("home.heroImageSunglasses")}
            className="hero-product-image"
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
