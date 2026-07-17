import { useCallback, useRef, useState } from "react";
import { WHATSAPP_NUMBER } from "../config/contact.js";
import {
  getLocalizedProductName,
  translate,
} from "../i18n/translations.js";

function formatOrderPrice(price) {
  const numericPrice = Number(price);

  if (!Number.isFinite(numericPrice)) {
    return `${String(price || 0)} DA`;
  }

  return `${numericPrice
    .toLocaleString("fr-FR")
    .replace(/[\u00a0\u202f]/g, " ")} DA`;
}

function getShareImagePath(product) {
  return (
    product?.image_url ||
    product?.imageUrl ||
    product?.image ||
    product?.images?.[0] ||
    ""
  );
}

function getAbsoluteImageUrl(product) {
  const imagePath = String(getShareImagePath(product)).trim();

  if (!imagePath || imagePath.startsWith("data:")) return "";

  try {
    return new URL(imagePath, window.location.origin).href;
  } catch (error) {
    console.error("Invalid product image URL for WhatsApp sharing:", {
      imagePath,
      error,
    });
    return "";
  }
}

function buildProductOrderMessage(
  product,
  language,
  includeImageUrl = false,
  introKey = "whatsapp.orderIntro"
) {
  const messageParts = [
    translate(language, introKey),
    "",
    `${translate(language, "whatsapp.name")}: ${getLocalizedProductName(product, language)}`,
    `${translate(language, "whatsapp.price")}: ${formatOrderPrice(product?.price)}`,
    `${translate(language, "whatsapp.category")}: ${product?.category || "-"}`,
  ];
  const imageUrl = getAbsoluteImageUrl(product);

  if (includeImageUrl && imageUrl) {
    messageParts.push(
      "",
      `${translate(language, "whatsapp.image")}: ${imageUrl}`
    );
  }

  return messageParts.join("\n");
}

function openWhatsAppFallback(product, language, introKey) {
  const message = buildProductOrderMessage(product, language, true, introKey);
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  const whatsappWindow = window.open(whatsappUrl, "_blank");

  if (whatsappWindow) {
    whatsappWindow.opener = null;
  } else {
    window.location.assign(whatsappUrl);
  }
}

function getImageFileName(imageUrl, product, blobType) {
  const productName = getLocalizedProductName(product, "fr") || "produit";
  const safeProductName = productName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
  const extensionByType = {
    "image/gif": "gif",
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  };
  let extension = extensionByType[blobType];

  if (!extension) {
    try {
      extension = new URL(imageUrl).pathname.match(/\.([a-z0-9]+)$/i)?.[1];
    } catch {
      extension = "";
    }
  }

  return `${safeProductName || "produit"}.${extension || "jpg"}`;
}

async function downloadProductImage(product) {
  const imageUrl = getAbsoluteImageUrl(product);

  if (!imageUrl) return null;

  let response;

  try {
    response = await fetch(imageUrl, {
      credentials: "omit",
      mode: "cors",
    });
  } catch (error) {
    console.error(
      "Product image download failed. Verify the public image CORS configuration:",
      { imageUrl, error }
    );
    throw error;
  }

  if (!response.ok) {
    const error = new Error(
      `Le téléchargement de l'image a échoué (HTTP ${response.status}).`
    );
    console.error("Product image download failed:", { imageUrl, error });
    throw error;
  }

  const blob = await response.blob();

  if (!blob.size) {
    const error = new Error("L'image téléchargée est vide.");
    console.error("Product image download failed:", { imageUrl, error });
    throw error;
  }

  return new File([blob], getImageFileName(imageUrl, product, blob.type), {
    type: blob.type || "image/jpeg",
    lastModified: Date.now(),
  });
}

function isShareCancellation(error) {
  return (
    error?.name === "AbortError" ||
    /abort|annul|cancel/i.test(String(error?.message || ""))
  );
}

function useProductWhatsAppShare(
  product,
  language = "fr",
  introKey = "whatsapp.orderIntro"
) {
  const [isPreparingShare, setIsPreparingShare] = useState(false);
  const isPreparingShareRef = useRef(false);

  const handleProductWhatsAppShare = useCallback(async () => {
    if (isPreparingShareRef.current) return;

    isPreparingShareRef.current = true;
    setIsPreparingShare(true);

    try {
      const supportsFileSharing =
        window.isSecureContext &&
        typeof File === "function" &&
        typeof navigator.share === "function" &&
        typeof navigator.canShare === "function";

      if (!supportsFileSharing) {
        openWhatsAppFallback(product, language, introKey);
        return;
      }

      let imageFile;

      try {
        imageFile = await downloadProductImage(product);
      } catch {
        openWhatsAppFallback(product, language, introKey);
        return;
      }

      if (!imageFile || !navigator.canShare({ files: [imageFile] })) {
        openWhatsAppFallback(product, language, introKey);
        return;
      }

      try {
        await navigator.share({
          files: [imageFile],
          title: getLocalizedProductName(product, language),
          text: buildProductOrderMessage(product, language, false, introKey),
        });
      } catch (error) {
        if (isShareCancellation(error)) return;

        console.error("Product file sharing failed:", error);
        openWhatsAppFallback(product, language, introKey);
      }
    } catch (error) {
      console.error("Unexpected product sharing error:", error);
      openWhatsAppFallback(product, language, introKey);
    } finally {
      isPreparingShareRef.current = false;
      setIsPreparingShare(false);
    }
  }, [introKey, language, product]);

  return {
    handleProductWhatsAppShare,
    isPreparingShare,
  };
}

export default useProductWhatsAppShare;
