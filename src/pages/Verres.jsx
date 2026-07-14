import { useEffect, useState } from "react";
import { useLanguage } from "../context/LanguageContext.jsx";

const lensCardKeys = [
  "corrective",
  "antireflective",
  "solar",
  "progressive",
  "photochromic",
  "bluelight",
];

const choicePointKeys = ["prescription", "usage", "budget"];

function getLensCard(t, key) {
  return {
    key,
    title: t(`lenses.${key}.title`),
    text: t(`lenses.${key}.text`),
    details: [1, 2, 3, 4].map((index) =>
      t(`lenses.${key}.detail${index}`)
    ),
  };
}

function Verres() {
  const { t } = useLanguage();
  const [selectedLensKey, setSelectedLensKey] = useState(null);
  const lensCards = lensCardKeys.map((key) => getLensCard(t, key));
  const selectedLens = selectedLensKey
    ? getLensCard(t, selectedLensKey)
    : null;
  const whatsappAdviceLink = `https://wa.me/213559925559?text=${encodeURIComponent(
    t("lenses.whatsappMessage")
  )}`;

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
    <section className="section page-section lenses-page">
      <div className="container">
        <div className="page-heading">
          <p className="eyebrow">{t("lenses.eyebrow")}</p>
          <h1>{t("lenses.title")}</h1>
          <p>{t("lenses.intro")}</p>
        </div>

        <div className="info-card-grid lenses-grid">
          {lensCards.map((card) => (
            <article className="info-card lens-card" key={card.key}>
              <img
                src="/images/logo.png"
                alt="Clair'Optique"
                className="verres-card-logo"
              />
              <h2>{card.title}</h2>
              <p>{card.text}</p>
              <button
                className="lens-details-link"
                type="button"
                onClick={() => setSelectedLensKey(card.key)}
              >
                {t("lenses.viewDetails")}
              </button>
            </article>
          ))}
        </div>

        <section
          className="lenses-choice-section"
          aria-labelledby="lens-choice-title"
        >
          <div className="section-heading">
            <p className="eyebrow">{t("lenses.adviceEyebrow")}</p>
            <h2 id="lens-choice-title">{t("lenses.choiceTitle")}</h2>
            <p>{t("lenses.choiceIntro")}</p>
          </div>

          <div className="choice-grid">
            {choicePointKeys.map((pointKey) => (
              <article className="choice-card" key={pointKey}>
                <p className="choice-label">
                  {t(`lenses.choice.${pointKey}.label`)}
                </p>
                <h3>{t(`lenses.choice.${pointKey}.title`)}</h3>
                <p>{t(`lenses.choice.${pointKey}.text`)}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="lenses-cta" aria-labelledby="lens-advice-title">
          <div>
            <p className="eyebrow">{t("lenses.whatsappEyebrow")}</p>
            <h2 id="lens-advice-title">{t("lenses.ctaTitle")}</h2>
            <p>{t("lenses.ctaText")}</p>
          </div>
          <a
            className="btn btn-primary"
            href={whatsappAdviceLink}
            target="_blank"
            rel="noreferrer"
          >
            {t("lenses.ctaButton")}
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
            aria-labelledby="lens-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="lens-modal-close"
              type="button"
              aria-label={t("lenses.modalClose")}
              onClick={() => setSelectedLensKey(null)}
            >
              ×
            </button>
            <p className="eyebrow">{t("lenses.modalEyebrow")}</p>
            <h2 id="lens-modal-title">{selectedLens.title}</h2>
            <ul>
              {selectedLens.details.map((detail) => (
                <li key={detail}>{detail}</li>
              ))}
            </ul>
            <a
              className="btn btn-primary lens-modal-cta"
              href={whatsappAdviceLink}
              target="_blank"
              rel="noreferrer"
            >
              {t("lenses.modalButton")}
            </a>
          </section>
        </div>
      ) : null}
    </section>
  );
}

export default Verres;
