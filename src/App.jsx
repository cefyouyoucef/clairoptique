import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import PageTransition from "./components/PageTransition.jsx";
import ScrollToTop from "./components/ScrollToTop.jsx";
import WelcomeSplash from "./components/WelcomeSplash.jsx";
import { isSupabaseConfigured, supabase } from "./lib/supabaseClient.js";
import Home from "./pages/Home.jsx";
import Products from "./pages/Products.jsx";
import ProductDetails from "./pages/ProductDetails.jsx";
import Verres from "./pages/Verres.jsx";
import Lentilles from "./pages/Lentilles.jsx";
import About from "./pages/About.jsx";
import Contact from "./pages/Contact.jsx";
import AdminDashboard from "./admin/AdminDashboard.jsx";
import AdminLogin from "./admin/AdminLogin.jsx";

const ADMIN_EMAIL = "admin@clairoptique.com";

function RequireAdmin({ children }) {
  const [authStatus, setAuthStatus] = useState("loading");

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setAuthStatus("unauthenticated");
      return undefined;
    }

    let isMounted = true;

    supabase.auth.getUser().then(({ data, error }) => {
      if (!isMounted) return;

      setAuthStatus(
        error || data.user?.email !== ADMIN_EMAIL ? "unauthenticated" : "authenticated"
      );
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthStatus(
        session?.user?.email === ADMIN_EMAIL ? "authenticated" : "unauthenticated"
      );
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (authStatus === "loading") {
    return (
      <div className="empty-state">
        <p>Vérification de la session admin...</p>
      </div>
    );
  }

  return authStatus === "authenticated" ? children : <Navigate to="/admin-login" replace />;
}

function App() {
  const location = useLocation();

  return (
    <div className="app-shell">
      <WelcomeSplash />
      <ScrollToTop />
      <Navbar />
      <main>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route
              path="/"
              element={
                <PageTransition>
                  <Home />
                </PageTransition>
              }
            />
            <Route
              path="/products"
              element={
                <PageTransition>
                  <Products />
                </PageTransition>
              }
            />
            <Route
              path="/products/:id"
              element={
                <PageTransition>
                  <ProductDetails />
                </PageTransition>
              }
            />
            <Route
              path="/verres"
              element={
                <PageTransition>
                  <Verres />
                </PageTransition>
              }
            />
            <Route
              path="/lentilles"
              element={
                <PageTransition>
                  <Lentilles />
                </PageTransition>
              }
            />
            <Route
              path="/about"
              element={
                <PageTransition>
                  <About />
                </PageTransition>
              }
            />
            <Route
              path="/contact"
              element={
                <PageTransition>
                  <Contact />
                </PageTransition>
              }
            />
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route
              path="/admin"
              element={
                <RequireAdmin>
                  <AdminDashboard />
                </RequireAdmin>
              }
            />
          </Routes>
        </AnimatePresence>
      </main>
    </div>
  );
}

export default App;
