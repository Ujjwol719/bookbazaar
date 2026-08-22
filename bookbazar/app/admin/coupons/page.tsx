"use client";

import axios from "axios";
import Link from "next/link";
import { useEffect, useState } from "react";

interface Coupon {
  id: string;
  code: string;
  type: "PERCENTAGE" | "FIXED";
  value: string;
  description: string | null;
  isActive: boolean;
  firstOrderOnly: boolean;
  minOrderAmount: string | null;
  maxDiscount: string | null;
  maxRedemptions: number | null;
  redeemedCount: number;
  expiresAt: string | null;
  createdAt: string;
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [code, setCode] = useState("");
  const [type, setType] = useState<"PERCENTAGE" | "FIXED">("PERCENTAGE");
  const [value, setValue] = useState("");
  const [description, setDescription] = useState("");
  const [firstOrderOnly, setFirstOrderOnly] = useState(false);
  const [maxRedemptions, setMaxRedemptions] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await axios.get<{ coupons: Coupon[] }>("/api/admin/coupons");
      setCoupons(res.data.coupons);
    } catch {
      setError("Unable to load coupons");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function createCoupon(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim() || !value) return;
    setSaving(true);
    try {
      await axios.post("/api/admin/coupons", {
        code: code.trim(),
        type,
        value: Number(value),
        description: description.trim() || undefined,
        firstOrderOnly,
        maxRedemptions: maxRedemptions ? Number(maxRedemptions) : undefined,
      });
      setMessage("Coupon created");
      setError("");
      setCode(""); setValue(""); setDescription(""); setFirstOrderOnly(false); setMaxRedemptions("");
      load();
    } catch (err) {
      setError(axios.isAxiosError(err) ? err.response?.data?.message || "Unable to create coupon" : "Unable to create coupon");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(coupon: Coupon) {
    setBusyId(coupon.id);
    try {
      await axios.patch(`/api/admin/coupons/${coupon.id}`, { isActive: !coupon.isActive });
      setError("");
      await load();
    } catch (err) {
      setError(axios.isAxiosError(err) ? err.response?.data?.message || "Unable to update coupon" : "Unable to update coupon");
    } finally {
      setBusyId(null);
    }
  }

  async function deleteCoupon(coupon: Coupon) {
    if (!window.confirm(`Delete ${coupon.code}?`)) return;
    setBusyId(coupon.id);
    try {
      await axios.delete(`/api/admin/coupons/${coupon.id}`);
      setError("");
      await load();
    } catch (err) {
      setError(axios.isAxiosError(err) ? err.response?.data?.message || "Unable to delete coupon" : "Unable to delete coupon");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 md:px-8 md:py-10">
      <div className="mx-auto max-w-4xl">
        <Link href="/admin" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">← Admin Console</Link>
        <h1 className="mt-1 text-2xl font-bold text-slate-900 md:text-3xl">Coupons</h1>
        <p className="mt-1 text-slate-500">Discount codes, applied at checkout alongside BookMandu Credits.</p>

        {message && <div className="mt-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">{message}</div>}
        {error && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Create a coupon</h2>
          <form onSubmit={createCoupon} className="mt-4 grid gap-3 sm:grid-cols-2">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Code, e.g. WELCOME10"
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:bg-white"
            />
            <div className="flex gap-2">
              <select
                value={type}
                onChange={(e) => setType(e.target.value as "PERCENTAGE" | "FIXED")}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:bg-white"
              >
                <option value="PERCENTAGE">%</option>
                <option value="FIXED">Rs.</option>
              </select>
              <input
                type="number"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={type === "PERCENTAGE" ? "10" : "100"}
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:bg-white"
              />
            </div>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description (optional) — shown to buyers"
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:bg-white sm:col-span-2"
            />
            <input
              type="number"
              value={maxRedemptions}
              onChange={(e) => setMaxRedemptions(e.target.value)}
              placeholder="Max total uses (optional, blank = unlimited)"
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:bg-white"
            />
            <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700">
              <input type="checkbox" checked={firstOrderOnly} onChange={(e) => setFirstOrderOnly(e.target.checked)} className="h-4 w-4 accent-indigo-600" />
              First order only
            </label>
            <button
              type="submit"
              disabled={saving || !code.trim() || !value}
              className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60 sm:col-span-2"
            >
              {saving ? "Creating..." : "Create Coupon"}
            </button>
          </form>
        </section>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-slate-900">All coupons <span className="font-normal text-slate-400">({coupons.length})</span></h2>
          {loading ? (
            <div className="h-16 animate-pulse rounded-xl bg-slate-100" />
          ) : coupons.length === 0 ? (
            <p className="text-sm text-slate-500">No coupons yet.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {coupons.map((c) => (
                <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <code className="font-bold text-slate-900">{c.code}</code>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${c.isActive ? "bg-green-100 text-green-700" : "bg-slate-200 text-slate-500"}`}>
                        {c.isActive ? "Active" : "Inactive"}
                      </span>
                      {c.firstOrderOnly && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">First order</span>}
                    </div>
                    <p className="mt-0.5 text-sm text-slate-500">
                      {c.type === "PERCENTAGE" ? `${c.value}% off` : `Rs. ${c.value} off`}
                      {c.description ? ` — ${c.description}` : ""}
                    </p>
                    <p className="text-xs text-slate-400">
                      Used {c.redeemedCount}{c.maxRedemptions ? ` / ${c.maxRedemptions}` : ""} time{c.redeemedCount === 1 ? "" : "s"}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      onClick={() => toggleActive(c)}
                      disabled={busyId === c.id}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-60"
                    >
                      {c.isActive ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      onClick={() => deleteCoupon(c)}
                      disabled={busyId === c.id}
                      className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
