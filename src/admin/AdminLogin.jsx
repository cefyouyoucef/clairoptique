import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { isSupabaseConfigured, supabase } from "../lib/supabaseClient.js";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!isSupabaseConfigured || !supabase) {
      setError("Supabase n'est pas configuré.");
      return;
    }

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");

    try {
      setIsSubmitting(true);

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      navigate("/admin");
    } catch (signInError) {
      console.error("Admin login error:", signInError);
      setError("Email ou mot de passe incorrect.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="section page-section">
      <div className="container admin-login-wrap">
        <div className="admin-login-card">
          <div className="page-heading">
            <p className="eyebrow">Administration</p>
            <h1>Connexion admin</h1>
            <p>Connectez-vous pour gérer les produits Clair'Optique.</p>
          </div>

          <form className="admin-form" onSubmit={handleSubmit}>
            <label>
              <span>Email</span>
              <input
                name="email"
                required
                type="email"
                autoComplete="email"
                disabled={isSubmitting}
              />
            </label>

            <label>
              <span>Mot de passe</span>
              <input
                name="password"
                required
                type="password"
                autoComplete="current-password"
                disabled={isSubmitting}
              />
            </label>

            {error ? <p className="admin-error">{error}</p> : null}

            <button className="btn btn-primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Connexion..." : "Se connecter"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
