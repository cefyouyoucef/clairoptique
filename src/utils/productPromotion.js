import { getDiscountInfo } from "../components/ProductCard.jsx";

export function isPromotedProduct(product) {
  const { hasDiscount } = getDiscountInfo(product);

  return product?.featured === true && hasDiscount;
}

export function prioritizePromotedProducts(products = []) {
  const promoted = [];
  const regular = [];

  (Array.isArray(products) ? products : []).forEach((product) => {
    if (isPromotedProduct(product)) {
      promoted.push(product);
    } else {
      regular.push(product);
    }
  });

  return [...promoted, ...regular];
}
