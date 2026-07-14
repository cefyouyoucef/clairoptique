import { products as defaultProducts } from "../data/products.js";
import { isSupabaseConfigured, supabase } from "../lib/supabaseClient.js";

const PRODUCT_STORAGE_KEY = "clairoptique-products";

function readLocalProducts() {
  try {
    const storedProducts = localStorage.getItem(PRODUCT_STORAGE_KEY);

    if (!storedProducts) {
      return defaultProducts;
    }

    const parsedProducts = JSON.parse(storedProducts);
    return Array.isArray(parsedProducts) ? parsedProducts : defaultProducts;
  } catch (error) {
    console.error("Local products fallback:", error);
    return defaultProducts;
  }
}

function writeLocalProducts(products) {
  localStorage.setItem(PRODUCT_STORAGE_KEY, JSON.stringify(products));
  notifyProductsChanged();
}

function notifyProductsChanged() {
  window.dispatchEvent(new Event("clairoptique-products-changed"));
}

function createProductId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return String(Date.now());
}

function textValue(value) {
  return value || "";
}

function brandValue(value) {
  const brand = textValue(value).trim();

  if (/^clair\s*'?\s*optique$/i.test(brand)) {
    return "Clair'Optique";
  }

  return brand;
}

function priceValue(value) {
  return Number(value || 0);
}

function arrayValue(value) {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }

  return [];
}

function toClientProduct(product) {
  const productName = textValue(product.name);
  const productNameAr = textValue(product.name_ar || product.nameAr);
  const productBrand = brandValue(product.brand);
  const productCategory = textValue(product.category);
  const productGender = textValue(product.gender);
  const productPrice = priceValue(product.price);
  const productColor = textValue(product.color);
  const productFrameSize = textValue(product.frame_size || product.frameSize);
  const productDescription = textValue(product.description);
  const productDescriptionAr = textValue(
    product.description_ar || product.descriptionAr
  );

  const productImages = arrayValue(product.images);
  const productImage = textValue(
    product.image_url || product.imageUrl || product.image || productImages[0]
  );

  const nextProductImages =
    productImages.length > 0 ? productImages : productImage ? [productImage] : [];

  const primaryProductImage = productImage || nextProductImages[0] || "";
  const productStock = product.stock ?? true;
  const productCreatedAt = product.created_at || product.createdAt;

  return {
    id: product.id,
    name: productName,
    nameAr: productNameAr,
    name_ar: productNameAr,
    brand: productBrand,
    category: productCategory,
    gender: productGender,
    price: productPrice,
    oldPrice: product.old_price ?? product.oldPrice ?? null,
    color: productColor,
    frameSize: productFrameSize,
    description: productDescription,
    descriptionAr: productDescriptionAr,
    description_ar: productDescriptionAr,
    image: primaryProductImage,
    imageUrl: primaryProductImage,
    image_url: primaryProductImage,
    images: nextProductImages,
    stock: productStock,
    featured: product.featured ?? false,
    createdAt: productCreatedAt,
  };
}

function toSupabaseProduct(product) {
  const productName = textValue(product.name);
  const productBrand = brandValue(product.brand);
  const productCategory = textValue(product.category);
  const productGender = textValue(product.gender);
  const productPrice = priceValue(product.price);
  const productColor = textValue(product.color);
  const productFrameSize = textValue(product.frameSize || product.frame_size);
  const productDescription = textValue(product.description);

  const productImages = arrayValue(product.images);
  const productImageUrl = textValue(
    product.imageUrl || product.image || product.image_url || productImages[0]
  );

  const nextProductImages =
    productImages.length > 0 ? productImages : productImageUrl ? [productImageUrl] : [];

  return {
    name: productName,
    brand: productBrand,
    category: productCategory,
    gender: productGender,
    price: productPrice,
    old_price:
      product.oldPrice && Number(product.oldPrice) > 0
        ? Number(product.oldPrice)
        : null,
    color: productColor,
    frame_size: productFrameSize,
    description: productDescription,
    image_url: productImageUrl,
    images: nextProductImages,
    stock: product.stock ?? true,
    featured: product.featured ?? false,
  };
}

function findLocalProductById(id) {
  return readLocalProducts().find((product) => String(product.id) === String(id)) || null;
}

async function fetchProductsFromSupabase() {
  const response = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (response.error) throw response.error;

  return (response.data || []).map(toClientProduct);
}

export async function getProducts() {
  if (!isSupabaseConfigured || !supabase) {
    return readLocalProducts();
  }

  try {
    return await fetchProductsFromSupabase();
  } catch (error) {
    console.error("Supabase products fallback:", error);
    return readLocalProducts();
  }
}

export async function getProductById(id) {
  if (!isSupabaseConfigured || !supabase) {
    return findLocalProductById(id);
  }

  try {
    const response = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (response.error) throw response.error;

    return response.data ? toClientProduct(response.data) : null;
  } catch (error) {
    console.error("Supabase product fallback:", error);
    return findLocalProductById(id);
  }
}

export async function addProduct(product) {
  if (!isSupabaseConfigured || !supabase) {
    const storedProducts = readLocalProducts();
    const createdProduct = { ...product, id: createProductId() };
    const productsAfterAdd = [createdProduct, ...storedProducts];

    writeLocalProducts(productsAfterAdd);
    return productsAfterAdd;
  }

  const response = await supabase.from("products").insert(toSupabaseProduct(product));

  if (response.error) {
    console.error("Add product failed:", response.error);
    throw response.error;
  }

  notifyProductsChanged();
  return await fetchProductsFromSupabase();
}

export async function updateProduct(id, updatedProduct) {
  if (!isSupabaseConfigured || !supabase) {
    const storedProducts = readLocalProducts();
    const productsAfterUpdate = storedProducts.map((product) =>
      String(product.id) === String(id)
        ? { ...product, ...updatedProduct, id: product.id }
        : product
    );

    writeLocalProducts(productsAfterUpdate);
    return productsAfterUpdate;
  }

  const response = await supabase
    .from("products")
    .update(toSupabaseProduct(updatedProduct))
    .eq("id", id);

  if (response.error) {
    console.error("Update product failed:", response.error);
    throw response.error;
  }

  notifyProductsChanged();
  return await fetchProductsFromSupabase();
}

export async function deleteProduct(id) {
  if (!isSupabaseConfigured || !supabase) {
    const storedProducts = readLocalProducts();
    const productsAfterDelete = storedProducts.filter(
      (product) => String(product.id) !== String(id)
    );

    writeLocalProducts(productsAfterDelete);
    return productsAfterDelete;
  }

  const response = await supabase.from("products").delete().eq("id", id);

  if (response.error) throw response.error;

  notifyProductsChanged();
  return await fetchProductsFromSupabase();
}

export function saveProducts(products) {
  writeLocalProducts(products);
}
