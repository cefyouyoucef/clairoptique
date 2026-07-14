import { useEffect, useState } from "react";
import { useLanguage } from "../context/LanguageContext.jsx";

const WHATSAPP_NUMBER = "213553924630";
const contactLensKeys = ["daily", "monthly", "colored", "toric"];
const adviceKeys = ["prescription", "duration", "comfort", "hygiene"];

function Lentilles() {
  const { t } = useLanguage();
  const [selectedLensKey, setSelectedLensKey] = useState(null);
  const selectedLens = selectedLensKey
    ? {
        title: t(`contactLenses.${selectedLensKey}.title`),
        detail: t(`contactLenses.${selectedLensKey}.detail`),
      }
    : null;

  function getWhatsAppLink(message) {
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  }

  useEffect(() => {
    function handleEscape(event) {
      if (event.key === "Escape") {
        setSelectedLensKey(null);
      }
    }

    if (selectedLensKey) {
      window.addEventListener("keydown", handleEscape);
    }

    return () => window.removeEventListener("keydown", handleEscape);
  }, [selectedLensKey]);

  return (
    <section className="section page-section lenses-page contact-lenses-page">
      <div className="container">
        <div className="page-heading">
          <p className="eyebrow">{t("contactLenses.eyebrow")}</p>
          <h1>{t("contactLenses.title")}</h1>
          <p>{t("contactLenses.intro")}</p>
          <p>{t("contactLenses.professionalAdvice")}</p>
        </div>

        <div className="info-card-grid lenses-grid contact-lenses-grid">
          {contactLensKeys.map((lensKey) => {
            const title = t(`contactLenses.${lensKey}.title`);

            return (
              <article className="info-card lens-card contact-lens-card" key={lensKey}>
                <img
                  src="/images/logo.png"
                  alt="Clair'Optique"
                  className="verres-card-logo"
                />
                <h2>{title}</h2>
                <p>{t(`contactLenses.${lensKey}.text`)}</p>
                <div className="card-actions contact-lens-actions">
                  <button
                    className="btn btn-secondary"
                    type="button"
                    onClick={() => setSelectedLensKey(lensKey)}
                  >
                    {t("contactLenses.viewDetails")}
                  </button>
                  <a
                    className="btn btn-primary"
                    href={getWhatsAppLink(
                      t("contactLenses.orderMessage", { type: title })
                    )}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {t("contactLenses.orderWhatsApp")}
                  </a>
                </div>
              </article>
            );
          })}
        </div>

        <section
          className="lenses-choice-section"
          aria-labelledby="contact-lens-choice-title"
        >
          <div className="section-heading">
            <p className="eyebrow">{t("contactLenses.adviceEyebrow")}</p>
            <h2 id="contact-lens-choice-title">{t("contactLenses.choiceTitle")}</h2>
            <p>{t("contactLenses.choiceIntro")}</p>
          </div>

          <div className="choice-grid contact-lenses-advice-grid">
            {adviceKeys.map((adviceKey) => (
              <article className="choice-card" key={adviceKey}>
                <p className="choice-label">
                  {t(`contactLenses.advice.${adviceKey}.label`)}
                </p>
                <h3>{t(`contactLenses.advice.${adviceKey}.title`)}</h3>
                <p>{t(`contactLenses.advice.${adviceKey}.text`)}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="lenses-cta" aria-labelledby="contact-lens-advice-title">
          <div>
            <p className="eyebrow">{t("contactLenses.whatsappEyebrow")}</p>
            <h2 id="contact-lens-advice-title">{t("contactLenses.ctaTitle")}</h2>
            <p>{t("contactLenses.ctaText")}</p>
          </div>
          <a
            className="btn btn-primary"
            href={getWhatsAppLink(t("contactLenses.adviceMessage"))}
            target="_blank"
            rel="noreferrer"
          >
            {t("contactLenses.ctaButton")}
          </a>
        </section>
      </div>

      {selectedLens ? (
        <div
          className="lens-modal-backdrop"
          role="presentation"
          onClick={() => setSelectedLensKey(null)}
        >
          <section
            className="lens-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="contact-lens-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="lens-modal-close"
              type="button"
              aria-label={t("contactLenses.closeDetails")}
              onClick={() => setSelectedLensKey(null)}
            >
              ×
            </button>
            <p className="eyebrow">{t("contactLenses.detailsEyebrow")}</p>
            <h2 id="contact-lens-modal-title">{selectedLens.title}</h2>
            <p className="contact-lens-modal-text">{selectedLens.detail}</p>
          </section>
        </div>
      ) : null}
    </section>
  );
}

export default Lentilles;
