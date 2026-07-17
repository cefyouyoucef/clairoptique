import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { getProducts } from "../utils/productStorage.js";

const ProductsContext = createContext(null);

export function ProductsProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [productsStatus, setProductsStatus] = useState("loading");
  const [productsError, setProductsError] = useState("");

  const refreshProducts = useCallback(async () => {
    try {
      setProductsStatus("loading");
      setProductsError("");

      const nextProducts = await getProducts();
      setProducts(nextProducts);
      setProductsStatus("success");
    } catch {
      setProductsError("collections.loadError");
      setProductsStatus("error");
    }
  }, []);

  useEffect(() => {
    refreshProducts();
    window.addEventListener("storage", refreshProducts);
    window.addEventListener("clairoptique-products-changed", refreshProducts);

    return () => {
      window.removeEventListener("storage", refreshProducts);
      window.removeEventListener("clairoptique-products-changed", refreshProducts);
    };
  }, [refreshProducts]);

  const contextValue = useMemo(
    () => ({
      products,
      productsError,
      productsStatus,
      refreshProducts,
    }),
    [products, productsError, productsStatus, refreshProducts]
  );

  return (
    <ProductsContext.Provider value={contextValue}>
      {children}
    </ProductsContext.Provider>
  );
}

export function useProducts() {
  const context = useContext(ProductsContext);

  if (!context) {
    throw new Error("useProducts must be used inside ProductsProvider.");
  }

  return context;
}
