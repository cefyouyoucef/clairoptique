import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminOrders from "./AdminOrders.jsx";
import ProductForm from "./ProductForm.jsx";
import { getDiscountInfo } from "../components/ProductCard.jsx";
import { formatPrice } from "../utils/productPresentation.js";
import { isSupabaseConfigured, supabase } from "../lib/supabaseClient.js";
import {
  addProduct,
  deleteProduct,
  getProducts,
  updateProduct,
} from "../utils/productStorage.js";

function AdminDashboard() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [productsStatus, setProductsStatus] = useState("loading");
  const [productsError, setProductsError] = useState("");
  const [mode, setMode] = useState("list");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [activeSection, setActiveSection] = useState("products");

  async function loadProducts() {
    try {
      setProductsStatus("loading");
      setProductsError("");
      const nextProducts = await getProducts();
      setProducts(nextProducts);
      setProductsStatus("success");
      return nextProducts;
    } catch (error) {
      console.error("Admin load products error:", error);
      setProductsError("Impossible de charger les produits.");
      setProductsStatus("error");
      return [];
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  function showAddForm() {
    setSelectedProduct(null);
    setMode("add");
  }

  function showEditForm(product) {
    setSelectedProduct(product);
    setMode("edit");
  }

  function handleBackToList() {
    setMode("list");
    setSelectedProduct(null);
    setProductsError("");
  }

  async function handleAdd(product) {
    try {
      setIsSaving(true);
      setProductsError("");
      const nextProducts = await addProduct(product);
      setProducts(nextProducts);
      setProductsStatus("success");
      setMode("list");
    } catch (error) {
      console.error("Admin add product error:", error);
      setProductsError(error.message || "Impossible d'ajouter le produit.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleUpdate(product) {
    if (!selectedProduct) return;

    try {
      setIsSaving(true);
      setProductsError("");
      const nextProducts = await updateProduct(selectedProduct.id, product);
      setProducts(nextProducts);
      setProductsStatus("success");
      setSelectedProduct(null);
      setMode("list");
    } catch (error) {
      console.error("Admin update product error:", error);
      setProductsError(error.message || "Impossible de modifier le produit.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(product) {
    if (!window.confirm("Voulez-vous vraiment supprimer ce produit ?")) return;

    try {
      setIsSaving(true);
      setProductsError("");
      const nextProducts = await deleteProduct(product.id);
      setProducts(nextProducts);
      setProductsStatus("success");
    } catch (error) {
      console.error("Admin delete product error:", error);
      setProductsError("Impossible de supprimer le produit.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleToggleFeatured(product, featured) {
    try {
      setProductsError("");
      await updateProduct(product.id, { ...product, featured });
      await loadProducts();
    } catch (error) {
      console.error("Toggle featured failed:", error);
      setProductsError(
        error.message || "Impossible de modifier la sélection populaire."
      );
    }
  }

  async function handleLogout() {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }

    navigate("/admin-login");
  }

  return (
    <section className="section page-section admin-dashboard">
      <div className="container">
        <div className="admin-topbar">
          <div className="page-heading">
            <p className="eyebrow">Administration</p>
            <h1>Tableau de bord</h1>
          </div>

          <button className="btn btn-secondary" type="button" onClick={handleLogout}>
            Déconnexion
          </button>
        </div>

        <div className="admin-section-tabs">
          <button
            className={activeSection === "products" ? "active" : ""}
            type="button"
            onClick={() => setActiveSection("products")}
          >
            Produits
          </button>

          <button
            className={activeSection === "orders" ? "active" : ""}
            type="button"
            onClick={() => setActiveSection("orders")}
          >
            Commandes
          </button>
        </div>

        {activeSection === "orders" ? (
          <AdminOrders />
        ) : (
          <>
            {productsError ? <p className="admin-error">{productsError}</p> : null}

            {mode === "list" ? (
              <>
                <div className="admin-toolbar">
                  <p>{products.length} produits</p>
                  <button
                    className="btn btn-primary"
                    type="button"
                    onClick={showAddForm}
                  >
                    Ajouter un produit
                  </button>
                </div>

                {productsStatus === "loading" ? (
                  <div className="empty-state">
                    <p>Chargement des produits...</p>
                  </div>
                ) : null}

                {productsStatus === "error" ? (
                  <div className="empty-state">
                    <h2>Erreur</h2>
                    <p>Vérifiez la configuration Supabase puis réessayez.</p>
                  </div>
                ) : null}

                {productsStatus === "success" && products.length === 0 ? (
                  <div className="empty-state">
                    <h2>Aucun produit</h2>
                    <p>Ajoutez votre premier produit.</p>
                  </div>
                ) : null}

                {productsStatus === "success" && products.length > 0 ? (
                  <div className="admin-products-list">
                    {products.map((product) => {
                      const { oldPrice, hasDiscount, discountPercent } =
                        getDiscountInfo(product);
                      const productImage =
                        product.image ||
                        product.imageUrl ||
                        product.image_url ||
                        product.images?.[0];

                      return (
                        <article
                          className="admin-product-row"
                          key={product.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => showEditForm(product)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              showEditForm(product);
                            }
                          }}
                        >
                          <img src={productImage} alt={product.name} />
                          <div className="admin-product-info">
                            <h2>{product.name}</h2>
                            <p>
                              {product.brand} / {product.category} / {product.gender}
                            </p>
                            {hasDiscount ? (
                              <div className="admin-discount-summary">
                                <p className="admin-old-price">
                                  {formatPrice(oldPrice)}
                                </p>
                                <strong>{formatPrice(product.price)}</strong>
                                <span className="admin-discount-badge">
                                  -{discountPercent}%
                                </span>
                              </div>
                            ) : (
                              <strong>{formatPrice(product.price)}</strong>
                            )}
                            <p>{product.stock ? "En stock" : "Rupture de stock"}</p>
                            {product.featured ? (
                              <span className="admin-featured-badge">Populaire</span>
                            ) : null}
                          </div>
                          <div className="admin-row-actions">
                            <label
                              className="admin-featured-toggle"
                              onClick={(event) => event.stopPropagation()}
                              onKeyDown={(event) => event.stopPropagation()}
                            >
                              <input
                                type="checkbox"
                                checked={Boolean(product.featured)}
                                disabled={isSaving}
                                onChange={(event) =>
                                  handleToggleFeatured(
                                    product,
                                    event.target.checked
                                  )
                                }
                              />
                              <span>Nos collections populaires</span>
                            </label>
                            <button
                              className="btn btn-secondary"
                              disabled={isSaving}
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                showEditForm(product);
                              }}
                            >
                              Modifier
                            </button>
                            <button
                              className="btn btn-danger"
                              disabled={isSaving}
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                handleDelete(product);
                              }}
                            >
                              Supprimer
                            </button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                ) : null}
              </>
            ) : (
              <div className="admin-editor">
                <button
                  className="admin-back-icon-button"
                  type="button"
                  aria-label="Retour aux produits"
                  onClick={handleBackToList}
                >
                  ←
                </button>

                <div className="section-heading">
                  <p className="eyebrow">
                    {mode === "add" ? "Nouveau produit" : "Modifier"}
                  </p>
                  <h2>
                    {mode === "add"
                      ? "Ajouter un produit"
                      : selectedProduct?.name}
                  </h2>
                </div>

                <ProductForm
                  initialProduct={selectedProduct}
                  isSubmitting={isSaving}
                  submitLabel={
                    isSaving
                      ? "Enregistrement..."
                      : mode === "add"
                        ? "Ajouter le produit"
                        : "Enregistrer"
                  }
                  onCancel={handleBackToList}
                  onSubmit={mode === "add" ? handleAdd : handleUpdate}
                  showOldPrice={mode === "edit"}
                />
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}

export default AdminDashboard;
