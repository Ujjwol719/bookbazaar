"use client";

import axios from "axios";
import Link from "next/link";
import { useEffect, useState } from "react";

interface UserRow {
  id: string;
  full_name: string;
  email: string;
  creditBalance: number;
}

interface Transaction {
  id: string;
  amount: number;
  type: string;
  reason: string;
  createdAt: string;
  createdBy: { full_name: string } | null;
}

interface Settings {
  creditValueInRupees: string;
  contributionReward: number;
}

export default function AdminCreditsPage() {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<UserRow[]>([]);
  const [selected, setSelected] = useState<UserRow | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [settings, setSettings] = useState<Settings | null>(null);
  const [creditValueDraft, setCreditValueDraft] = useState("");
  const [rewardDraft, setRewardDraft] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);

  async function loadUsers() {
    const res = await axios.get<{ users: UserRow[] }>(`/api/admin/credits${query ? `?q=${encodeURIComponent(query)}` : ""}`);
    setUsers(res.data.users);
  }

  async function loadSettings() {
    const res = await axios.get<{ settings: Settings }>("/api/admin/credit-settings");
    setSettings(res.data.settings);
    setCreditValueDraft(String(res.data.settings.creditValueInRupees));
    setRewardDraft(String(res.data.settings.contributionReward));
  }

  useEffect(() => {
    loadUsers();
    loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function selectUser(u: UserRow) {
    setSelected(u);
    const res = await axios.get(`/api/admin/credits/${u.id}`);
    setTransactions(res.data.transactions);
  }

  async function saveSettings() {
    setSavingSettings(true);
    try {
      const res = await axios.patch("/api/admin/credit-settings", {
        creditValueInRupees: Number(creditValueDraft),
        contributionReward: Number(rewardDraft),
      });
      setSettings(res.data.settings);
      setMessage("Settings updated");
      setError("");
    } catch (err) {
      setError(axios.isAxiosError(err) ? err.response?.data?.message || "Unable to update settings" : "Unable to update settings");
    } finally {
      setSavingSettings(false);
    }
  }

  async function submitAdjustment(e: React.FormEvent) {
    e.preventDefault();
    if (!selected || !amount || !reason.trim()) return;
    setBusy(true);
    try {
      await axios.post("/api/admin/credits/adjust", { userId: selected.id, amount: Number(amount), reason: reason.trim() });
      setMessage(`Adjustment applied to ${selected.full_name}`);
      setError("");
      setAmount("");
      setReason("");
      await Promise.all([loadUsers(), selectUser(selected)]);
    } catch (err) {
      setError(axios.isAxiosError(err) ? err.response?.data?.message || "Unable to apply adjustment" : "Unable to apply adjustment");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 md:px-8 md:py-10">
      <div className="mx-auto max-w-5xl">
        <Link href="/admin" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">← Admin Console</Link>
        <h1 className="mt-1 text-2xl font-bold text-slate-900 md:text-3xl">BookMandu Credits</h1>
        <p className="mt-1 text-slate-500">Every credit change is ledger-backed — manual adjustments require a reason.</p>

        {settings && (
          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">Settings</h2>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Credit value (₹ per credit)</label>
                <input
                  type="number"
                  step="0.01"
                  value={creditValueDraft}
                  onChange={(e) => setCreditValueDraft(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:bg-white"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Reward per approved upload</label>
                <input
                  type="number"
                  step="1"
                  value={rewardDraft}
                  onChange={(e) => setRewardDraft(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:bg-white"
                />
              </div>
            </div>
            <button
              onClick={saveSettings}
              disabled={savingSettings}
              className="mt-4 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {savingSettings ? "Saving..." : "Save settings"}
            </button>
          </section>
        )}

        {message && <div className="mt-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">{message}</div>}
        {error && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">Users with credits</h2>
            <div className="mt-3 flex gap-2">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && loadUsers()}
                placeholder="Search by name or email"
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:bg-white"
              />
              <button onClick={loadUsers} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                Search
              </button>
            </div>
            <div className="mt-3 max-h-80 divide-y divide-slate-100 overflow-y-auto">
              {users.map((u) => (
                <button
                  key={u.id}
                  onClick={() => selectUser(u)}
                  className={`flex w-full items-center justify-between gap-3 py-3 text-left ${selected?.id === u.id ? "bg-indigo-50 px-2 rounded-lg" : ""}`}
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{u.full_name}</p>
                    <p className="text-xs text-slate-400">{u.email}</p>
                  </div>
                  <span className="text-sm font-bold text-emerald-700">{u.creditBalance}</span>
                </button>
              ))}
              {users.length === 0 && <p className="py-3 text-sm text-slate-500">No users with credit activity yet.</p>}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            {!selected ? (
              <p className="text-sm text-slate-500">Select a user to view their ledger and make an adjustment.</p>
            ) : (
              <>
                <h2 className="text-lg font-bold text-slate-900">{selected.full_name}</h2>
                <p className="text-sm text-slate-500">Balance: <span className="font-bold text-emerald-700">{selected.creditBalance}</span></p>

                <form onSubmit={submitAdjustment} className="mt-4 space-y-2 rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Manual adjustment</p>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Amount (use negative to deduct)"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500"
                  />
                  <input
                    type="text"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Reason (required)"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500"
                  />
                  <button
                    type="submit"
                    disabled={busy || !amount || !reason.trim()}
                    className="w-full rounded-lg bg-indigo-600 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Apply adjustment
                  </button>
                </form>

                <div className="mt-4 max-h-64 divide-y divide-slate-100 overflow-y-auto">
                  {transactions.map((t) => (
                    <div key={t.id} className="py-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-700">{t.reason}</span>
                        <span className={`font-semibold ${t.amount > 0 ? "text-emerald-700" : "text-slate-600"}`}>{t.amount > 0 ? "+" : ""}{t.amount}</span>
                      </div>
                      <p className="text-xs text-slate-400">
                        {t.type.replace("_", " ")} · {new Date(t.createdAt).toLocaleDateString()}
                        {t.createdBy ? ` · by ${t.createdBy.full_name}` : ""}
                      </p>
                    </div>
                  ))}
                  {transactions.length === 0 && <p className="py-2 text-sm text-slate-500">No transactions yet.</p>}
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
