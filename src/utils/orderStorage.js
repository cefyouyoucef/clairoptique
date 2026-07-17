import { isSupabaseConfigured, supabase } from "../lib/supabaseClient.js";

export const ORDER_STATUSES = [
  "nouvelle",
  "confirmee",
  "en_preparation",
  "expediee",
  "livree",
  "annulee",
];

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(value || "")
  );
}

function cleanText(value) {
  const text = String(value || "").trim();
  return text || null;
}

function createOrderId() {
  if (!globalThis.crypto?.randomUUID) {
    throw new Error("Secure UUID generation is not available.");
  }

  return globalThis.crypto.randomUUID();
}

function requireSupabase() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error("Supabase is not configured.");
  }
}

function usesLegacyOrdersSchema(error) {
  if (error?.code !== "PGRST204") return false;

  const message = String(error.message || "");
  return (
    message.includes("'product_image_url' column") ||
    message.includes("'unit_price' column")
  );
}

async function insertOrder(orderPayload) {
  requireSupabase();

  if (import.meta.env.DEV) {
    console.log("ORDER_INSERT_PAYLOAD:", JSON.stringify(orderPayload));
  }

  let { error } = await supabase.from("orders").insert([orderPayload]);

  if (import.meta.env.DEV) {
    console.log(
      "ORDER_INSERT_RESULT:",
      JSON.stringify({
        id: orderPayload.id,
        error,
        code: error?.code,
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
      })
    );
  }

  if (error && usesLegacyOrdersSchema(error)) {
    const {
      product_image_url: _productImageUrl,
      unit_price: _unitPrice,
      ...legacyOrderPayload
    } = orderPayload;

    if (import.meta.env.DEV) {
      console.warn(
        "The deployed orders table is missing snapshot columns. " +
          "Apply supabase-orders.sql to upgrade it."
      );
    }

    ({ error } = await supabase.from("orders").insert([legacyOrderPayload]));
  }

  if (error) throw error;
  return orderPayload;
}

export async function createOrder({
  product,
  quantity,
  customerName,
  phone,
  wilaya,
  address,
  note,
}) {
  requireSupabase();

  const normalizedQuantity = Math.max(1, Math.trunc(Number(quantity) || 1));
  const unitPrice = Math.max(0, Math.trunc(Number(product?.price) || 0));
  const productImageUrl =
    product?.image_url ||
    product?.imageUrl ||
    product?.image ||
    product?.images?.[0] ||
    null;

  const orderPayload = {
    id: createOrderId(),
    product_id: isUuid(product?.id) ? product.id : null,
    product_name: String(product?.name || "").trim(),
    product_image_url: cleanText(productImageUrl),
    unit_price: unitPrice,
    quantity: normalizedQuantity,
    total_price: unitPrice * normalizedQuantity,
    customer_name: String(customerName || "").trim(),
    phone: String(phone || "").trim(),
    wilaya: cleanText(wilaya),
    address: cleanText(address),
    note: cleanText(note),
    status: "nouvelle",
  };

  return insertOrder(orderPayload);
}

export async function getOrders() {
  requireSupabase();

  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function updateOrderStatus(id, status) {
  requireSupabase();

  if (!ORDER_STATUSES.includes(status)) {
    throw new Error("Invalid order status.");
  }

  const { error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", id);

  if (error) throw error;
}
