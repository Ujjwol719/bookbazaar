"use client";

import axios from "axios";
import Link from "next/link";
import { useEffect, useState } from "react";
import { SITE_URL } from "@/lib/site";

interface Store {
  name: string;
  slug: string;
  isApproved: boolean;
  isVerified: boolean;
}

export default function DashboardPage() {
  const [store, setStore] = useState<Store | null | undefined>(undefined);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    axios.get<{ store: Store | null }>("/api/store/mine").then((res) => setStore(res.data.store));
  }, []);

  const storeUrl = store ? `${SITE_URL}/store/${store.slug}` : "";

  function copyUrl() {
    navigator.clipboard.writeText(storeUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
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

      {/* Your store URL — easy to find again if you forget it. */}
      {store && (
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
        </div>
      )}
    </div>
  );
}
