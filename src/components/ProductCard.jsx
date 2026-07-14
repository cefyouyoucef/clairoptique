import { Link, useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext.jsx";
import {
  getLocalizedProductName,
  translate,
} from "../i18n/translations.js";

const WHATSAPP_NUMBER = "213553924630";

function getFullImageUrl(imagePath) {
  if (!imagePath || imagePath.startsWith("data:")) return "";
  if (/^https?:\/\//i.test(imagePath)) return imagePath;
  if (imagePath.startsWith("/")) return `${window.location.origin}${imagePath}`;
  return `${window.location.origin}/${imagePath}`;
}

function getWhatsAppOrderUrl(product, language = "fr") {
  const imagePath = getProductImagePath(product);
  const imageUrl = getFullImageUrl(imagePath);
  const displayedName = getLocalizedProductName(product, language);
  const messageParts = [
    translate(language, "whatsapp.orderIntro"),
    `${translate(language, "whatsapp.name")}: ${displayedName}`,
    `${translate(language, "whatsapp.price")}: ${product.price} DA`,
    `${translate(language, "whatsapp.category")}: ${getProductMeta(product, language)}`,
  ];

  if (imageUrl) {
    messageParts.push(`${translate(language, "whatsapp.image")}: ${imageUrl}`);
  }

  const message = encodeURIComponent(messageParts.join("\n"));
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;
}

function openWhatsAppOrder(product, language = "fr") {
  window.open(
    getWhatsAppOrderUrl(product, language),
    "_blank",
    "noopener,noreferrer"
  );
}

async function handleSharePhoto(product, language = "fr") {
  const imagePath = getProductImagePath(product);
  const displayedName = getLocalizedProductName(product, language);

  if (window.location.protocol !== "https:") {
    openWhatsAppOrder(product, language);
    return;
  }

  try {
    const response = await fetch(imagePath);
    const blob = await response.blob();

    const fileName = imagePath.split("/").pop() || "produit.jpg";
    const file = new File([blob], fileName, {
      type: blob.type || "image/jpeg",
    });

    const canShareFile =
      navigator.canShare &&
      navigator.canShare({ files: [file] });

    if (navigator.share && canShareFile) {
      await navigator.share({
        files: [file],
        title: displayedName,
        text: `${translate(language, "whatsapp.orderIntro")} ${displayedName}`,
      });
      return;
    }

    openWhatsAppOrder(product, language);
  } catch (error) {
    console.error("Photo sharing failed:", error);
    openWhatsAppOrder(product, language);
  }
}

function getProductPlaceholder(productName) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="900" height="600" viewBox="0 0 900 600">
      <rect width="900" height="600" fill="#f6f7f9"/>
      <rect x="84" y="84" width="732" height="432" rx="28" fill="#ffffff" stroke="#e6e9ee" stroke-width="4"/>
      <path d="M210 306c32-70 148-68 184-8 19 32 14 83-20 108-45 34-132 22-158-32-10-22-12-47-6-68Z" fill="none" stroke="#111318" stroke-width="26" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M506 298c36-60 152-62 184 8 6 21 4 46-6 68-26 54-113 66-158 32-34-25-39-76-20-108Z" fill="none" stroke="#111318" stroke-width="26" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M392 320c32-22 84-22 116 0" fill="none" stroke="#111318" stroke-width="22" stroke-linecap="round"/>
      <text x="450" y="505" text-anchor="middle" fill="#111318" font-family="Arial, sans-serif" font-size="30" font-weight="700" textLength="640" lengthAdjust="spacingAndGlyphs">${productName}</text>
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

function formatPrice(price) {
  return `${Number(price).toLocaleString("fr-FR").replace(/\u202f/g, " ")} DA`;
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

function getProductImagePath(product) {
  return product.imageUrl || product.image || product.image_url || product.images?.[0] || "";
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
  const detailsPath = `/products/${product.id}`;
  const displayedName = getLocalizedProductName(product, language);
  const imageLabel = getProductImageLabel(product, language);
  const imagePath = getProductImagePath(product);
  const { oldPrice, hasDiscount, discountPercent } = getDiscountInfo(product);

  function openDetails() {
    navigate(detailsPath);
  }

  function handleCardKeyDown(event) {
    if (event.key === "Enter") {
      openDetails();
    }
  }

  return (
    <article
      className="product-card"
      role="button"
      tabIndex={0}
      onClick={openDetails}
      onKeyDown={handleCardKeyDown}
    >
      <div className="product-image-link">
        <img
          src="/images/logo.png"
          alt="Clair'Optique"
          className="product-logo-badge"
        />
        <img
          src={imagePath}
          alt={imageLabel}
          className="product-image"
          data-image-path={imagePath}
          onError={(event) => handleProductImageError(event, imageLabel)}
        />
      </div>

      <div className="product-card-body">
        <div>
          <p className="eyebrow">
            {getProductMeta(product, language)}
          </p>
          <h3>{displayedName}</h3>
          <p className="product-brand">{t("product.brand")} : {product.brand}</p>
          <p className="product-frame-size">
            {t("product.size")} : {formatFrameSize(product.frameSize, language)}
          </p>
          <div className="product-price-group">
            {hasDiscount ? (
              <span className="product-old-price">{formatPrice(oldPrice)}</span>
            ) : null}
            <strong className="product-price">{formatPrice(product.price)}</strong>
            {hasDiscount ? (
              <span className="product-discount-badge">-{discountPercent}%</span>
            ) : null}
          </div>
          <span className={`product-stock-badge ${product.stock ? "in-stock" : "out-stock"}`}>
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
            onClick={(event) => {
              event.stopPropagation();
              handleSharePhoto(product, language);
            }}
          >
            <span className="order-text-desktop">{t("product.orderWhatsApp")}</span>
            <span className="order-text-mobile">{t("product.order")}</span>
          </button>
        </div>
      </div>
    </article>
  );
}

export {
  formatFrameSize,
  formatPrice,
  getDiscountInfo,
  getProductCategoryLabel,
  getProductImageLabel,
  getProductImagePath,
  getProductMeta,
  getProductPlaceholder,
  getWhatsAppOrderUrl,
  handleProductImageError,
  handleSharePhoto,
};
export default ProductCard;
