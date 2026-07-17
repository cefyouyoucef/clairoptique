import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  formatFrameSize,
  getDiscountInfo,
  getProductCategoryLabel,
  getProductImageLabel,
  getProductMeta,
  handleProductImageError,
} from "../components/ProductCard.jsx";
import {
  formatPrice,
  getProductImagePath,
} from "../utils/productPresentation.js";
import OrderModal from "../components/OrderModal.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import useProductWhatsAppShare from "../hooks/useProductWhatsAppShare.js";
import {
  getLocalizedProductDescription,
  getLocalizedProductName,
} from "../i18n/translations.js";
import { getProductById } from "../utils/productStorage.js";

function getProductGalleryImages(product) {
  if (!product) return [];

  const images = Array.isArray(product.images) ? product.images : [];
  const galleryImages = [
    ...images,
    product.imageUrl,
    product.image,
    product.image_url,
  ]
    .map((image) => String(image || "").trim())
    .filter(Boolean);

  return Array.from(new Set(galleryImages));
}

function ProductDetails() {
  const { language, t } = useLanguage();
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [productStatus, setProductStatus] = useState("loading");
  const [productError, setProductError] = useState("");
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isOrderOpen, setIsOrderOpen] = useState(false);
  const { handleProductWhatsAppShare, isPreparingShare } =
    useProductWhatsAppShare(product, language, "order.whatsappMessage");

  useEffect(() => {
    let isActive = true;

    async function refreshProduct() {
      try {
        setProductStatus("loading");
        setIsOrderOpen(false);
        setActiveImageIndex(0);
        const nextProduct = await getProductById(id);
        if (!isActive) return;
        setProduct(nextProduct);
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
  const activeImage =
    productImages[activeImageIndex] ||
    productImages[0] ||
    getProductImagePath(product);
  const { oldPrice, hasDiscount, discountPercent } = getDiscountInfo(product);

  function handlePreviousImage() {
    setActiveImageIndex((index) =>
      index === 0 ? productImages.length - 1 : index - 1
    );
  }

  function handleNextImage() {
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
          <div className="product-detail-gallery">
            <div className="product-detail-main-image">
              <img
                src="/images/logo.png"
                alt="Clair'Optique"
                className="product-logo-badge"
              />
              <img
                src={activeImage}
                alt={productImageLabel}
                className="product-detail-image"
                data-image-path={activeImage}
                onError={(event) =>
                  handleProductImageError(event, productImageLabel)
                }
              />

              {productImages.length > 1 ? (
                <>
                  <button
                    type="button"
                    className="product-gallery-arrow product-gallery-arrow-prev"
                    aria-label={t("product.previousImage")}
                    onClick={handlePreviousImage}
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    className="product-gallery-arrow product-gallery-arrow-next"
                    aria-label={t("product.nextImage")}
                    onClick={handleNextImage}
                  >
                    ›
                  </button>
                  <span className="product-gallery-counter">
                    {activeImageIndex + 1} / {productImages.length}
                  </span>
                </>
              ) : null}
            </div>

            {productImages.length > 1 ? (
              <div
                className="product-gallery-thumbnails"
                aria-label={t("product.images")}
              >
                {productImages.map((imagePath, index) => (
                  <button
                    type="button"
                    className={`product-gallery-thumbnail ${
                      index === activeImageIndex ? "active" : ""
                    }`}
                    key={`${imagePath}-${index}`}
                    aria-label={t("product.viewImage", { number: index + 1 })}
                    aria-pressed={index === activeImageIndex}
                    onClick={() => setActiveImageIndex(index)}
                  >
                    <img src={imagePath} alt="" />
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
                disabled={!product.stock}
                onClick={() => setIsOrderOpen(true)}
              >
                {product.stock ? t("order.buyNow") : t("product.outOfStock")}
              </button>
              <button
                className="btn btn-secondary"
                type="button"
                disabled={isPreparingShare}
                aria-busy={isPreparingShare}
                onClick={async (event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  await handleProductWhatsAppShare();
                }}
              >
                {isPreparingShare
                  ? t("whatsapp.preparing")
                  : t("order.whatsappSecondary")}
              </button>
            </div>
          </div>
        </div>
      </div>
      <OrderModal
        isOpen={isOrderOpen}
        product={product}
        onClose={() => setIsOrderOpen(false)}
      />
    </section>
  );
}

export default ProductDetails;
