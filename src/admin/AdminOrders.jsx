import { useEffect, useState } from "react";
import { formatPrice } from "../utils/productPresentation.js";
import {
  getOrders,
  ORDER_STATUSES,
  updateOrderStatus,
} from "../utils/orderStorage.js";

const statusLabels = {
  nouvelle: "Nouvelle",
  confirmee: "Confirmée",
  en_preparation: "En préparation",
  expediee: "Expédiée",
  livree: "Livrée",
  annulee: "Annulée",
};

function formatOrderDate(value) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("fr-DZ", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [ordersStatus, setOrdersStatus] = useState("loading");
  const [ordersError, setOrdersError] = useState("");
  const [updatingOrderId, setUpdatingOrderId] = useState("");

  async function loadOrders() {
    try {
      setOrdersStatus("loading");
      setOrdersError("");
      const nextOrders = await getOrders();
      setOrders(nextOrders);
      setOrdersStatus("success");
    } catch (error) {
      console.error("Admin load orders error:", error);
      setOrdersError(
        "Impossible de charger les commandes. Vérifiez que supabase-orders.sql a été exécuté."
      );
      setOrdersStatus("error");
    }
  }

  useEffect(() => {
    loadOrders();
  }, []);

  async function handleStatusChange(order, status) {
    try {
      setUpdatingOrderId(order.id);
      setOrdersError("");
      await updateOrderStatus(order.id, status);
      setOrders((currentOrders) =>
        currentOrders.map((currentOrder) =>
          currentOrder.id === order.id
            ? { ...currentOrder, status }
            : currentOrder
        )
      );
    } catch (error) {
      console.error("Admin update order error:", error);
      setOrdersError("Impossible de modifier le statut de la commande.");
    } finally {
      setUpdatingOrderId("");
    }
  }

  return (
    <div className="admin-orders-view">
      <div className="admin-toolbar">
        <p>{orders.length} commandes</p>
        <button className="btn btn-secondary" type="button" onClick={loadOrders}>
          Actualiser
        </button>
      </div>

      {ordersError ? <p className="admin-error">{ordersError}</p> : null}

      {ordersStatus === "loading" ? (
        <div className="empty-state">
          <p>Chargement des commandes...</p>
        </div>
      ) : null}

      {ordersStatus === "error" ? (
        <div className="empty-state">
          <h2>Erreur</h2>
          <p>Les commandes ne sont pas disponibles.</p>
        </div>
      ) : null}

      {ordersStatus === "success" && orders.length === 0 ? (
        <div className="empty-state">
          <h2>Aucune commande</h2>
          <p>Les nouvelles commandes apparaîtront ici.</p>
        </div>
      ) : null}

      {ordersStatus === "success" && orders.length > 0 ? (
        <div className="admin-orders-list">
          {orders.map((order) => (
            <article className="admin-order-card" key={order.id}>
              <div className="admin-order-heading">
                <div>
                  <span className={`admin-order-status status-${order.status}`}>
                    {statusLabels[order.status] || order.status}
                  </span>
                  <h2>{order.product_name}</h2>
                  <p>{formatOrderDate(order.created_at)}</p>
                </div>
                <strong>{formatPrice(order.total_price)}</strong>
              </div>

              <div className="admin-order-body">
                {order.product_image_url ? (
                  <img src={order.product_image_url} alt="" />
                ) : null}

                <dl>
                  <div>
                    <dt>Client</dt>
                    <dd>{order.customer_name}</dd>
                  </div>
                  <div>
                    <dt>Téléphone</dt>
                    <dd><a href={`tel:${order.phone}`}>{order.phone}</a></dd>
                  </div>
                  <div>
                    <dt>Produit</dt>
                    <dd>{order.product_name}</dd>
                  </div>
                  <div>
                    <dt>Quantité</dt>
                    <dd>{order.quantity}</dd>
                  </div>
                  <div>
                    <dt>Total</dt>
                    <dd>{formatPrice(order.total_price)}</dd>
                  </div>
                  <div>
                    <dt>Wilaya</dt>
                    <dd>{order.wilaya || "-"}</dd>
                  </div>
                  <div>
                    <dt>Adresse</dt>
                    <dd>{order.address || "-"}</dd>
                  </div>
                  {order.note ? (
                    <div>
                      <dt>Note</dt>
                      <dd>{order.note}</dd>
                    </div>
                  ) : null}
                </dl>
              </div>

              <label className="admin-order-status-control">
                <span>Statut</span>
                <select
                  value={order.status}
                  disabled={updatingOrderId === order.id}
                  onChange={(event) =>
                    handleStatusChange(order, event.target.value)
                  }
                >
                  {ORDER_STATUSES.map((status) => (
                    <option value={status} key={status}>
                      {statusLabels[status]}
                    </option>
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
