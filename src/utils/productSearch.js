export function normalizeSearchText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\u064b-\u065f\u0670\u06d6-\u06ed]/g, "")
    .replace(/\u0640/g, "")
    .toLowerCase()
    .trim();
}

export function getProductSearchText(product, additionalValues = []) {
  return normalizeSearchText(
    [
      product?.name,
      product?.name_fr,
      product?.nameFr,
      product?.name_ar,
      product?.nameAr,
      product?.brand,
      product?.category,
      product?.category_fr,
      product?.categoryFr,
      product?.category_ar,
      product?.categoryAr,
      product?.gender,
      product?.gender_fr,
      product?.genderFr,
      product?.gender_ar,
      product?.genderAr,
      product?.color,
      product?.color_fr,
      product?.colorFr,
      product?.color_ar,
      product?.colorAr,
      product?.description,
      product?.description_fr,
      product?.descriptionFr,
      product?.description_ar,
      product?.descriptionAr,
      product?.type,
      product?.product_type,
      product?.productType,
      ...additionalValues,
    ]
      .filter(Boolean)
      .join(" ")
  );
}

export function productMatchesSearch(product, searchQuery, additionalValues = []) {
  const normalizedQuery = normalizeSearchText(searchQuery);

  if (!normalizedQuery) return false;

  return getProductSearchText(product, additionalValues).includes(normalizedQuery);
}
