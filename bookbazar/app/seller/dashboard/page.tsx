"use client";

import axios from "axios";
import Link from "next/link";
import { useEffect, useState } from "react";
import { SITE_URL } from "@/lib/site";

interface Store {
  name: string;
  slug: string;
  description: string;
  isActive: boolean;
  isApproved: boolean;
  isVerified: boolean;
}

function StatusBadge({ ok, okLabel, pendingLabel }: { ok: boolean; okLabel: string; pendingLabel: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
        ok ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
      }`}
    >
      {ok ? "✓" : "⏳"} {ok ? okLabel : pendingLabel}
    </span>
  );
}

export default function DashboardPage() {
  const [store, setStore] = useState<Store | null | undefined>(undefined);
  const [copied, setCopied] = useState(false);
  const [payoutOwed, setPayoutOwed] = useState(0);

  const [description, setDescription] = useState("");
  const [savingDescription, setSavingDescription] = useState(false);
  const [descriptionMessage, setDescriptionMessage] = useState("");
  const [descriptionIsError, setDescriptionIsError] = useState(false);

  async function loadStore() {
    const res = await axios.get<{ store: Store | null }>("/api/store/mine");
    setStore(res.data.store);
    if (res.data.store) setDescription(res.data.store.description);
  }

  useEffect(() => {
    loadStore();
    axios.get<{ totalOwed: number }>("/api/store/payouts").then((res) => setPayoutOwed(res.data.totalOwed));
  }, []);

  const storeUrl = store ? `${SITE_URL}/store/${store.slug}` : "";

  function copyUrl() {
    navigator.clipboard.writeText(storeUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  async function saveDescription(e: React.FormEvent) {
    e.preventDefault();
    setSavingDescription(true);
    setDescriptionMessage("");
    try {
      await axios.patch("/api/store/mine", { description });
      setDescriptionIsError(false);
      setDescriptionMessage("Saved!");
      await loadStore();
    } catch (err) {
      setDescriptionIsError(true);
      setDescriptionMessage(axios.isAxiosError(err) ? err.response?.data?.message || "Unable to save" : "Unable to save");
    } finally {
      setSavingDescription(false);
    }
  }

  return (
    <div className="p-6 md:p-8">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">
          Seller dashboard
        </p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="mt-2 text-slate-500">
          Manage your books, orders, and store activity.
        </p>
      </div>

      {store && (
        <>
          {/* Status — the whole point is answering "am I allowed to sell yet?" at a glance. */}
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Store status</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <StatusBadge ok={store.isApproved} okLabel="Approved to sell" pendingLabel="Pending admin approval" />
              <StatusBadge ok={store.isActive} okLabel="Store active" pendingLabel="Store inactive" />
              <StatusBadge ok={store.isVerified} okLabel="Verified seller" pendingLabel="Not yet fully verified" />
            </div>
            {!store.isApproved && (
              <p className="mt-3 text-sm text-slate-500">
                Your books won&apos;t appear on BookMandu until an admin approves your store — this usually happens
                after your identity document is reviewed.
              </p>
            )}
          </div>

          {/* Your store URL — easy to find again if you forget it. */}
          <div className="mt-6 rounded-2xl border border-indigo-100 bg-indigo-50 p-6">
            <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">Your store link</p>
            <p className="mt-1 text-sm text-slate-500">Share this with buyers, or bookmark it — this is your public storefront.</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <code className="flex-1 min-w-0 truncate rounded-lg border border-indigo-200 bg-white px-3 py-2 text-sm text-slate-700">
                {storeUrl}
              </code>
              <button
                onClick={copyUrl}
                className="shrink-0 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
              <Link
                href={`/store/${store.slug}`}
                target="_blank"
                className="shrink-0 rounded-lg border border-indigo-200 bg-white px-4 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100"
              >
                View store →
              </Link>
            </div>
            {!store.isApproved && (
              <p className="mt-2 text-xs text-indigo-500">This link won&apos;t show your store publicly until you&apos;re approved.</p>
            )}
          </div>

          {/* What BookMandu owes you for buyer coupons/credits — real
              money, since COD cash is collected directly by you, not
              routed through BookMandu. */}
          {payoutOwed > 0 && (
            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-6">
              <p className="text-sm font-semibold uppercase tracking-wide text-amber-700">BookMandu owes you</p>
              <p className="mt-1 text-2xl font-bold text-amber-900">Rs. {payoutOwed.toFixed(2)}</p>
              <p className="mt-1 text-sm text-amber-700">
                For coupon/credit discounts buyers used on your orders — you collected less cash on delivery for
                those, and this is the difference. Settled by the BookMandu team directly (bank transfer).
              </p>
            </div>
          )}

          {/* Editable description */}
          <form onSubmit={saveDescription} className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Store description</p>
            <p className="mt-1 text-sm text-slate-500">Shown to buyers on your public storefront page.</p>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              maxLength={500}
              className="mt-3 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-50"
            />
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-slate-400">{description.length}/500</span>
              {descriptionMessage && (
                <span className={`text-xs font-medium ${descriptionIsError ? "text-red-600" : "text-green-600"}`}>
                  {descriptionMessage}
                </span>
              )}
            </div>
            <button
              type="submit"
              disabled={savingDescription || description.trim().length < 10}
              className="mt-3 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {savingDescription ? "Saving..." : "Save description"}
            </button>
          </form>
        </>
      )}
    </div>
  );
}
