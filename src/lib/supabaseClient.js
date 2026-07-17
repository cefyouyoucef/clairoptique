import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (isSupabaseConfigured && import.meta.env.DEV) {
  console.info("Supabase project URL:", supabaseUrl);
}

if (!isSupabaseConfigured && import.meta.env.DEV) {
  console.error(
    "Supabase configuration is missing. Define VITE_SUPABASE_URL and " +
      "VITE_SUPABASE_ANON_KEY in the Vite environment."
  );
}

async function diagnosticFetch(input, init) {
  const requestUrl = typeof input === "string" ? input : input.url;
  const isOrdersRequest = requestUrl.includes("/rest/v1/orders");

  if (import.meta.env.DEV && isOrdersRequest) {
    console.log(
      "SUPABASE_ORDER_REQUEST:",
      JSON.stringify({
        url: requestUrl,
        method: init?.method || "GET",
        payload: init?.body ? JSON.parse(init.body) : null,
      })
    );
  }

  const response = await globalThis.fetch(input, init);

  if (import.meta.env.DEV && isOrdersRequest) {
    const responseBody = await response.clone().text();

    console.log(
      "SUPABASE_ORDER_RESPONSE:",
      JSON.stringify({
        url: requestUrl,
        status: response.status,
        ok: response.ok,
        body: responseBody,
      })
    );
  }

  return response;
}

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      global: { fetch: diagnosticFetch },
    })
  : null;
