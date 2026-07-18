import { useEffect, useMemo, useRef, useState } from "react";
import { isSupabaseConfigured, supabase } from "../lib/supabaseClient.js";
import { formatPrice } from "../utils/productPresentation.js";
import {
  getOrders,
  ORDER_STATUSES,
  updateOrderStatus,
} from "../utils/orderStorage.js";

const ORDER_TABS = [
  { status: "nouvelle", label: "Nouvelles" },
  { status: "en_preparation", label: "En préparation" },
  { status: "expediee", label: "Expédiées" },
  { status: "livree", label: "Livrées" },
  { status: "annulee", label: "Annulées" },
];

const STATUS_TRANSITIONS = {
  nouvelle: ["nouvelle", "en_preparation", "annulee"],
  confirmee: ["confirmee", "en_preparation", "annulee"],
  en_preparation: ["en_preparation", "expediee", "annulee"],
  expediee: ["expediee", "livree", "annulee"],
  livree: ["livree", "annulee"],
  annulee: ["annulee"],
};

function getStatusLabel(status) {
  return {
    nouvelle: "Nouvelle",
    confirmee: "Confirmée",
    en_preparation: "En préparation",
    expediee: "Expédiée",
    livree: "Livrée",
    annulee: "Annulée",
  }[status] || status;
}

function getTabStatus(status) {
  return status === "confirmee" ? "en_preparation" : status;
}

function getAvailableStatuses(status) {
  const allowedStatuses = STATUS_TRANSITIONS[status] || [status, "annulee"];
  return ORDER_STATUSES.filter((value) => allowedStatuses.includes(value));
}

function formatOrderDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("fr-DZ", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [ordersStatus, setOrdersStatus] = useState("loading");
  const [ordersError, setOrdersError] = useState("");
  const [updatingOrderId, setUpdatingOrderId] = useState("");
  const [activeStatus, setActiveStatus] = useState("nouvelle");
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [newOrderToast, setNewOrderToast] = useState(null);

  const audioContextRef = useRef(null);
  const notificationsEnabledRef = useRef(false);
  const receivedOrderIdsRef = useRef(new Set());
  const toastTimeoutRef = useRef(null);

  async function loadOrders() {
    setOrdersStatus("loading");
    setOrdersError("");

    try {
      const nextOrders = await getOrders();
      for (const order of nextOrders) {
        receivedOrderIdsRef.current.add(order.id);
      }
      setOrders(nextOrders);
      setOrdersStatus("success");
    } catch (error) {
      console.error("Admin load orders error:", error);
      setOrdersError("Impossible de charger les commandes.");
      setOrdersStatus("error");
    }
  }

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return undefined;

    let isActive = true;
    let channel = null;
    let connectionLogged = false;

    async function subscribeToNewOrders() {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (!isActive || error || !session) return;

      channel = supabase
        .channel("admin-orders-inserts")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "orders" },
          (payload) => {
            const newOrder = payload.new;
            const orderId = newOrder?.id;
            if (!orderId || receivedOrderIdsRef.current.has(orderId)) return;

            receivedOrderIdsRef.current.add(orderId);
            setOrders((currentOrders) =>
              currentOrders.some((order) => order.id === orderId)
                ? currentOrders
                : [newOrder, ...currentOrders]
            );
            setOrdersStatus("success");

            const notificationContent = `${newOrder.customer_name || "Client"} — ${
              newOrder.product_name || "Produit"
            }`;
            setNewOrderToast({ id: orderId, content: notificationContent });

            if (toastTimeoutRef.current) {
              window.clearTimeout(toastTimeoutRef.current);
            }
            toastTimeoutRef.current = window.setTimeout(() => {
              setNewOrderToast(null);
              toastTimeoutRef.current = null;
            }, 5000);

            if (
              notificationsEnabledRef.current &&
              audioContextRef.current
            ) {
              try {
                const audioContext = audioContextRef.current;
                const oscillator = audioContext.createOscillator();
                const gain = audioContext.createGain();
                const now = audioContext.currentTime;

                oscillator.type = "sine";
                oscillator.frequency.setValueAtTime(880, now);
                gain.gain.setValueAtTime(0.0001, now);
                gain.gain.exponentialRampToValueAtTime(0.12, now + 0.01);
                gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);

                oscillator.connect(gain);
                gain.connect(audioContext.destination);
                oscillator.start(now);
                oscillator.stop(now + 0.21);
              } catch {
                // Optional audio notification may be blocked.
              }
            }

            if (
              notificationsEnabledRef.current &&
              "Notification" in window &&
              Notification.permission === "granted" &&
              (document.hidden || !document.hasFocus())
            ) {
              try {
                new Notification("Clair'Optique — Nouvelle commande", {
                  body: notificationContent,
                });
              } catch {
                // Native notification may be unavailable.
              }
            }

            if (import.meta.env.DEV) {
              console.log(`New order received: ${orderId}`);
            }
          }
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED" && !connectionLogged) {
            connectionLogged = true;
            if (import.meta.env.DEV) {
              console.log("Realtime orders channel connected");
            }
          }
        });
    }

    subscribeToNewOrders();

    return () => {
      isActive = false;
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        window.clearTimeout(toastTimeoutRef.current);
        toastTimeoutRef.current = null;
      }

      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
    };
  }, []);

  async function enableNotifications() {
    try {
      const AudioContextClass =
        window.AudioContext || window.webkitAudioContext;

      if (AudioContextClass && !audioContextRef.current) {
        audioContextRef.current = new AudioContextClass();
      }

      if (
        audioContextRef.current &&
        audioContextRef.current.state === "suspended"
      ) {
        await audioContextRef.current.resume();
      }
    } catch {
      // Optional audio activation may be blocked.
    }

    if ("Notification" in window) {
      try {
        await Notification.requestPermission();
      } catch {
        // Notification permission may be unavailable.
      }
    }

    notificationsEnabledRef.current = true;
    setNotificationsEnabled(true);
  }

  const orderCounts = useMemo(() => {
    const counts = Object.fromEntries(
      ORDER_TABS.map(({ status }) => [status, 0])
    );

    for (const order of orders) {
      const tabStatus = getTabStatus(order.status);

      if (Object.hasOwn(counts, tabStatus)) {
        counts[tabStatus] += 1;
      }
    }

    return counts;
  }, [orders]);

  const visibleOrders = useMemo(
    () => orders.filter((order) => getTabStatus(order.status) === activeStatus),
    [activeStatus, orders]
  );

  async function handleStatusChange(order, nextStatus) {
    const previousStatus = order.status;
    if (updatingOrderId || nextStatus === previousStatus) return;

    setUpdatingOrderId(order.id);
    setOrdersError("");
    setOrders((currentOrders) =>
      currentOrders.map((currentOrder) =>
        currentOrder.id === order.id
          ? { ...currentOrder, status: nextStatus }
          : currentOrder
      )
    );

    try {
      await updateOrderStatus(order.id, nextStatus);
    } catch (error) {
      console.error("Admin update order error:", error);
      setOrders((currentOrders) =>
        currentOrders.map((currentOrder) =>
          currentOrder.id === order.id
            ? { ...currentOrder, status: previousStatus }
            : currentOrder
        )
      );
      setOrdersError("Impossible de modifier le statut de la commande.");
    } finally {
      setUpdatingOrderId("");
    }
  }

  return (
    <div className="admin-orders-view">
      <div className="admin-order-tabs" role="tablist" aria-label="Statuts des commandes">
        {ORDER_TABS.map((tab) => (
          <button
            className={activeStatus === tab.status ? "active" : ""}
            type="button"
            role="tab"
            aria-selected={activeStatus === tab.status}
            onClick={() => setActiveStatus(tab.status)}
            key={tab.status}
          >
            <span>{tab.label}</span>
            <strong>{orderCounts[tab.status]}</strong>
          </button>
        ))}
      </div>

      <div className="admin-toolbar">
        <p>{visibleOrders.length} commande{visibleOrders.length === 1 ? "" : "s"}</p>
        <div className="admin-order-toolbar-actions">
          <button
            className={`admin-notification-button${notificationsEnabled ? " enabled" : ""}`}
            type="button"
            aria-pressed={notificationsEnabled}
            onClick={enableNotifications}
          >
            {notificationsEnabled ? "Notifications activées" : "Activer les notifications"}
          </button>
          <button className="btn btn-secondary" type="button" onClick={loadOrders}>
            Actualiser
          </button>
        </div>
      </div>

      <div className="admin-order-toast-container" aria-live="polite" aria-atomic="true">
        {newOrderToast ? (
          <div className="admin-order-toast" role="status" key={newOrderToast.id}>
            <strong>Nouvelle commande reçue</strong>
            <span>{newOrderToast.content}</span>
          </div>
        ) : null}
      </div>

      {ordersError ? <p className="admin-error">{ordersError}</p> : null}
      {ordersStatus === "loading" ? <div className="empty-state"><p>Chargement des commandes...</p></div> : null}
      {ordersStatus === "error" ? <div className="empty-state"><h2>Erreur</h2><p>Les commandes ne sont pas disponibles.</p></div> : null}
      {ordersStatus === "success" && visibleOrders.length === 0 ? <div className="empty-state"><h2>Aucune commande</h2><p>Aucune commande avec ce statut pour le moment.</p></div> : null}

      {ordersStatus === "success" && visibleOrders.length > 0 ? (
        <div className="admin-orders-list">
          {visibleOrders.map((order) => (
            <article className="admin-order-card" key={order.id}>
              <div className="admin-order-heading">
                <div>
                  <span className={`admin-order-status status-${order.status}`}>{getStatusLabel(order.status)}</span>
                  <h2>{order.product_name}</h2>
                  <p>{formatOrderDate(order.created_at)}</p>
                </div>
                <strong>{formatPrice(order.total_price)}</strong>
              </div>

              <div className="admin-order-body">
                {order.product_image_url ? <img src={order.product_image_url} alt="" /> : null}
                <dl>
                  <div><dt>Client</dt><dd>{order.customer_name}</dd></div>
                  <div><dt>Téléphone</dt><dd><a href={`tel:${order.phone}`}>{order.phone}</a></dd></div>
                  <div><dt>Produit</dt><dd>{order.product_name}</dd></div>
                  <div><dt>Quantité</dt><dd>{order.quantity}</dd></div>
                  <div><dt>Total</dt><dd>{formatPrice(order.total_price)}</dd></div>
                  <div><dt>Wilaya</dt><dd>{order.wilaya || "-"}</dd></div>
                  <div><dt>Adresse</dt><dd>{order.address || "-"}</dd></div>
                  {order.note ? <div><dt>Note</dt><dd>{order.note}</dd></div> : null}
                </dl>
              </div>

              <label className="admin-order-status-control">
                <span>Statut</span>
                <select
                  className="admin-order-status-select"
                  value={order.status}
                  disabled={Boolean(updatingOrderId)}
                  onChange={(event) => handleStatusChange(order, event.target.value)}
                >
                  {getAvailableStatuses(order.status).map((status) => (
                    <option value={status} key={status}>{getStatusLabel(status)}</option>
                  ))}
                </select>
              </label>
            </article>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default AdminOrders;
