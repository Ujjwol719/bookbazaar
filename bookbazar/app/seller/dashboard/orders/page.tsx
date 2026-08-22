"use client";

import axios from "axios";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { buildWhatsAppLink } from "@/lib/whatsapp";

const ORDER_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "SHIPPED",
] as const;

type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

interface SellerOrder {
  id: string;
  status: OrderStatus;
  totalAmount: string | number;
  fullName: string;
  phone: string;
  shippingAddr: string;
  city: string;
  state: string;
  postalCode: string;
  createdAt: string;
  buyer: {
    full_name: string;
    email: string;
  };
  items: {
    id: string;
    quantity: number;
    unitPrice: string | number;
    totalPrice: string | number;
    book: {
      title: string;
      author: string | null;
      isbn: string | null;
    };
  }[];
}

const statusStyles: Record<OrderStatus, string> = {
  PENDING: "bg-yellow-50 text-yellow-700 border-yellow-200",
  CONFIRMED: "bg-blue-50 text-blue-700 border-blue-200",
  SHIPPED: "bg-indigo-50 text-indigo-700 border-indigo-200",
  DELIVERED: "bg-green-50 text-green-700 border-green-200",
  CANCELLED: "bg-red-50 text-red-700 border-red-200",
};

export default function SellerOrdersPage() {
  const [orders, setOrders] = useState<SellerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deliveryCodes, setDeliveryCodes] = useState<Record<string, string>>({});

  useEffect(() => {
    async function loadOrders() {
      try {
        const response = await axios.get<{ orders: SellerOrder[] }>(
          "/api/seller/orders"
        );
        setOrders(response.data.orders);
      } catch (err) {
        if (axios.isAxiosError(err)) {
          setError(err.response?.data?.message || "Unable to load orders");
        } else {
          setError("Unable to load orders");
        }
      } finally {
        setLoading(false);
      }
    }

    loadOrders();
  }, []);

  const totals = useMemo(() => {
    return orders.reduce(
      (acc, order) => {
        acc.items += order.items.reduce((sum, item) => sum + item.quantity, 0);
        acc.value += order.items.reduce(
          (sum, item) => sum + Number(item.totalPrice),
          0
        );
        return acc;
      },
      { items: 0, value: 0 }
    );
  }, [orders]);

  async function updateStatus(orderId: string, status: OrderStatus, deliveryCode?: string) {
    setUpdatingId(orderId);
    setError("");

    try {
      await axios.patch(`/api/seller/orders/${orderId}`, {
        status,
        deliveryCode,
      });
      setOrders((current) =>
        current.map((order) =>
          order.id === orderId ? { ...order, status } : order
        )
      );
      if (status === "DELIVERED") {
        setDeliveryCodes((current) => {
          const next = { ...current };
          delete next[orderId];
          return next;
        });
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || "Unable to update status");
      } else {
        setError("Unable to update status");
      }
    } finally {
      setUpdatingId(null);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="mx-auto max-w-7xl">
          <div className="h-36 animate-pulse rounded-2xl bg-white shadow-sm" />
          <div className="mt-6 space-y-5">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-56 animate-pulse rounded-2xl bg-white shadow-sm"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-900 md:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">
                Seller orders
              </p>
              <h1 className="mt-2 text-3xl font-bold md:text-4xl">
                Received Orders
              </h1>
              <p className="mt-2 max-w-2xl text-slate-500">
                View customer orders for your store and update delivery status.
              </p>
            </div>

            <Link
              href="/seller/dashboard/mybook"
              className="rounded-xl border border-slate-300 px-5 py-3 text-center font-semibold text-slate-700 transition hover:border-indigo-300 hover:text-indigo-700"
            >
              My Books
            </Link>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Orders</p>
            <p className="mt-2 text-3xl font-bold">{orders.length}</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Books Ordered</p>
            <p className="mt-2 text-3xl font-bold">{totals.items}</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Store Revenue</p>
            <p className="mt-2 text-3xl font-bold">
              Rs. {totals.value.toLocaleString()}
            </p>
          </div>
        </div>

        {error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 font-medium text-red-700">
            {error}
          </div>
        )}

        {orders.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
            <h2 className="text-2xl font-bold">No received orders yet</h2>
            <p className="mt-2 text-slate-500">
              Orders containing your store's books will appear here.
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-5">
            {orders.map((order) => {
              const storeTotal = order.items.reduce(
                (sum, item) => sum + Number(item.totalPrice),
                0
              );

              return (
                <div
                  key={order.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-xl font-bold">
                          Order #{order.id.slice(0, 8)}
                        </h2>
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-bold ${statusStyles[order.status]}`}
                        >
                          {order.status}
                        </span>
                      </div>

                      <p className="mt-2 text-sm text-slate-500">
                        {new Date(order.createdAt).toLocaleString()}
                      </p>
                      <p className="mt-2 text-sm text-slate-600">
                        Customer: {order.fullName || order.buyer.full_name} ·{" "}
                        {order.phone}
                      </p>
                      {(() => {
                        const whatsappLink = buildWhatsAppLink(
                          order.phone,
                          `Hi ${order.fullName || order.buyer.full_name}, this is regarding your BookMandu order #${order.id.slice(0, 8)}.`
                        );
                        return whatsappLink ? (
                          <a
                            href={whatsappLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-green-700 hover:text-green-800"
                          >
                            <span aria-hidden="true">💬</span> Message on WhatsApp
                          </a>
                        ) : null;
                      })()}
                    </div>

                    <div className="flex flex-col gap-3 sm:min-w-[320px]">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <label
                          htmlFor={`status-${order.id}`}
                          className="text-sm font-semibold text-slate-600"
                        >
                          Status
                        </label>
                        <select
                          id={`status-${order.id}`}
                          value={order.status}
                          disabled={updatingId === order.id}
                          onChange={(e) =>
                            updateStatus(order.id, e.target.value as OrderStatus)
                          }
                          className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 font-semibold text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                        >
                          {ORDER_STATUSES.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:flex-row sm:items-center">
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={6}
                          value={deliveryCodes[order.id] || ""}
                          onChange={(e) =>
                            setDeliveryCodes((current) => ({
                              ...current,
                              [order.id]: e.target.value.replace(/\D/g, "").slice(0, 6),
                            }))
                          }
                          placeholder="Delivery code"
                          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                        />
                        <button
                          type="button"
                          disabled={updatingId === order.id}
                          onClick={() =>
                            updateStatus(order.id, "DELIVERED", deliveryCodes[order.id])
                          }
                          className="rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Mark Delivered
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_280px]">
                    <div className="space-y-3">
                      {order.items.map((item) => (
                        <div
                          key={item.id}
                          className="rounded-xl border border-slate-100 bg-slate-50 p-4"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h3 className="font-bold">{item.book.title}</h3>
                              <p className="mt-1 text-sm text-slate-500">
                                {item.book.author || "Unknown Author"}
                              </p>
                              <p className="mt-1 text-xs text-slate-400">
                                ISBN: {item.book.isbn || "N/A"}
                              </p>
                            </div>

                            <div className="text-right">
                              <p className="text-sm font-semibold text-slate-600">
                                Qty {item.quantity}
                              </p>
                              <p className="mt-1 font-bold">
                                Rs. {Number(item.totalPrice)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                      <h3 className="font-bold">Shipping</h3>
                      <p className="mt-2 text-sm text-slate-600">
                        {order.shippingAddr}
                      </p>
                      <p className="text-sm text-slate-600">
                        {order.city}, {order.state}
                      </p>
                      <p className="text-sm text-slate-600">
                        {order.postalCode}
                      </p>

                      <div className="mt-5 rounded-xl bg-white p-4">
                        <p className="text-sm font-medium text-slate-500">
                          Your Store Total
                        </p>
                        <p className="mt-1 text-2xl font-bold text-indigo-600">
                          Rs. {storeTotal.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
