export function formatPrice(price) {
  return `${Number(price)
    .toLocaleString("fr-FR")
    .replace(/[\u00a0\u202f]/g, " ")} DA`;
}

export function getProductImages(product) {
  const images = Array.isArray(product?.images) ? product.images : [];
  const normalizedImages = [
    ...images,
    product?.imageUrl,
    product?.image,
    product?.image_url,
  ]
    .map((image) => String(image || "").trim())
    .filter(Boolean);

  return Array.from(new Set(normalizedImages));
}

export function getProductImagePath(product) {
  return getProductImages(product)[0] || "";
}
