import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { WHATSAPP_NUMBER } from "../config/contact.js";
import { useLanguage } from "../context/LanguageContext.jsx";

const APPLE_MAPS_URL =
  "https://maps.apple.com/place?map=explore&coordinate=36.261507%2C2.759263&name=Clair%27Optique";
const GOOGLE_MAPS_URL =
  "https://www.google.com/maps/search/?api=1&query=36.261507%2C2.759263";

export default function Contact() {
  const { t } = useLanguage();
  const [isLocationChoiceOpen, setIsLocationChoiceOpen] = useState(false);
  const whatsappContactMessage = encodeURIComponent(
    t("contact.whatsappMessage")
  );

  useEffect(() => {
    if (!isLocationChoiceOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function closeOnEscape(event) {
      if (event.key === "Escape") {
        setIsLocationChoiceOpen(false);
      }
    }

    window.addEventListener("keydown", closeOnEscape);

    return () => {
      window.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = previousOverflow;
    };
  }, [isLocationChoiceOpen]);

  const locationDialog = isLocationChoiceOpen
    ? createPortal(
        <div
          className="location-choice-backdrop"
          role="presentation"
          onClick={() => setIsLocationChoiceOpen(false)}
        >
          <div
            className="location-choice-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="location-choice-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="location-choice-header">
              <h2 id="location-choice-title">{t("contact.viewLocation")}</h2>
              <button
                className="location-choice-close"
                type="button"
                aria-label={t("common.close")}
                onClick={() => setIsLocationChoiceOpen(false)}
                autoFocus
              >
                ×
              </button>
            </div>

            <div className="location-choice-actions">
              <a
                className="btn btn-secondary"
                href={APPLE_MAPS_URL}
                target="_blank"
                rel="noreferrer"
                onClick={() => setIsLocationChoiceOpen(false)}
              >
                {t("contact.openAppleMaps")}
              </a>
              <a
                className="btn btn-primary"
                href={GOOGLE_MAPS_URL}
                target="_blank"
                rel="noreferrer"
                onClick={() => setIsLocationChoiceOpen(false)}
              >
                {t("contact.openGoogleMaps")}
              </a>
            </div>
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <>
      <section className="section page-section contact-page">
        <div className="container contact-grid">
          <div className="page-heading contact-heading">
            <p className="eyebrow">{t("contact.eyebrow")}</p>
            <h1>{t("contact.title")}</h1>
            <p>{t("contact.intro")}</p>
          </div>

          <div className="contact-panel">
            <div className="contact-item">
              <span>{t("contact.phone")}</span>
              <strong dir="ltr">0553924630</strong>
            </div>

            <div className="contact-item">
              <span>{t("contact.whatsapp")}</span>
              <a
                className="btn btn-primary"
                href={`https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappContactMessage}`}
                target="_blank"
                rel="noreferrer"
              >
                <span aria-hidden="true">✆</span>
                {t("contact.whatsappButton")}
              </a>
            </div>

            <div className="contact-item">
              <button
                className="location-link-compact"
                type="button"
                onClick={() => setIsLocationChoiceOpen(true)}
              >
                <span className="location-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24">
                    <path
                      d="M12 21s7-5.35 7-12a7 7 0 1 0-14 0c0 6.65 7 12 7 12Z"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <circle
                      cx="12"
                      cy="9"
                      r="2.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                  </svg>
                </span>

                <span>{t("contact.addressTitle")}</span>
              </button>
            </div>

            <div className="contact-item">
              <span>{t("contact.hours")}</span>
              <strong>{t("contact.hoursValue")}</strong>
            </div>

            <p className="contact-note">{t("contact.note")}</p>
          </div>
        </div>
      </section>

      {locationDialog}
    </>
  );
}
