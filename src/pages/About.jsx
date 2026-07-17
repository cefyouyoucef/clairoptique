import { WHATSAPP_NUMBER } from "../config/contact.js";
import { useLanguage } from "../context/LanguageContext.jsx";

const aboutCardKeys = ["advice", "quality", "speed"];
const serviceKeys = [
  "optical",
  "sunglasses",
  "corrective",
  "antireflective",
  "progressive",
  "advice",
];

export default function About() {
  const { t } = useLanguage();
  const whatsappContactLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    t("contact.whatsappMessage")
  )}`;

  return (
    <section className="section page-section about-page">
      <div className="container">
        <div className="about-layout">
          <div className="page-heading about-intro">
            <p className="eyebrow">{t("about.eyebrow")}</p>
            <h1>{t("about.title")}</h1>
            <p>{t("about.intro")}</p>
          </div>

          <aside className="about-panel about-highlight">
            <img
              className="about-panel-logo"
              src="/images/logo.png"
              alt="Clair'Optique"
            />
            <h2>{t("about.panelTitle")}</h2>
            <p>{t("about.panelText")}</p>
          </aside>
        </div>

        <section
          className="about-section about-story"
          aria-labelledby="about-story-title"
        >
          <div className="section-heading">
            <p className="eyebrow">{t("about.shopEyebrow")}</p>
            <h2 id="about-story-title">{t("about.storyTitle")}</h2>
          </div>

          <div className="about-story-card">
            <p>{t("about.story1")}</p>
            <p>{t("about.story2")}</p>
          </div>
        </section>

        <section
          className="about-section about-commitments"
          aria-labelledby="about-commitments-title"
        >
          <div className="section-heading">
            <p className="eyebrow">{t("about.approachEyebrow")}</p>
            <h2 id="about-commitments-title">{t("about.approachTitle")}</h2>
          </div>

          <div
            className="about-card-grid"
            aria-label={t("about.commitmentsLabel")}
          >
            {aboutCardKeys.map((cardKey) => (
              <article className="about-value-card" key={cardKey}>
                <span className="check-icon" aria-hidden="true">
                  ✓
                </span>
                <h3>{t(`about.card.${cardKey}.title`)}</h3>
                <p>{t(`about.card.${cardKey}.text`)}</p>
              </article>
            ))}
          </div>
        </section>

        <section
          className="about-section about-services"
          aria-labelledby="about-services-title"
        >
          <div className="section-heading">
            <p className="eyebrow">{t("about.servicesEyebrow")}</p>
            <h2 id="about-services-title">{t("about.servicesTitle")}</h2>
          </div>

          <div className="about-services-grid">
            {serviceKeys.map((serviceKey) => (
              <article className="about-service-item" key={serviceKey}>
                <span className="check-icon" aria-hidden="true">
                  ✓
                </span>
                <p>{t(`about.service.${serviceKey}`)}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="about-section about-cta">
          <div className="about-cta-card">
            <div>
              <p className="eyebrow">{t("about.ctaEyebrow")}</p>
              <h2>{t("about.ctaTitle")}</h2>
              <p>{t("about.ctaText")}</p>
            </div>

            <a
              className="btn btn-primary"
              href={whatsappContactLink}
              target="_blank"
              rel="noreferrer"
            >
              {t("about.ctaButton")}
            </a>
          </div>
        </section>
      </div>
    </section>
  );
}
