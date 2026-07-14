import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  formatFrameSize,
  formatPrice,
  getDiscountInfo,
  getProductCategoryLabel,
  getProductImageLabel,
  getProductImagePath,
  getProductMeta,
  handleProductImageError,
  handleSharePhoto,
} from "../components/ProductCard.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import {
  getLocalizedProductDescription,
  getLocalizedProductName,
} from "../i18n/translations.js";
import { getProductById } from "../utils/productStorage.js";

function getProductGalleryImages(product) {
  if (!product) return [];

  const images = Array.isArray(product.images)
    ? product.images.filter(Boolean)
    : [];

  const fallbackImage = getProductImagePath(product);

  const galleryImages =
    images.length > 0
      ? images
      : fallbackImage
        ? [fallbackImage]
        : [];

  return Array.from(new Set(galleryImages));
}

function ProductDetails() {
  const { language, t } = useLanguage();
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [productStatus, setProductStatus] = useState("loading");
  const [productError, setProductError] = useState("");
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    let isActive = true;

    async function refreshProduct() {
      try {
        setProductStatus("loading");
        const nextProduct = await getProductById(id);
        if (!isActive) return;
        setProduct(nextProduct);
        setActiveImageIndex(0);
        setProductStatus(nextProduct ? "success" : "empty");
      } catch {
        if (!isActive) return;
        setProductError("product.loadError");
        setProductStatus("error");
      }
    }

    refreshProduct();
    window.addEventListener("storage", refreshProduct);
    window.addEventListener("clairoptique-products-changed", refreshProduct);

    return () => {
      isActive = false;
      window.removeEventListener("storage", refreshProduct);
      window.removeEventListener("clairoptique-products-changed", refreshProduct);
    };
  }, [id]);

  if (productStatus === "loading") {
    return (
      <section className="section page-section details-page">
        <div className="container empty-state">
          <p>{t("product.loading")}</p>
        </div>
      </section>
    );
  }

  if (productStatus === "error") {
    return (
      <section className="section page-section details-page">
        <div className="container empty-state">
          <h1>{t("common.error")}</h1>
          <p>{t(productError)}</p>
          <Link className="btn btn-primary" to="/products">
            {t("product.backToCollections")}
          </Link>
        </div>
      </section>
    );
  }

  if (!product) {
    return (
      <section className="section page-section details-page">
        <div className="container empty-state">
          <h1>{t("product.notFound")}</h1>
          <p>{t("product.notAvailable")}</p>
          <Link className="btn btn-primary" to="/products">
            {t("product.backToCollections")}
          </Link>
        </div>
      </section>
    );
  }

  const displayedName = getLocalizedProductName(product, language);
  const displayedDescription = getLocalizedProductDescription(product, language);
  const productImageLabel = getProductImageLabel(product, language);
  const productImages = getProductGalleryImages(product);
  const mainImagePath = productImages[activeImageIndex] || getProductImagePath(product);
  const { oldPrice, hasDiscount, discountPercent } = getDiscountInfo(product);

  function showPreviousImage() {
    setActiveImageIndex((index) =>
      index === 0 ? productImages.length - 1 : index - 1
    );
  }

  function showNextImage() {
    setActiveImageIndex((index) =>
      index === productImages.length - 1 ? 0 : index + 1
    );
  }

  return (
    <section className="section page-section details-page">
      <div className="container">
        <div className="details-nav" aria-label={t("product.navigation")}>
          <Link
            className="details-back-button"
            to="/products"
            aria-label={t("product.back")}
          >
            {t("common.backArrow")}
          </Link>
        </div>

        <div className="details-grid">
          <div className="details-gallery product-detail-gallery">
            <div className="details-image-wrap product-detail-image-wrap">
              <img
                src="/images/logo.png"
                alt="Clair'Optique"
                className="product-logo-badge"
              />
              <img
                src={mainImagePath}
                alt={productImageLabel}
                className="details-image"
                data-image-path={mainImagePath}
                onError={(event) => handleProductImageError(event, productImageLabel)}
              />

              {productImages.length > 1 ? (
                <>
                  <button
                    className="product-gallery-arrow left"
                    type="button"
                    aria-label={t("product.previousPhoto")}
                    onClick={showPreviousImage}
                  >
                    {t("common.previousArrow")}
                  </button>
                  <button
                    className="product-gallery-arrow right"
                    type="button"
                    aria-label={t("product.nextPhoto")}
                    onClick={showNextImage}
                  >
                    {t("common.nextArrow")}
                  </button>
                </>
              ) : null}
            </div>

            {productImages.length > 1 ? (
              <div
                className="details-thumbnails product-detail-thumbnails"
                aria-label={t("product.photos")}
              >
                {productImages.map((imagePath, index) => (
                  <button
                    key={imagePath}
                    className={`details-thumbnail product-detail-thumbnail ${
                      index === activeImageIndex ? "is-active" : ""
                    }`}
                    type="button"
                    onClick={() => setActiveImageIndex(index)}
                    aria-label={t("product.viewPhoto", { number: index + 1 })}
                  >
                    <img
                      src={imagePath}
                      alt={`${productImageLabel} ${index + 1}`}
                      data-image-path={imagePath}
                      onError={(event) => handleProductImageError(event, productImageLabel)}
                    />
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="details-content">
            <p className="eyebrow">
              {getProductMeta(product, language)}
            </p>
            <h1>{displayedName}</h1>
            <p className="details-frame-size">
              {t("product.size")} : {formatFrameSize(product.frameSize, language)}
            </p>
            <div className="product-price-group details-price-group">
              {hasDiscount ? (
                <span className="product-old-price">{formatPrice(oldPrice)}</span>
              ) : null}
              <strong className="details-price product-price">
                {formatPrice(product.price)}
              </strong>
              {hasDiscount ? (
                <span className="product-discount-badge">-{discountPercent}%</span>
              ) : null}
            </div>
            <p className="details-description">{displayedDescription}</p>

            <dl className="details-list">
              <div>
                <dt>{t("product.brand")}</dt>
                <dd>{product.brand}</dd>
              </div>
              <div>
                <dt>{t("product.category")}</dt>
                <dd>
                  {product.category === "Optiques"
                    ? displayedName
                    : getProductCategoryLabel(product.category, language)}
                </dd>
              </div>
              <div>
                <dt>{t("product.color")}</dt>
                <dd>{product.color}</dd>
              </div>
              <div>
                <dt>{t("product.frameSize")}</dt>
                <dd>{product.frameSize || t("product.unspecified")}</dd>
              </div>
              <div>
                <dt>{t("product.availability")}</dt>
                <dd className={product.stock ? "stock-in" : "stock-out"}>
                  {product.stock ? t("product.inStock") : t("product.outOfStock")}
                </dd>
              </div>
            </dl>

            <div className="details-actions">
              <button
                className="btn btn-primary"
                type="button"
                onClick={() => handleSharePhoto(product, language)}
              >
                {t("product.orderNowWhatsApp")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ProductDetails;
