import { useEffect } from "react";
import "../pages/ProductDetailsLightbox.css";

function ProductImageLightbox({
  images,
  activeIndex,
  onActiveIndexChange,
  isOpen,
  onClose,
  imageAlt,
  onImageError,
}) {
  const imageCount = images.length;
  const activeImage = images[activeIndex] || images[0];

  useEffect(() => {
    if (!isOpen || imageCount === 0) return undefined;

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (imageCount <= 1) return;

      if (event.key === "ArrowLeft") {
        onActiveIndexChange((index) =>
          index === 0 ? imageCount - 1 : index - 1
        );
      }

      if (event.key === "ArrowRight") {
        onActiveIndexChange((index) =>
          index === imageCount - 1 ? 0 : index + 1
        );
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [imageCount, isOpen, onActiveIndexChange, onClose]);

  if (!isOpen || imageCount === 0) return null;

  return (
    <div
      className="product-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label="Galerie du produit"
      onClick={onClose}
    >
      <div
        className="product-lightbox-content"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="product-lightbox-close"
          aria-label="Fermer"
          onClick={onClose}
        >
          ×
        </button>

        {imageCount > 1 ? (
          <button
            type="button"
            className="product-lightbox-arrow product-lightbox-arrow-prev"
            aria-label="Image précédente"
            onClick={() =>
              onActiveIndexChange((index) =>
                index === 0 ? imageCount - 1 : index - 1
              )
            }
          >
            ‹
          </button>
        ) : null}

        <img
          src={activeImage}
          alt={imageAlt}
          className="product-lightbox-image"
          data-image-path={activeImage}
          onError={onImageError}
        />

        {imageCount > 1 ? (
          <button
            type="button"
            className="product-lightbox-arrow product-lightbox-arrow-next"
            aria-label="Image suivante"
            onClick={() =>
              onActiveIndexChange((index) =>
                index === imageCount - 1 ? 0 : index + 1
              )
            }
          >
            ›
          </button>
        ) : null}

        <div className="product-lightbox-counter">
          {activeIndex + 1} / {imageCount}
        </div>
      </div>
    </div>
  );
}

export default ProductImageLightbox;
