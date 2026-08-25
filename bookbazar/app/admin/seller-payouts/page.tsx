"use client";

import axios from "axios";
import Link from "next/link";
import { useEffect, useState } from "react";

interface Adjustment {
  id: string;
  amount: string;
  reason: string;
  status: "PENDING" | "PAID";
  createdAt: string;
  paidAt: string | null;
  store: { name: string; slug: string; phone: string | null };
  order: { id: string; createdAt: string; couponCode: string | null };
  paidBy: { full_name: string } | null;
}

export default function AdminSellerPayoutsPage() {
  const [adjustments, setAdjustments] = useState<Adjustment[]>([]);
  const [tab, setTab] = useState<"PENDING" | "PAID">("PENDING");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    try {
      const res = await axios.get<{ adjustments: Adjustment[] }>(`/api/admin/seller-payouts?status=${tab}`);
      setAdjustments(res.data.adjustments);
    } catch {
      setError("Unable to load payouts");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  async function markPaid(id: string) {
    if (!window.confirm("Confirm you've actually sent this payment to the seller?")) return;
    setBusyId(id);
    try {
      await axios.patch(`/api/admin/seller-payouts/${id}`, {});
      setError("");
      await load();
    } catch (err) {
      setError(axios.isAxiosError(err) ? err.response?.data?.message || "Unable to update" : "Unable to update");
    } finally {
      setBusyId(null);
    }
  }

  const totalPending = adjustments.filter((a) => a.status === "PENDING").reduce((sum, a) => sum + Number(a.amount), 0);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 md:px-8 md:py-10">
      <div className="mx-auto max-w-4xl">
        <Link href="/admin" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">← Admin Console</Link>
        <h1 className="mt-1 text-2xl font-bold text-slate-900 md:text-3xl">Seller Payouts</h1>
        <p className="mt-1 text-slate-500">
          What BookMandu owes sellers for coupon/credit discounts buyers used at checkout — COD cash collected by the
          seller is reduced by that amount, so this is BookMandu&apos;s side of making them whole. Settled manually
          (bank transfer, etc.); marking paid here just records that it happened.
        </p>

        {tab === "PENDING" && !loading && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
            Total pending: Rs. {totalPending.toFixed(2)}
          </div>
        )}

        {error && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}

        <div className="mt-6 flex gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
          <button onClick={() => setTab("PENDING")} className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition ${tab === "PENDING" ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}>
            Pending
          </button>
          <button onClick={() => setTab("PAID")} className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition ${tab === "PAID" ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}>
            Paid
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {loading ? (
            <div className="h-20 animate-pulse rounded-2xl bg-white" />
          ) : adjustments.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
              Nothing here.
            </div>
          ) : (
            adjustments.map((a) => (
              <div key={a.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div>
                  <p className="font-bold text-slate-900">{a.store.name}</p>
                  <p className="text-sm text-slate-500">
                    Rs. {Number(a.amount).toFixed(2)} · Order placed {new Date(a.order.createdAt).toLocaleDateString()}
                    {a.order.couponCode ? ` · coupon ${a.order.couponCode}` : ""}
                  </p>
                  {a.store.phone && <p className="text-xs text-slate-400">Contact: {a.store.phone}</p>}
                  {a.status === "PAID" && a.paidAt && (
                    <p className="mt-1 text-xs text-green-600">Paid {new Date(a.paidAt).toLocaleDateString()}{a.paidBy ? ` by ${a.paidBy.full_name}` : ""}</p>
                  )}
                </div>
                {a.status === "PENDING" ? (
                  <button
                    onClick={() => markPaid(a.id)}
                    disabled={busyId === a.id}
                    className="shrink-0 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60"
                  >
                    Mark as paid
                  </button>
                ) : (
                  <span className="shrink-0 rounded-full bg-green-100 px-3 py-1.5 text-xs font-semibold text-green-700">Paid</span>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
