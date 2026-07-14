import { useEffect, useState } from "react";
import { useLanguage } from "../context/LanguageContext.jsx";

const WELCOME_SPLASH_STORAGE_KEY = "clairOptiqueWelcomeSplashShown";

export default function WelcomeSplash() {
  const { t } = useLanguage();
  const [isVisible, setIsVisible] = useState(() => {
    const shouldTestWelcome =
      new URLSearchParams(window.location.search).get("test-welcome") === "1";

    if (shouldTestWelcome) {
      sessionStorage.removeItem(WELCOME_SPLASH_STORAGE_KEY);
      return true;
    }

    return sessionStorage.getItem(WELCOME_SPLASH_STORAGE_KEY) !== "true";
  });

  useEffect(() => {
    if (!isVisible) {
      return;
    }

    sessionStorage.setItem(WELCOME_SPLASH_STORAGE_KEY, "true");

    const timer = window.setTimeout(() => {
      setIsVisible(false);
    }, 2500);

    return () => window.clearTimeout(timer);
  }, [isVisible]);

  if (!isVisible) {
    return null;
  }

  return (
    <div className="welcome-splash" role="status" aria-live="polite">
      <div className="welcome-splash-card">
        <img src="/images/logo.png" alt="Clair'Optique" />
        <h1>Clair'Optique</h1>
        <p>{t("welcome.message")}</p>
        <span>{t("welcome.subtitle")}</span>
      </div>
    </div>
  );
}
