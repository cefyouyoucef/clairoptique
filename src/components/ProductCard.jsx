import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import OrderModal from "./OrderModal.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import useProductWhatsAppShare from "../hooks/useProductWhatsAppShare.js";
import {
  getLocalizedProductName,
  translate,
} from "../i18n/translations.js";
import { formatPrice, getProductImages } from "../utils/productPresentation.js";

function getProductPlaceholder(productName) {
  const safeProductName = String(productName || "Produit").replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&apos;",
      })[character]
  );
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="900" height="600" viewBox="0 0 900 600">
      <rect width="900" height="600" fill="#f6f7f9"/>
      <rect x="84" y="84" width="732" height="432" rx="28" fill="#ffffff" stroke="#e6e9ee" stroke-width="4"/>
      <path d="M210 306c32-70 148-68 184-8 19 32 14 83-20 108-45 34-132 22-158-32-10-22-12-47-6-68Z" fill="none" stroke="#111318" stroke-width="26" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M506 298c36-60 152-62 184 8 6 21 4 46-6 68-26 54-113 66-158 32-34-25-39-76-20-108Z" fill="none" stroke="#111318" stroke-width="26" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M392 320c32-22 84-22 116 0" fill="none" stroke="#111318" stroke-width="22" stroke-linecap="round"/>
      <text x="450" y="505" text-anchor="middle" fill="#111318" font-family="Arial, sans-serif" font-size="30" font-weight="700" textLength="640" lengthAdjust="spacingAndGlyphs">${safeProductName}</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function handleProductImageError(event, productName) {
  const imagePath = event.currentTarget.dataset.imagePath || event.currentTarget.currentSrc || event.currentTarget.src;

  if (!event.currentTarget.src.startsWith("data:image/svg+xml")) {
    console.log("Image failed:", imagePath);
    event.currentTarget.src = getProductPlaceholder(productName);
  }
}

function getDiscountInfo(product) {
  const oldPrice = Number(product.oldPrice ?? product.old_price ?? 0);
  const currentPrice = Number(product.price || 0);
  const hasDiscount = oldPrice > 0 && currentPrice > 0 && oldPrice > currentPrice;
  const discountPercent = hasDiscount
    ? Math.round(((oldPrice - currentPrice) / oldPrice) * 100)
    : 0;

  return {
    oldPrice,
    hasDiscount,
    discountPercent,
  };
}

function formatFrameSize(frameSize, language = "fr") {
  const value = String(frameSize || "");

  if (!value || value === "Non spécifiée" || value.includes("spÃ")) {
    return translate(language, "product.unspecified");
  }

  const match = value.match(/^([SML])\s*\/\s*(\d+)-(\d+)-(\d+)$/);

  if (!match) {
    return value;
  }

  const [, size, lensWidth, bridgeWidth, templeLength] = match;
  return `${size} — ${lensWidth}□${bridgeWidth} - ${templeLength} mm`;
}

function getProductImageLabel(product, language = "fr") {
  if (Number(product.id) === 1) {
    return translate(language, "product.defaultImageLabel");
  }

  return getLocalizedProductName(product, language);
}

function loadCollageImage(imagePath) {
  return new Promise((resolve) => {
    const image = new Image();

    if (/^https?:\/\//i.test(imagePath)) {
      image.crossOrigin = "anonymous";
    }

    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = imagePath;
  });
}

function drawContainedImage(context, image, x, y, width, height) {
  const padding = 24;
  const availableWidth = width - padding * 2;
  const availableHeight = height - padding * 2;
  const scale = Math.min(
    availableWidth / image.naturalWidth,
    availableHeight / image.naturalHeight
  );
  const renderedWidth = image.naturalWidth * scale;
  const renderedHeight = image.naturalHeight * scale;

  context.drawImage(
    image,
    x + (width - renderedWidth) / 2,
    y + (height - renderedHeight) / 2,
    renderedWidth,
    renderedHeight
  );
}

async function createProductCollage(collageImages) {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) return null;

  canvas.width = 1200;
  canvas.height = 900;
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);

  const loadedImages = await Promise.all(
    collageImages.map((imagePath) => loadCollageImage(imagePath))
  );
  const cellWidth = canvas.width / 2;
  const cellHeight = canvas.height / 2;

  loadedImages.forEach((image, index) => {
    if (!image) return;

    const column = index % 2;
    const row = Math.floor(index / 2);
    drawContainedImage(
      context,
      image,
      column * cellWidth,
      row * cellHeight,
      cellWidth,
      cellHeight
    );
  });

  context.strokeStyle = "#e5e7eb";
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(cellWidth, 0);
  context.lineTo(cellWidth, canvas.height);
  context.moveTo(0, cellHeight);
  context.lineTo(canvas.width, cellHeight);
  context.stroke();

  return new Promise((resolve) => {
    try {
      canvas.toBlob(resolve, "image/jpeg", 0.92);
    } catch (error) {
      console.error("Product collage generation failed:", error);
      resolve(null);
    }
  });
}

function useProductCollage(collageImages) {
  const [collageUrl, setCollageUrl] = useState("");

  useEffect(() => {
    let cancelled = false;
    let objectUrl = "";

    setCollageUrl("");

    if (collageImages.length > 0) {
      createProductCollage(collageImages)
        .then((blob) => {
          if (!blob) return;

          objectUrl = URL.createObjectURL(blob);

          if (cancelled) {
            URL.revokeObjectURL(objectUrl);
            return;
          }

          setCollageUrl(objectUrl);
        })
        .catch((error) => {
          console.error("Product collage generation failed:", error);
        });
    }

    return () => {
      cancelled = true;

      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [collageImages]);

  return collageUrl;
}

function getProductCategoryLabel(category, language = "fr") {
  const normalizedCategory = String(category || "").trim().toLowerCase();

  if (normalizedCategory === "solaires") {
    return translate(language, "product.category.sunglasses");
  }
  if (normalizedCategory === "optiques") {
    return translate(language, "product.category.optical");
  }
  if (normalizedCategory === "verres") {
    return translate(language, "product.category.lenses");
  }
  if (normalizedCategory === "lentilles") {
    return translate(language, "product.category.contactLenses");
  }
  return String(category || "").toUpperCase();
}

function getProductGenderLabel(gender, language = "fr") {
  const genderKeys = {
    Homme: "product.gender.men",
    Femme: "product.gender.women",
    Enfant: "product.gender.children",
    Tous: "product.gender.all",
  };

  const key = genderKeys[gender];
  return key ? translate(language, key) : String(gender || "").toUpperCase();
}

function getProductMeta(product, language = "fr") {
  return `${getProductCategoryLabel(product.category, language)} / ${getProductGenderLabel(product.gender, language)}`;
}

function ProductCard({ product }) {
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const detailsPath = `/products/${product.id}`;
  const displayedName = getLocalizedProductName(product, language);
  const imageLabel = getProductImageLabel(product, language);
  const collageImages = useMemo(
    () => getProductImages(product).slice(0, 4),
    [product]
  );
  const collageUrl = useProductCollage(collageImages);
  const { oldPrice, hasDiscount, discountPercent } = getDiscountInfo(product);
  const { handleProductWhatsAppShare, isPreparingShare } =
    useProductWhatsAppShare(product, language);

  function openDetails() {
    navigate(detailsPath);
  }

  function handleCardKeyDown(event) {
    if (event.target !== event.currentTarget) return;

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openDetails();
    }
  }

  return (
    <>
      <article
        className="product-card"
        role="link"
        tabIndex={0}
        onClick={openDetails}
        onKeyDown={handleCardKeyDown}
        aria-label={displayedName}
      >
        <div className="product-image-link">
          <img
            src="/images/logo.png"
            alt="Clair'Optique"
            className="product-logo-badge"
          />
          <img
            src={collageUrl || getProductPlaceholder(imageLabel)}
            alt={imageLabel}
            className="product-collage-preview"
          />
        </div>

        <div className="product-card-body">
          <div>
            <p className="eyebrow">{getProductMeta(product, language)}</p>
            <h3>{displayedName}</h3>
            <p className="product-brand">
              {t("product.brand")} : {product.brand}
            </p>
            <p className="product-frame-size">
              {t("product.size")} : {formatFrameSize(product.frameSize, language)}
            </p>
            <div className="product-price-group">
              {hasDiscount ? (
                <span className="product-old-price">{formatPrice(oldPrice)}</span>
              ) : null}
              <strong className="product-price">
                {formatPrice(product.price)}
              </strong>
              {hasDiscount ? (
                <span className="product-discount-badge">
                  -{discountPercent}%
                </span>
              ) : null}
            </div>
            <span
              className={`product-stock-badge ${product.stock ? "in-stock" : "out-stock"}`}
            >
              {product.stock ? t("product.inStock") : t("product.outOfStock")}
            </span>
          </div>

          <div className="card-actions">
            <Link
              className="btn btn-secondary"
              to={detailsPath}
              onClick={(event) => event.stopPropagation()}
            >
              {t("product.viewDetails")}
            </Link>
            <button
              className="btn btn-primary"
              type="button"
              disabled={!product.stock}
              onClick={(event) => {
                event.stopPropagation();
                setIsOrderModalOpen(true);
              }}
            >
              {t("order.buyNow")}
            </button>
            <button
              className="btn btn-secondary"
              type="button"
              disabled={!product.stock || isPreparingShare}
              aria-busy={isPreparingShare}
              onClick={async (event) => {
                event.stopPropagation();
                await handleProductWhatsAppShare();
              }}
            >
              {isPreparingShare ? (
                t("whatsapp.preparing")
              ) : (
                <>
                  <span className="order-text-desktop">
                    {t("product.orderWhatsApp")}
                  </span>
                  <span className="order-text-mobile">
                    {t("product.order")}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </article>

      <OrderModal
        product={product}
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
      />
    </>
  );
}

export {
  formatFrameSize,
  getDiscountInfo,
  getProductCategoryLabel,
  getProductImageLabel,
  getProductMeta,
  getProductPlaceholder,
  handleProductImageError,
};
export default ProductCard;
