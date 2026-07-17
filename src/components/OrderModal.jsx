import { useEffect, useRef, useState } from "react";
import { useLanguage } from "../context/LanguageContext.jsx";
import { getLocalizedProductName } from "../i18n/translations.js";
import { createOrder } from "../utils/orderStorage.js";
import {
  formatPrice,
  getProductImagePath,
} from "../utils/productPresentation.js";

const ALGERIAN_WILAYAS = [
  "01 - Adrar",
  "02 - Chlef",
  "03 - Laghouat",
  "04 - Oum El Bouaghi",
  "05 - Batna",
  "06 - Béjaïa",
  "07 - Biskra",
  "08 - Béchar",
  "09 - Blida",
  "10 - Bouira",
  "11 - Tamanrasset",
  "12 - Tébessa",
  "13 - Tlemcen",
  "14 - Tiaret",
  "15 - Tizi Ouzou",
  "16 - Alger",
  "17 - Djelfa",
  "18 - Jijel",
  "19 - Sétif",
  "20 - Saïda",
  "21 - Skikda",
  "22 - Sidi Bel Abbès",
  "23 - Annaba",
  "24 - Guelma",
  "25 - Constantine",
  "26 - Médéa",
  "27 - Mostaganem",
  "28 - M'Sila",
  "29 - Mascara",
  "30 - Ouargla",
  "31 - Oran",
  "32 - El Bayadh",
  "33 - Illizi",
  "34 - Bordj Bou Arréridj",
  "35 - Boumerdès",
  "36 - El Tarf",
  "37 - Tindouf",
  "38 - Tissemsilt",
  "39 - El Oued",
  "40 - Khenchela",
  "41 - Souk Ahras",
  "42 - Tipaza",
  "43 - Mila",
  "44 - Aïn Defla",
  "45 - Naâma",
  "46 - Aïn Témouchent",
  "47 - Ghardaïa",
  "48 - Relizane",
  "49 - Timimoun",
  "50 - Bordj Badji Mokhtar",
  "51 - Ouled Djellal",
  "52 - Béni Abbès",
  "53 - In Salah",
  "54 - In Guezzam",
  "55 - Touggourt",
  "56 - Djanet",
  "57 - El M'Ghair",
  "58 - El Meniaa",
];

const INITIAL_VALUES = {
  customerName: "",
  phone: "",
  wilaya: "",
  address: "",
  note: "",
};

const VALIDATED_FIELDS = [
  "customerName",
  "phone",
  "wilaya",
  "quantity",
  "address",
];

function normalizeAlgerianPhone(value) {
  const phone = String(value || "").replace(/\s/g, "");

  if (/^\+213[567]\d{8}$/.test(phone)) {
    return `0${phone.slice(4)}`;
  }

  return phone;
}

function getFieldErrors(values, quantity) {
  const phone = String(values.phone || "").replace(/\s/g, "");

  const isValidPhone =
    /^0[567]\d{8}$/.test(phone) ||
    /^\+213[567]\d{8}$/.test(phone);

  return {
    customerName:
      values.customerName.trim().length >= 2
        ? ""
        : "order.invalidName",

    phone: !String(values.phone || "").trim()
      ? "order.phoneRequired"
      : isValidPhone
        ? ""
        : "order.invalidPhone",

    wilaya: values.wilaya
      ? ""
      : "order.wilayaRequired",

    quantity:
      Number.isInteger(Number(quantity)) &&
      Number(quantity) >= 1 &&
      Number(quantity) <= 99
        ? ""
        : "order.invalidQuantity",

    address: values.address.trim()
      ? ""
      : "order.addressRequired",
  };
}

function OrderModal({ isOpen, onClose, product }) {
  const { language, t } = useLanguage();
  const nameInputRef = useRef(null);
  const onCloseRef = useRef(onClose);
  const isSubmittingRef = useRef(false);
  const [values, setValues] = useState(INITIAL_VALUES);
  const [quantity, setQuantity] = useState("1");
  const [touched, setTouched] = useState({});
  const [submitStatus, setSubmitStatus] = useState("idle");
  const [submitErrorKey, setSubmitErrorKey] = useState("");

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return undefined;

    setValues(INITIAL_VALUES);
    setQuantity("1");
    setTouched({});
    setSubmitStatus("idle");
    setSubmitErrorKey("");
    isSubmittingRef.current = false;
    document.body.classList.add("order-dialog-open");
    window.requestAnimationFrame(() => nameInputRef.current?.focus());

    function handleEscape(event) {
      if (event.key === "Escape") {
        onCloseRef.current();
      }
    }

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.body.classList.remove("order-dialog-open");
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, product?.id]);

  if (!isOpen || !product) return null;

  const displayedName = getLocalizedProductName(product, language);
  const imagePath = getProductImagePath(product);
  const quantityNumber = Math.min(
    99,
    Math.max(1, Math.trunc(Number(quantity) || 1))
  );
  const totalPrice = Number(product.price || 0) * quantityNumber;
  const fieldErrors = getFieldErrors(values, quantity);

  function updateValue(event) {
    const { name, value } = event.target;
    setValues((currentValues) => ({ ...currentValues, [name]: value }));
  }

  function markTouched(event) {
    const { name } = event.target;
    setTouched((currentTouched) => ({ ...currentTouched, [name]: true }));
  }

  function fieldHasError(fieldName) {
    return Boolean(touched[fieldName] && fieldErrors[fieldName]);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (isSubmittingRef.current) return;

    setTouched(
      VALIDATED_FIELDS.reduce(
        (nextTouched, fieldName) => ({
          ...nextTouched,
          [fieldName]: true,
        }),
        {}
      )
    );

    if (Object.values(fieldErrors).some(Boolean)) return;

    try {
      isSubmittingRef.current = true;
      setSubmitStatus("submitting");
      setSubmitErrorKey("");

      console.log("ORDER_STEP: before createOrder");

      const createdOrder = await createOrder({
        product,
        quantity: quantityNumber,
        customerName: values.customerName.trim(),
        phone: normalizeAlgerianPhone(values.phone),
        wilaya: values.wilaya,
        address: values.address.trim(),
        note: values.note.trim(),
      });

      console.log("ORDER_STEP: after createOrder", createdOrder);
      console.log("Order inserted successfully:", createdOrder);

      setSubmitErrorKey("");
      setSubmitStatus("success");
    } catch (error) {
      console.error("Order submission failed after insert:", {
        error,
        name: error?.name,
        message: error?.message,
        stack: error?.stack,
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
      });

      setSubmitErrorKey("order.submitError");
      setSubmitStatus("error");
    } finally {
      isSubmittingRef.current = false;
    }
  }

  function renderFieldError(fieldName) {
    if (!fieldHasError(fieldName)) return null;

    return (
      <span className="order-field-error" id={`order-${fieldName}-error`}>
        {t(fieldErrors[fieldName])}
      </span>
    );
  }

  return (
    <div
      className="order-modal-overlay"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section
        className="order-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-modal-title"
        onMouseDown={(event) => {
          event.stopPropagation();
        }}
      >
        <div className="order-modal-header">
          <div>
            <p className="eyebrow">Clair'Optique</p>
            <h2 id="order-modal-title">{t("order.title")}</h2>
          </div>
          <button
            className="order-modal-close"
            type="button"
            aria-label={t("order.close")}
            onClick={onClose}
          >
            ×
          </button>
        </div>

        {submitStatus === "success" ? (
          <div className="order-success" role="status">
            <span aria-hidden="true">✓</span>
            <h3>{t("order.successTitle")}</h3>
            <p>{t("order.successText")}</p>
            <button className="btn btn-primary" type="button" onClick={onClose}>
              {t("common.close")}
            </button>
          </div>
        ) : (
          <form className="order-form" noValidate onSubmit={handleSubmit}>
            <div className="order-form-content">
              <div className="order-product-summary">
                {imagePath ? <img src={imagePath} alt="" /> : null}
                <div>
                  <strong>{displayedName}</strong>
                  <span>{formatPrice(product.price)}</span>
                </div>
              </div>

              <div className="order-form-grid">
                <label
                  className={fieldHasError("customerName") ? "has-error" : ""}
                >
                  <span>{t("order.customerName")}</span>
                  <input
                    ref={nameInputRef}
                    name="customerName"
                    type="text"
                    autoComplete="name"
                    maxLength={120}
                    value={values.customerName}
                    aria-invalid={fieldHasError("customerName")}
                    aria-describedby={
                      fieldHasError("customerName")
                        ? "order-customerName-error"
                        : undefined
                    }
                    onChange={updateValue}
                    onBlur={markTouched}
                  />
                  {renderFieldError("customerName")}
                </label>

                <label className={fieldHasError("phone") ? "has-error" : ""}>
                  <span>{t("order.phone")}</span>
                  <input
                    name="phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    maxLength={20}
                    value={values.phone}
                    aria-invalid={fieldHasError("phone")}
                    aria-describedby={
                      fieldHasError("phone") ? "order-phone-error" : undefined
                    }
                    onChange={updateValue}
                    onBlur={markTouched}
                  />
                  {renderFieldError("phone")}
                </label>

                <label className={fieldHasError("wilaya") ? "has-error" : ""}>
                  <span>{t("order.wilaya")}</span>
                  <select
                    name="wilaya"
                    value={values.wilaya}
                    aria-invalid={fieldHasError("wilaya")}
                    aria-describedby={
                      fieldHasError("wilaya") ? "order-wilaya-error" : undefined
                    }
                    onChange={updateValue}
                    onBlur={markTouched}
                  >
                    <option value="">{t("order.selectWilaya")}</option>
                    {ALGERIAN_WILAYAS.map((wilaya) => (
                      <option value={wilaya} key={wilaya}>
                        {wilaya}
                      </option>
                    ))}
                  </select>
                  {renderFieldError("wilaya")}
                </label>

                <label
                  className={fieldHasError("quantity") ? "has-error" : ""}
                >
                  <span>{t("order.quantity")}</span>
                  <input
                    name="quantity"
                    type="number"
                    min="1"
                    max="99"
                    value={quantity}
                    aria-invalid={fieldHasError("quantity")}
                    aria-describedby={
                      fieldHasError("quantity")
                        ? "order-quantity-error"
                        : undefined
                    }
                    onChange={(event) => setQuantity(event.target.value)}
                    onBlur={markTouched}
                  />
                  {renderFieldError("quantity")}
                </label>

                <label
                  className={`order-form-full ${
                    fieldHasError("address") ? "has-error" : ""
                  }`}
                >
                  <span>{t("order.address")}</span>
                  <input
                    name="address"
                    type="text"
                    autoComplete="street-address"
                    maxLength={240}
                    value={values.address}
                    aria-invalid={fieldHasError("address")}
                    aria-describedby={
                      fieldHasError("address")
                        ? "order-address-error"
                        : undefined
                    }
                    onChange={updateValue}
                    onBlur={markTouched}
                  />
                  {renderFieldError("address")}
                </label>

                <label className="order-form-full">
                  <span>{t("order.note")}</span>
                  <textarea
                    name="note"
                    rows="3"
                    maxLength={500}
                    value={values.note}
                    onChange={updateValue}
                  />
                </label>
              </div>
            </div>

            <div className="order-modal-footer">
              <div className="order-total-row">
                <span>{t("order.total")}</span>
                <strong>{formatPrice(totalPrice)}</strong>
              </div>

              {submitErrorKey ? (
                <p className="order-form-error" role="alert">
                  {t(submitErrorKey)}
                </p>
              ) : null}

              <button
                className="btn btn-primary order-submit-button"
                type="submit"
                disabled={submitStatus === "submitting"}
              >
                {submitStatus === "submitting"
                  ? t("order.submitting")
                  : t("order.submit")}
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}

export default OrderModal;
