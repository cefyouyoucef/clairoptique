import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { LanguageProvider } from "./context/LanguageContext.jsx";
import { ProductsProvider } from "./context/ProductsContext.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <LanguageProvider>
      <BrowserRouter>
        <ProductsProvider>
          <App />
        </ProductsProvider>
      </BrowserRouter>
    </LanguageProvider>
  </React.StrictMode>,
);
