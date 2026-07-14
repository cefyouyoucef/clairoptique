import { useEffect, useRef, useState } from "react";
import { isSupabaseConfigured, supabase } from "../lib/supabaseClient.js";

const PRODUCT_IMAGE_BUCKET = "product-images";

const emptyProduct = {
  name: "",
  brand: "Clair'Optique",
  category: "Optiques",
  gender: "Homme",
  price: "",
  oldPrice: "",
  color: "",
  frameSize: "",
  description: "",
  imageUrl: "",
  stock: true,
};

function getSafeFileName(fileName) {
  return fileName
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getProductImages(product) {
  const images = Array.isArray(product?.images)
    ? product.images.filter(Boolean)
    : [];

  const fallbackImage =
    product?.imageUrl ||
    product?.image ||
    product?.image_url ||
    "";

  return Array.from(
    new Set([...images, fallbackImage].filter(Boolean))
  );
}

function createUrlImageItem(url) {
  return {
    id: `url-${url}`,
    key: `url-${url}`,
    previewUrl: url,
    source: "url",
    url,
  };
}

function createFileImageItem(file, objectUrlsRef) {
  const key = `file-${file.name}-${file.size}-${file.lastModified}`;
  const previewUrl = URL.createObjectURL(file);

  objectUrlsRef.current.add(previewUrl);

  return {
    id: `${key}-${Date.now()}`,
    key,
    previewUrl,
    source: "file",
    file,
  };
}

function createInitialImageItems(product) {
  return getProductImages(product).map(createUrlImageItem);
}

async function uploadProductImage(file, index = 0) {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error("Supabase n'est pas configur\u00e9.");
  }

  const safeFileName = getSafeFileName(file.name) || "product-image.jpg";
  const filePath = `products/${Date.now()}-${index}-${safeFileName}`;

  const { error } = await supabase.storage
    .from(PRODUCT_IMAGE_BUCKET)
    .upload(filePath, file, {
      cacheControl: "3600",
      contentType: file.type || "image/jpeg",
      upsert: false,
    });

  if (error) {
    console.error("Product image upload failed:", error);
    throw error;
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(PRODUCT_IMAGE_BUCKET).getPublicUrl(filePath);

  if (!publicUrl) {
    throw new Error(
      "Impossible de r\u00e9cup\u00e9rer l'URL publique de l'image."
    );
  }

  return publicUrl;
}

export default function ProductForm({
  initialProduct,
  isSubmitting = false,
  onCancel,
  onSubmit,
  submitLabel = "Enregistrer",
  showOldPrice = false,
}) {
  const currentProduct = initialProduct || emptyProduct;
  const fileInputRef = useRef(null);
  const objectUrlsRef = useRef(new Set());
  const [imageItems, setImageItems] = useState(() =>
    createInitialImageItems(currentProduct)
  );
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [showImageUrlInput, setShowImageUrlInput] = useState(false);

  const isFormBusy = isSubmitting || isUploading;

  useEffect(() => {
    setImageItems((currentItems) => {
      currentItems.forEach((item) => {
        if (item.source === "file") {
          URL.revokeObjectURL(item.previewUrl);
          objectUrlsRef.current.delete(item.previewUrl);
        }
      });

      return createInitialImageItems(currentProduct);
    });

    setImageUrlInput("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [currentProduct.id]);

  useEffect(() => {
    return () => {
      objectUrlsRef.current.forEach((url) => {
        URL.revokeObjectURL(url);
      });

      objectUrlsRef.current.clear();
    };
  }, []);

  function addImageItems(nextItems) {
    setImageItems((currentItems) => {
      const existingKeys = new Set(currentItems.map((item) => item.key));
      const uniqueItems = [];

      nextItems.forEach((item) => {
        if (existingKeys.has(item.key)) {
          if (item.source === "file") {
            URL.revokeObjectURL(item.previewUrl);
            objectUrlsRef.current.delete(item.previewUrl);
          }

          return;
        }

        existingKeys.add(item.key);
        uniqueItems.push(item);
      });

      return [...currentItems, ...uniqueItems];
    });
  }

  function handleFileSelection(event) {
    const files = Array.from(event.target.files || []);
    const nextItems = files.map((file) =>
      createFileImageItem(file, objectUrlsRef)
    );

    addImageItems(nextItems);
    event.target.value = "";
  }

  function handleAddImageUrl() {
    const imageUrl = imageUrlInput.trim();

    if (!imageUrl) return;

    addImageItems([createUrlImageItem(imageUrl)]);
    setImageUrlInput("");
  }

  function handleRemoveImage(imageId) {
    setImageItems((currentItems) => {
      const removedItem = currentItems.find((item) => item.id === imageId);

      if (removedItem?.source === "file") {
        URL.revokeObjectURL(removedItem.previewUrl);
        objectUrlsRef.current.delete(removedItem.previewUrl);
      }

      return currentItems.filter((item) => item.id !== imageId);
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setUploadError("");

    const pendingUrl = imageUrlInput.trim();
    const submitImageItems =
      pendingUrl && !imageItems.some((item) => item.key === `url-${pendingUrl}`)
        ? [...imageItems, createUrlImageItem(pendingUrl)]
        : imageItems;

    if (submitImageItems.length === 0) {
      setUploadError("Choisissez une image ou utilisez une URL.");
      return;
    }

    const formData = new FormData(event.currentTarget);
    let imageUrls = [];

    try {
      setIsUploading(true);

      imageUrls = await Promise.all(
        submitImageItems.map((item, index) => {
          if (item.source === "file") {
            return uploadProductImage(item.file, index);
          }

          return item.url;
        })
      );
    } catch (error) {
      console.error("Product image upload error:", error);
      setUploadError(error.message || "Impossible de t\u00e9l\u00e9verser l'image.");
      return;
    } finally {
      setIsUploading(false);
    }

    const imageUrl = imageUrls[0] || "";
    const oldPriceValue = formData.get("oldPrice");

    const nextProduct = {
      name: String(formData.get("name") || "").trim(),
      brand: String(formData.get("brand") || "").trim(),
      category: String(formData.get("category") || ""),
      gender: String(formData.get("gender") || ""),
      price: Number(formData.get("price") || 0),
      oldPrice:
        oldPriceValue && Number(oldPriceValue) > 0
          ? Number(oldPriceValue)
          : null,
      color: String(formData.get("color") || "").trim(),
      frameSize: String(formData.get("frameSize") || "").trim(),
      description: String(formData.get("description") || "").trim(),
      image: imageUrl,
      imageUrl,
      images: imageUrls,
      stock: formData.get("stock") === "on",
      ...(initialProduct && "featured" in initialProduct
        ? { featured: initialProduct.featured ?? false }
        : {}),
    };

    console.log("ProductForm submit:", nextProduct);
    console.log("Submitted image URL:", nextProduct.imageUrl);

    onSubmit(nextProduct);
  }

  return (
    <form className="admin-form" onSubmit={handleSubmit}>
      <div className="admin-form-grid">
        <label>
          <span>Nom du produit</span>
          <input
            name="name"
            required
            defaultValue={currentProduct.name}
            disabled={isFormBusy}
          />
        </label>

        <label>
          <span>Marque</span>
          <input
            name="brand"
            required
            defaultValue={currentProduct.brand}
            disabled={isFormBusy}
          />
        </label>

        <label>
          <span>{"Cat\u00e9gorie"}</span>
          <select
            name="category"
            required
            defaultValue={currentProduct.category}
            disabled={isFormBusy}
          >
            <option value="Optiques">Optiques</option>
            <option value="Solaires">Solaires</option>
            <option value="Verres">Verres</option>
            <option value="Lentilles">Lentilles</option>
          </select>
        </label>

        <label>
          <span>Genre</span>
          <select
            name="gender"
            required
            defaultValue={currentProduct.gender}
            disabled={isFormBusy}
          >
            <option value="Homme">Homme</option>
            <option value="Femme">Femme</option>
            <option value="Enfant">Enfant</option>
            <option value="Unisexe">Unisexe</option>
          </select>
        </label>

        <label>
          <span>Prix actuel</span>
          <input
            name="price"
            type="number"
            min="0"
            required
            defaultValue={currentProduct.price}
            disabled={isFormBusy}
          />
        </label>

        {showOldPrice ? (
          <label>
            <span>Ancien prix</span>
            <input
              name="oldPrice"
              type="number"
              min="0"
              defaultValue={currentProduct.oldPrice ?? currentProduct.old_price ?? ""}
              disabled={isFormBusy}
            />
          </label>
        ) : null}

        <label>
          <span>Couleur</span>
          <input
            name="color"
            required
            defaultValue={currentProduct.color}
            disabled={isFormBusy}
          />
        </label>

        <label>
          <span>Taille de monture</span>
          <input
            name="frameSize"
            required
            placeholder="M - 52-18 - 140 mm"
            defaultValue={currentProduct.frameSize || currentProduct.frame_size}
            disabled={isFormBusy}
          />
        </label>

        <label className="admin-upload-field">
          <span>Image</span>

          <span className="admin-upload-box">
            <input
              ref={fileInputRef}
              className="admin-file-input"
              name="imageFile"
              type="file"
              accept="image/*"
              multiple
              disabled={isFormBusy}
              onChange={handleFileSelection}
            />

            <span className="admin-upload-button">Choisir une image</span>
            <span className="admin-upload-name">
              {imageItems.length > 0
                ? `${imageItems.length} image${imageItems.length > 1 ? "s" : ""} s\u00e9lectionn\u00e9e${imageItems.length > 1 ? "s" : ""}`
                : "Aucune image s\u00e9lectionn\u00e9e"}
            </span>
          </span>

          <small>
            Choisissez une image depuis votre PC. Vous pouvez aussi utiliser une URL si n\u00e9cessaire.
          </small>
        </label>

        <div className="admin-image-url-fallback">
          <button
            className="admin-url-toggle"
            type="button"
            disabled={isFormBusy}
            onClick={() => setShowImageUrlInput((isVisible) => !isVisible)}
          >
            Utiliser une URL
          </button>

          {showImageUrlInput ? (
            <label>
              <span>Image URL</span>
              <input
                name="imageUrl"
                pattern="(?:/images/.*|https://.*)"
                title="Utilisez un chemin local comme /images/products/image.jpg ou une URL https://"
                placeholder="/images/products/lunette-optique-noire.jpg"
                value={imageUrlInput}
                disabled={isFormBusy}
                onChange={(event) => setImageUrlInput(event.target.value)}
              />
              <small>
                Optionnel : image locale depuis public/images/products ou lien https.
              </small>
              <button
                className="admin-url-add-button"
                type="button"
                disabled={isFormBusy || !imageUrlInput.trim()}
                onClick={handleAddImageUrl}
              >
                Ajouter l'URL
              </button>
            </label>
          ) : null}
        </div>

        <label className="admin-checkbox">
          <input
            name="stock"
            type="checkbox"
            defaultChecked={currentProduct.stock ?? true}
            disabled={isFormBusy}
          />
          <span>En stock</span>
        </label>
      </div>

      <div className="admin-image-preview-section">
        {imageItems.length > 0 ? (
          <div className="admin-image-preview-grid">
            {imageItems.map((item) => (
              <div className="admin-image-preview" key={item.id}>
                <img src={item.previewUrl} alt="Aper\u00e7u du produit" />

                <button
                  className="admin-image-remove-button"
                  type="button"
                  aria-label="Supprimer cette image"
                  disabled={isFormBusy}
                  onClick={() => handleRemoveImage(item.id)}
                >
                  {"\u00d7"}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="admin-upload-empty">{"Aucune image s\u00e9lectionn\u00e9e"}</p>
        )}
      </div>

      <label>
        <span>Description</span>
        <textarea
          name="description"
          required
          rows="4"
          defaultValue={currentProduct.description}
          disabled={isFormBusy}
        />
      </label>

      {isUploading ? (
        <p className="admin-info">{"T\u00e9l\u00e9chargement de l'image..."}</p>
      ) : null}

      {uploadError ? <p className="admin-error">{uploadError}</p> : null}

      <div className="admin-form-actions">
        <button className="btn btn-primary" type="submit" disabled={isFormBusy}>
          {isUploading ? "T\u00e9l\u00e9chargement..." : submitLabel}
        </button>

        {onCancel ? (
          <button
            className="btn btn-secondary"
            type="button"
            onClick={onCancel}
            disabled={isFormBusy}
          >
            Annuler
          </button>
        ) : null}
      </div>
    </form>
  );
}
