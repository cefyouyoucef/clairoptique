import { useLanguage } from "../context/LanguageContext.jsx";

const WHATSAPP_PHONE = "213553924630";

export default function Contact() {
  const { t } = useLanguage();
  const whatsappContactMessage = encodeURIComponent(
    t("contact.whatsappMessage")
  );

  return (
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
              href={`https://wa.me/${WHATSAPP_PHONE}?text=${whatsappContactMessage}`}
              target="_blank"
              rel="noreferrer"
            >
              <span aria-hidden="true">✆</span>
              {t("contact.whatsappButton")}
            </a>
          </div>

          <div className="contact-item">
            <span>{t("contact.address")}</span>
            <strong>{t("contact.addressValue")}</strong>
          </div>

          <div className="contact-item">
            <span>{t("contact.hours")}</span>
            <strong>{t("contact.hoursValue")}</strong>
          </div>

          <p className="contact-note">{t("contact.note")}</p>
        </div>
      </div>
    </section>
  );
}
