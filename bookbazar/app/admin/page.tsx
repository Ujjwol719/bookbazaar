"use client";

import axios from "axios";
import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import Image from "next/image";

interface PendingSeller {
  id: string;
  name: string;
  phone: string | null;
  identityUrl: string | null;
  createdAt: string;
  seller: {
    full_name: string;
    email: string;
  };
}

interface AdminStore {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  isVerified: boolean;
  isApproved: boolean;
  createdAt: string;
  seller: {
    id: string;
    full_name: string;
    email: string;
    role: string;
    created_at: string;
  };
  stats: {
    productCount: number;
    orderCount: number;
    totalSold: number;
    revenue: number;
  };
  books: {
    id: string;
    title: string;
    author: string | null;
    isbn: string | null;
    price: number;
    stockQty: number;
    isActive: boolean;
    createdAt: string;
    soldQty: number;
    salesAmount: number;
  }[];
  sales: {
    id: string;
    orderId: string;
    bookTitle: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    orderStatus: string;
    customerName: string;
    customerPhone: string;
    createdAt: string;
  }[];
}

interface AdminUser {
  id: string;
  full_name: string;
  email: string;
  role: string;
  isBlocked: boolean;
  isVerified: boolean;
  created_at: string;
  store: {
    id: string;
    name: string;
    isApproved: boolean;
  } | null;
}

interface AdminReview {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  user: {
    id: string;
    full_name: string;
    email: string;
  };
  book: {
    id: string;
    title: string;
  };
}

interface AdminBanner {
  id: string;
  imageUrl: string;
  title: string | null;
  subtitle: string | null;
  linkUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
}

type SectionKey =
  | "overview"
  | "stores"
  | "users"
  | "reviews"
  | "banners"
  | "messages";

const NAV_ITEMS: { key: SectionKey; label: string; icon: ReactNode }[] = [
  {
    key: "overview",
    label: "Dashboard Overview",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
        <path d="M3 13h6V3H3v10Zm0 8h6v-6H3v6Zm8 0h10V11H11v10Zm0-18v6h10V3H11Z" fill="currentColor" />
      </svg>
    ),
  },
  {
    key: "stores",
    label: "Seller Verification",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
        <path
          d="M12 2 3 6v6c0 5 4 8.5 9 10 5-1.5 9-5 9-10V6l-9-4Zm-1.2 13.4L7 11.6l1.4-1.4 2.4 2.4 5.4-5.4 1.4 1.4-6.8 6.8Z"
          fill="currentColor"
        />
      </svg>
    ),
  },
  {
    key: "users",
    label: "User Management",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
        <path
          d="M16 11a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm-8 1a3.5 3.5 0 1 0-3.5-3.5A3.5 3.5 0 0 0 8 12Zm8 2c-2.7 0-8 1.34-8 4v3h16v-3c0-2.66-5.3-4-8-4Zm-8 .2C5.6 14.6 2 15.9 2 18v3h4v-2.8c0-1.1.4-2 1-2.8a8.6 8.6 0 0 0-1-.2Z"
          fill="currentColor"
        />
      </svg>
    ),
  },
  {
    key: "reviews",
    label: "Reviews",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
        <path
          d="M12 17.3 6.2 21l1.6-6.6L2.5 9.8l6.7-.6L12 3l2.8 6.2 6.7.6-5.3 4.6 1.6 6.6Z"
          fill="currentColor"
        />
      </svg>
    ),
  },
  {
    key: "banners",
    label: "Homepage Banners",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
        <path
          d="M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm1 2v10h14V7H5Zm2 8 3.5-4.5 2.5 3 3-4L19 15H7Z"
          fill="currentColor"
        />
      </svg>
    ),
  },
  {
    key: "messages",
    label: "Messages",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
        <path d="M3 4h18v14H7l-4 4V4Z" fill="currentColor" />
      </svg>
    ),
  },
];

export default function AdminPage() {
  const [activeSection, setActiveSection] = useState<SectionKey>("overview");

  const [stores, setStores] = useState<AdminStore[]>([]);
  const [pendingSellers, setPendingSellers] = useState<PendingSeller[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [banners, setBanners] = useState<AdminBanner[]>([]);
  const [busyBannerId, setBusyBannerId] = useState<string | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerTitle, setBannerTitle] = useState("");
  const [bannerSubtitle, setBannerSubtitle] = useState("");
  const [bannerLinkUrl, setBannerLinkUrl] = useState("");
  const [bannerSaving, setBannerSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busyStoreId, setBusyStoreId] = useState<string | null>(null);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [busyReviewId, setBusyReviewId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [reviewSearch, setReviewSearch] = useState("");
  const [storeFilter, setStoreFilter] = useState<"all" | "pending" | "approved" | "banned">("all");
  const [mailRecipientMode, setMailRecipientMode] = useState<"all" | "single">("all");
  const [mailStoreId, setMailStoreId] = useState("");
  const [mailSubject, setMailSubject] = useState("BookMandu admin update");
  const [mailMessage, setMailMessage] = useState("");
  const [mailSending, setMailSending] = useState(false);

  useEffect(() => {
    loadStores();
    loadPendingSellers();
    loadUsers();
    loadReviews();
    loadBanners();
  }, []);

  // Clear transient banners when switching sections so stale success/error
  // messages from one tab don't bleed into another.
  useEffect(() => {
    setError("");
    setMessage("");
  }, [activeSection]);

  async function loadStores() {
    setLoading(true);
    setError("");
    try {
      const response = await axios.get<{ stores: AdminStore[] }>("/api/admin/stores");
      setStores(response.data.stores);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || "Unable to load admin data");
      } else {
        setError("Unable to load admin data");
      }
    } finally {
      setLoading(false);
    }
  }

  async function loadPendingSellers() {
    try {
      const response = await axios.get<{ stores: PendingSeller[] }>("/api/admin/pending-sellers");
      setPendingSellers(response.data.stores);
    } catch {
      // silently fail
    }
  }

  async function loadUsers() {
    try {
      const response = await axios.get<{ users: AdminUser[] }>("/api/admin/users");
      setUsers(response.data.users);
    } catch {
      // silently fail
    }
  }

  async function loadReviews() {
    try {
      const response = await axios.get<{ reviews: AdminReview[] }>("/api/admin/reviews");
      setReviews(response.data.reviews);
    } catch {
      // silently fail
    }
  }

  async function loadBanners() {
    try {
      const response = await axios.get<{ banners: AdminBanner[] }>("/api/admin/banners");
      setBanners(response.data.banners);
    } catch {
      // silently fail
    }
  }

  async function addBanner() {
    if (!bannerFile) {
      setError("Choose an image for the banner first.");
      return;
    }

    setBannerSaving(true);
    setError("");
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("file", bannerFile);
      const uploadRes = await axios.post("/api/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const response = await axios.post<{ banner: AdminBanner }>("/api/admin/banners", {
        imageUrl: uploadRes.data.url,
        title: bannerTitle || null,
        subtitle: bannerSubtitle || null,
        linkUrl: bannerLinkUrl || null,
      });

      setBanners((current) => [...current, response.data.banner]);
      setBannerFile(null);
      setBannerTitle("");
      setBannerSubtitle("");
      setBannerLinkUrl("");
      setMessage("Banner added — it's now live on the homepage.");
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || "Unable to add banner");
      } else {
        setError("Unable to add banner");
      }
    } finally {
      setBannerSaving(false);
    }
  }

  async function toggleBannerActive(banner: AdminBanner) {
    setBusyBannerId(banner.id);
    setError("");
    setMessage("");
    try {
      await axios.patch(`/api/admin/banners/${banner.id}`, { isActive: !banner.isActive });
      setBanners((current) =>
        current.map((item) => (item.id === banner.id ? { ...item, isActive: !banner.isActive } : item))
      );
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || "Unable to update banner");
      }
    } finally {
      setBusyBannerId(null);
    }
  }

  async function moveBanner(banner: AdminBanner, direction: "up" | "down") {
    const sorted = [...banners].sort((a, b) => a.sortOrder - b.sortOrder);
    const index = sorted.findIndex((item) => item.id === banner.id);
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= sorted.length) return;

    const neighbor = sorted[swapIndex];
    setBusyBannerId(banner.id);
    setError("");

    try {
      await Promise.all([
        axios.patch(`/api/admin/banners/${banner.id}`, { sortOrder: neighbor.sortOrder }),
        axios.patch(`/api/admin/banners/${neighbor.id}`, { sortOrder: banner.sortOrder }),
      ]);
      setBanners((current) =>
        current.map((item) => {
          if (item.id === banner.id) return { ...item, sortOrder: neighbor.sortOrder };
          if (item.id === neighbor.id) return { ...item, sortOrder: banner.sortOrder };
          return item;
        })
      );
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || "Unable to reorder banners");
      }
    } finally {
      setBusyBannerId(null);
    }
  }

  async function deleteBanner(banner: AdminBanner) {
    const confirmed = window.confirm("Remove this banner from the homepage?");
    if (!confirmed) return;

    setBusyBannerId(banner.id);
    setError("");
    try {
      await axios.delete(`/api/admin/banners/${banner.id}`);
      setBanners((current) => current.filter((item) => item.id !== banner.id));
      setMessage("Banner removed.");
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || "Unable to delete banner");
      }
    } finally {
      setBusyBannerId(null);
    }
  }

  async function approveSeller(storeId: string) {
    setBusyStoreId(storeId);
    try {
      await axios.patch(`/api/admin/approve-seller/${storeId}`);
      setPendingSellers((current) => current.filter((s) => s.id !== storeId));
      setMessage("Seller approved successfully. Approval email sent.");
      loadStores();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || "Unable to approve seller");
      }
    } finally {
      setBusyStoreId(null);
    }
  }

  const totals = useMemo(() => {
    return stores.reduce(
      (acc, store) => {
        acc.stores += 1;
        acc.products += store.stats.productCount;
        acc.orders += store.stats.orderCount;
        acc.revenue += store.stats.revenue;
        return acc;
      },
      { stores: 0, products: 0, orders: 0, revenue: 0 }
    );
  }, [stores]);

  const filteredStores = useMemo(() => {
    let list = stores;

    if (storeFilter === "pending") {
      list = list.filter((store) => !store.isApproved);
    } else if (storeFilter === "approved") {
      list = list.filter((store) => store.isApproved);
    } else if (storeFilter === "banned") {
      list = list.filter((store) => !store.isActive);
    }

    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      (store) =>
        store.name.toLowerCase().includes(q) ||
        store.slug.toLowerCase().includes(q) ||
        store.seller.full_name.toLowerCase().includes(q) ||
        store.seller.email.toLowerCase().includes(q)
    );
  }, [stores, searchQuery, storeFilter]);

  const filteredUsers = useMemo(() => {
    if (!userSearch.trim()) return users;
    const q = userSearch.toLowerCase();
    return users.filter(
      (user) =>
        user.full_name.toLowerCase().includes(q) ||
        user.email.toLowerCase().includes(q)
    );
  }, [users, userSearch]);

  const filteredReviews = useMemo(() => {
    if (!reviewSearch.trim()) return reviews;
    const q = reviewSearch.toLowerCase();
    return reviews.filter(
      (review) =>
        review.user.full_name.toLowerCase().includes(q) ||
        review.book.title.toLowerCase().includes(q) ||
        (review.comment || "").toLowerCase().includes(q)
    );
  }, [reviews, reviewSearch]);

  async function toggleBan(store: AdminStore) {
    setBusyStoreId(store.id);
    setError("");
    setMessage("");
    try {
      await axios.patch(`/api/admin/stores/${store.id}`, {
        isActive: !store.isActive,
      });
      setStores((current) =>
        current.map((item) =>
          item.id === store.id ? { ...item, isActive: !store.isActive } : item
        )
      );
      setMessage(store.isActive ? "Seller banned." : "Seller unbanned.");
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || "Unable to update seller");
      }
    } finally {
      setBusyStoreId(null);
    }
  }

  async function toggleVerify(store: AdminStore) {
    setBusyStoreId(store.id);
    setError("");
    setMessage("");
    try {
      await axios.patch(`/api/admin/stores/${store.id}`, {
        isVerified: !store.isVerified,
      });
      setStores((current) =>
        current.map((item) =>
          item.id === store.id ? { ...item, isVerified: !store.isVerified } : item
        )
      );
      setMessage(store.isVerified ? "Verification removed." : "Seller verified.");
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || "Unable to update verification");
      }
    } finally {
      setBusyStoreId(null);
    }
  }

  async function deleteSeller(store: AdminStore) {
    const confirmed = window.confirm(
      `Delete seller ${store.seller.full_name} and store ${store.name}?`
    );
    if (!confirmed) return;

    setBusyStoreId(store.id);
    setError("");
    setMessage("");
    try {
      await axios.delete(`/api/admin/stores/${store.id}`);
      setStores((current) => current.filter((item) => item.id !== store.id));
      setMessage("Seller deleted successfully.");
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || "Unable to delete seller");
      }
    } finally {
      setBusyStoreId(null);
    }
  }

  async function toggleUserBlock(user: AdminUser) {
    setBusyUserId(user.id);
    setError("");
    setMessage("");

    try {
      await axios.patch("/api/admin/users", {
        userId: user.id,
        isBlocked: !user.isBlocked,
      });

      setUsers((current) =>
        current.map((item) =>
          item.id === user.id ? { ...item, isBlocked: !user.isBlocked } : item
        )
      );
      setMessage(user.isBlocked ? "User unblocked." : "User blocked.");
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || "Unable to update user");
      } else {
        setError("Unable to update user");
      }
    } finally {
      setBusyUserId(null);
    }
  }

  async function deleteReview(reviewId: string) {
    const confirmed = window.confirm("Delete this review permanently?");
    if (!confirmed) return;

    setBusyReviewId(reviewId);
    setError("");
    setMessage("");

    try {
      await axios.delete(`/api/admin/reviews?reviewId=${reviewId}`);
      setReviews((current) => current.filter((item) => item.id !== reviewId));
      setMessage("Review deleted successfully.");
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || "Unable to delete review");
      } else {
        setError("Unable to delete review");
      }
    } finally {
      setBusyReviewId(null);
    }
  }

  async function sendSellerMail() {
    setMailSending(true);
    setError("");
    setMessage("");

    try {
      const response = await axios.post("/api/admin/send-message", {
        recipientMode: mailRecipientMode,
        storeId: mailRecipientMode === "single" ? mailStoreId : undefined,
        subject: mailSubject,
        message: mailMessage,
      });

      setMessage(response.data.message || "Message sent successfully.");
      setMailMessage("");
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || "Unable to send message");
      } else {
        setError("Unable to send message");
      }
    } finally {
      setMailSending(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 p-8">
        <div className="mx-auto max-w-7xl">
          <div className="h-40 animate-pulse rounded-2xl bg-white shadow-sm" />
          <div className="mt-6 space-y-5">
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-72 animate-pulse rounded-2xl bg-white shadow-sm" />
            ))}
          </div>
        </div>
      </main>
    );
  }

  const activeNavLabel = NAV_ITEMS.find((item) => item.key === activeSection)?.label ?? "";

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto flex max-w-[1600px]">
        {/* SIDEBAR */}
        <aside className="sticky top-0 hidden h-screen w-64 flex-shrink-0 flex-col border-r border-slate-200 bg-white lg:flex">
          <div className="border-b border-slate-200 px-6 py-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
              BookMandu
            </p>
            <h1 className="mt-1 text-lg font-bold text-slate-900">Admin Console</h1>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-4">
            <ul className="space-y-1">
              {NAV_ITEMS.map((item) => {
                const isActive = item.key === activeSection;
                const badgeCount =
                  item.key === "stores" ? pendingSellers.length : undefined;
                return (
                  <li key={item.key}>
                    <button
                      type="button"
                      onClick={() => setActiveSection(item.key)}
                      className={`flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                        isActive
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <span className={isActive ? "text-white" : "text-slate-400"}>
                          {item.icon}
                        </span>
                        {item.label}
                      </span>
                      {!!badgeCount && (
                        <span
                          className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs font-bold ${
                            isActive
                              ? "bg-white/20 text-white"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {badgeCount}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>

            <div className="mt-4 border-t border-slate-200 pt-4">
              <Link
                href="/admin/academic"
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
              >
                <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-slate-400">
                  <path d="M12 3 2 8l10 5 8-4v6h2V8L12 3Zm-6 9.5V17c0 1.66 3.13 3 6 3s6-1.34 6-3v-4.5l-6 3-6-3Z" fill="currentColor" />
                </svg>
                Academic Management
              </Link>
            </div>
          </nav>

          <div className="border-t border-slate-200 px-6 py-4">
            <p className="text-xs text-slate-400">Signed in as Admin</p>
          </div>
        </aside>

        {/* CONTENT COLUMN */}
        <div className="flex min-h-screen flex-1 flex-col">
          {/* TOP TAB BAR (mobile + tablet, also acts as section title on desktop) */}
          <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur">
            <div className="flex items-center justify-between px-4 py-4 lg:px-8">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600 lg:hidden">
                  BookMandu Admin
                </p>
                <h2 className="text-xl font-bold text-slate-900 lg:text-2xl">
                  {activeNavLabel}
                </h2>
              </div>
            </div>

            {/* Horizontal tabs — primary nav on mobile, quick-switch on desktop */}
            <div className="flex gap-1 overflow-x-auto px-4 pb-3 lg:hidden">
              {NAV_ITEMS.map((item) => {
                const isActive = item.key === activeSection;
                const badgeCount =
                  item.key === "stores" ? pendingSellers.length : undefined;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setActiveSection(item.key)}
                    className={`flex flex-shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                      isActive
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {item.label}
                    {!!badgeCount && (
                      <span
                        className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs font-bold ${
                          isActive ? "bg-white/20 text-white" : "bg-amber-200 text-amber-800"
                        }`}
                      >
                        {badgeCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </header>

          {/* BANNERS */}
          <div className="px-4 pt-4 lg:px-8">
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 font-medium text-red-700">
                {error}
              </div>
            )}
            {message && (
              <div className="mt-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 font-medium text-green-700">
                {message}
              </div>
            )}
          </div>

          {/* SECTION CONTENT */}
          <div className="flex-1 px-4 py-6 lg:px-8 lg:py-8">
            {activeSection === "overview" && (
              <OverviewSection
                totals={totals}
                pendingCount={pendingSellers.length}
                storeCount={stores.length}
                userCount={users.length}
                reviewCount={reviews.length}
                onNavigate={setActiveSection}
              />
            )}

            {activeSection === "stores" && (
              <StoresSection
                stores={filteredStores}
                allStoresEmpty={stores.length === 0}
                pendingSellers={pendingSellers}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                storeFilter={storeFilter}
                onFilterChange={setStoreFilter}
                busyStoreId={busyStoreId}
                onApproveSeller={approveSeller}
                onToggleVerify={toggleVerify}
                onToggleBan={toggleBan}
                onDeleteSeller={deleteSeller}
              />
            )}

            {activeSection === "users" && (
              <UsersSection
                users={filteredUsers}
                searchQuery={userSearch}
                onSearchChange={setUserSearch}
                busyUserId={busyUserId}
                onToggleBlock={toggleUserBlock}
              />
            )}

            {activeSection === "reviews" && (
              <ReviewsSection
                reviews={filteredReviews}
                searchQuery={reviewSearch}
                onSearchChange={setReviewSearch}
                busyReviewId={busyReviewId}
                onDeleteReview={deleteReview}
              />
            )}

            {activeSection === "banners" && (
              <BannersSection
                banners={banners}
                busyBannerId={busyBannerId}
                onToggleActive={toggleBannerActive}
                onMove={moveBanner}
                onDelete={deleteBanner}
                file={bannerFile}
                onFileChange={setBannerFile}
                title={bannerTitle}
                onTitleChange={setBannerTitle}
                subtitle={bannerSubtitle}
                onSubtitleChange={setBannerSubtitle}
                linkUrl={bannerLinkUrl}
                onLinkUrlChange={setBannerLinkUrl}
                saving={bannerSaving}
                onAdd={addBanner}
              />
            )}

            {activeSection === "messages" && (
              <MessagesSection
                stores={stores}
                recipientMode={mailRecipientMode}
                onRecipientModeChange={(mode) => {
                  setMailRecipientMode(mode);
                  if (mode === "single" && !mailStoreId && stores[0]) {
                    setMailStoreId(stores[0].id);
                  }
                }}
                storeId={mailStoreId}
                onStoreIdChange={setMailStoreId}
                subject={mailSubject}
                onSubjectChange={setMailSubject}
                messageBody={mailMessage}
                onMessageChange={setMailMessage}
                sending={mailSending}
                onSend={sendSellerMail}
              />
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

/* --------------------------------------------------------------------- */
/* Shared bits                                                            */
/* --------------------------------------------------------------------- */

function SummaryCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </div>
  );
}

/* --------------------------------------------------------------------- */
/* Dashboard Overview                                                     */
/* --------------------------------------------------------------------- */

function OverviewSection({
  totals,
  pendingCount,
  storeCount,
  userCount,
  reviewCount,
  onNavigate,
}: {
  totals: { stores: number; products: number; orders: number; revenue: number };
  pendingCount: number;
  storeCount: number;
  userCount: number;
  reviewCount: number;
  onNavigate: (section: SectionKey) => void;
}) {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <SummaryCard label="Stores" value={totals.stores} />
        <SummaryCard label="Products" value={totals.products} />
        <SummaryCard label="Orders" value={totals.orders} />
        <SummaryCard label="Revenue" value={`Rs. ${totals.revenue.toLocaleString()}`} />
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <QuickLinkCard
          title="Seller Verification"
          description={
            pendingCount > 0
              ? `${pendingCount} request${pendingCount === 1 ? "" : "s"} waiting for review`
              : "No pending seller requests"
          }
          highlight={pendingCount > 0}
          onClick={() => onNavigate("stores")}
        />
        <QuickLinkCard
          title="User Management"
          description={`${userCount} registered buyer & seller account${userCount === 1 ? "" : "s"}`}
          onClick={() => onNavigate("users")}
        />
        <QuickLinkCard
          title="Reviews"
          description={`${reviewCount} review${reviewCount === 1 ? "" : "s"} across all stores`}
          onClick={() => onNavigate("reviews")}
        />
        <QuickLinkCard
          title="Messages"
          description={`${storeCount} seller${storeCount === 1 ? "" : "s"} reachable via email`}
          onClick={() => onNavigate("messages")}
        />
      </div>
    </div>
  );
}

function QuickLinkCard({
  title,
  description,
  highlight,
  onClick,
}: {
  title: string;
  description: string;
  highlight?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-start gap-2 rounded-2xl border p-5 text-left shadow-sm transition hover:shadow-md ${
        highlight ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-white"
      }`}
    >
      <h3 className="text-lg font-bold text-slate-900">{title}</h3>
      <p className="text-sm text-slate-500">{description}</p>
      <span className="mt-2 text-sm font-semibold text-indigo-600">Open →</span>
    </button>
  );
}

/* --------------------------------------------------------------------- */
/* Seller Verification (pending requests + all stores)                   */
/* --------------------------------------------------------------------- */

function StoresSection({
  stores,
  allStoresEmpty,
  pendingSellers,
  searchQuery,
  onSearchChange,
  storeFilter,
  onFilterChange,
  busyStoreId,
  onApproveSeller,
  onToggleVerify,
  onToggleBan,
  onDeleteSeller,
}: {
  stores: AdminStore[];
  allStoresEmpty: boolean;
  pendingSellers: PendingSeller[];
  searchQuery: string;
  onSearchChange: (value: string) => void;
  storeFilter: "all" | "pending" | "approved" | "banned";
  onFilterChange: (value: "all" | "pending" | "approved" | "banned") => void;
  busyStoreId: string | null;
  onApproveSeller: (storeId: string) => void;
  onToggleVerify: (store: AdminStore) => void;
  onToggleBan: (store: AdminStore) => void;
  onDeleteSeller: (store: AdminStore) => void;
}) {
  const filterOptions: { key: typeof storeFilter; label: string }[] = [
    { key: "all", label: "All Stores" },
    { key: "pending", label: "Pending Requests" },
    { key: "approved", label: "Approved Sellers" },
    { key: "banned", label: "Rejected / Banned" },
  ];

  return (
    <div className="space-y-8">
      {/* PENDING SELLERS */}
      {pendingSellers.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-slate-900 mb-4">
            🕐 Pending Seller Approvals ({pendingSellers.length})
          </h2>
          <div className="space-y-4">
            {pendingSellers.map((store) => (
              <div
                key={store.id}
                className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h3 className="text-lg font-bold">{store.name}</h3>
                    <p className="mt-1 text-sm text-slate-600">
                      Seller: {store.seller.full_name} · {store.seller.email}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      Phone: {store.phone || "N/A"}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Submitted: {new Date(store.createdAt).toLocaleDateString()}
                    </p>

                    {store.identityUrl && (
                      <div className="mt-3">
                        <p className="text-sm font-medium text-slate-700 mb-2">Identity Document:</p>
                        <Image
                          src={store.identityUrl}
                          alt="Identity document"
                          width={300}
                          height={200}
                          className="rounded-xl border border-slate-200 object-cover"
                        />
                      </div>
                    )}
                  </div>

                  <button
                    disabled={busyStoreId === store.id}
                    onClick={() => onApproveSeller(store.id)}
                    className="rounded-xl bg-green-600 px-6 py-3 font-semibold text-white transition hover:bg-green-700 disabled:opacity-60 h-fit"
                  >
                    {busyStoreId === store.id ? "Approving..." : "Approve Seller"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ALL STORES */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-slate-900">Stores</h2>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by store name, slug, seller or email..."
            className="w-full max-w-sm rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-indigo-400 focus:outline-none"
          />
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto">
          {filterOptions.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => onFilterChange(option.key)}
              className={`flex-shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
                storeFilter === option.key
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {allStoresEmpty ? (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
            <h2 className="text-2xl font-bold">No seller stores found</h2>
            <p className="mt-2 text-slate-500">Stores will appear here once sellers create them.</p>
          </div>
        ) : stores.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
            <h2 className="text-2xl font-bold">No matching stores</h2>
            <p className="mt-2 text-slate-500">Try a different search term or filter.</p>
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            {stores.map((store) => (
              <section
                key={store.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-2xl font-bold">{store.name}</h2>
                      <span className={`rounded-full border px-3 py-1 text-xs font-bold ${
                        store.isApproved
                          ? "border-green-200 bg-green-50 text-green-700"
                          : "border-amber-200 bg-amber-50 text-amber-700"
                      }`}>
                        {store.isApproved ? "APPROVED" : "PENDING"}
                      </span>
                      <span className={`rounded-full border px-3 py-1 text-xs font-bold ${
                        store.isActive
                          ? "border-blue-200 bg-blue-50 text-blue-700"
                          : "border-red-200 bg-red-50 text-red-700"
                      }`}>
                        {store.isActive ? "ACTIVE" : "BANNED"}
                      </span>
                      <span className={`rounded-full border px-3 py-1 text-xs font-bold ${
                        store.isVerified
                          ? "border-purple-200 bg-purple-50 text-purple-700"
                          : "border-slate-200 bg-slate-50 text-slate-500"
                      }`}>
                        {store.isVerified ? "VERIFIED" : "UNVERIFIED"}
                      </span>
                    </div>

                    <p className="mt-2 text-sm text-slate-500">
                      Seller: {store.seller.full_name} · {store.seller.email}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Store slug: {store.slug}
                    </p>
                    {store.description && (
                      <p className="mt-3 max-w-3xl text-slate-600">{store.description}</p>
                    )}
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      disabled={busyStoreId === store.id}
                      onClick={() => onToggleVerify(store)}
                      className={`rounded-xl px-5 py-3 font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                        store.isVerified
                          ? "border border-slate-200 text-slate-600 hover:bg-slate-50"
                          : "bg-purple-600 text-white hover:bg-purple-700"
                      }`}
                    >
                      {store.isVerified ? "Remove Verification" : "Verify Seller"}
                    </button>

                    <button
                      type="button"
                      disabled={busyStoreId === store.id}
                      onClick={() => onToggleBan(store)}
                      className={`rounded-xl px-5 py-3 font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                        store.isActive
                          ? "bg-amber-500 text-white hover:bg-amber-600"
                          : "bg-green-600 text-white hover:bg-green-700"
                      }`}
                    >
                      {store.isActive ? "Ban Seller" : "Unban Seller"}
                    </button>

                    <button
                      type="button"
                      disabled={busyStoreId === store.id}
                      onClick={() => onDeleteSeller(store)}
                      className="rounded-xl border border-red-200 px-5 py-3 font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Delete Seller
                    </button>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-4">
                  <SummaryCard label="Products" value={store.stats.productCount} />
                  <SummaryCard label="Orders" value={store.stats.orderCount} />
                  <SummaryCard label="Sold Qty" value={store.stats.totalSold} />
                  <SummaryCard label="Sales" value={`Rs. ${store.stats.revenue.toLocaleString()}`} />
                </div>

                <div className="mt-6 grid gap-5 xl:grid-cols-2">
                  <div>
                    <h3 className="text-lg font-bold">Products</h3>
                    <div className="mt-3 overflow-hidden rounded-xl border border-slate-200">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-100 text-slate-600">
                          <tr>
                            <th className="px-4 py-3">Book</th>
                            <th className="px-4 py-3">Price</th>
                            <th className="px-4 py-3">Stock</th>
                            <th className="px-4 py-3">Sold</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {store.books.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="px-4 py-6 text-center text-slate-500">
                                No products in this store.
                              </td>
                            </tr>
                          ) : (
                            store.books.map((book) => (
                              <tr key={book.id}>
                                <td className="px-4 py-3">
                                  <p className="font-semibold">{book.title}</p>
                                  <p className="text-xs text-slate-500">
                                    {book.author || "Unknown author"} · ISBN: {book.isbn || "N/A"}
                                  </p>
                                </td>
                                <td className="px-4 py-3">Rs. {book.price}</td>
                                <td className="px-4 py-3">{book.stockQty}</td>
                                <td className="px-4 py-3">
                                  {book.soldQty}
                                  <p className="text-xs text-slate-500">Rs. {book.salesAmount}</p>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold">Sales Details</h3>
                    <div className="mt-3 space-y-3">
                      {store.sales.length === 0 ? (
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center text-slate-500">
                          No sales yet.
                        </div>
                      ) : (
                        store.sales.slice(0, 8).map((sale) => (
                          <div key={sale.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <p className="font-semibold">{sale.bookTitle}</p>
                                <p className="mt-1 text-xs text-slate-500">
                                  Order #{sale.orderId.slice(0, 8)} · {new Date(sale.createdAt).toLocaleDateString()}
                                </p>
                                <p className="mt-1 text-xs text-slate-500">
                                  {sale.customerName} · {sale.customerPhone}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold">Rs. {sale.totalPrice}</p>
                                <p className="mt-1 text-xs text-slate-500">
                                  Qty {sale.quantity} · {sale.orderStatus}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* --------------------------------------------------------------------- */
/* User Management                                                        */
/* --------------------------------------------------------------------- */

function UsersSection({
  users,
  searchQuery,
  onSearchChange,
  busyUserId,
  onToggleBlock,
}: {
  users: AdminUser[];
  searchQuery: string;
  onSearchChange: (value: string) => void;
  busyUserId: string | null;
  onToggleBlock: (user: AdminUser) => void;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">
            User control
          </p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900">
            Search and block users
          </h2>
          <p className="mt-2 max-w-3xl text-sm text-slate-500">
            Find a buyer or seller by name or email, then block or unblock them from the platform.
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search user name or email..."
          className="w-full max-w-md rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-400 focus:outline-none"
        />
      </div>

      <div className="mt-5 grid gap-4">
        {users.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-slate-500">
            No users found.
          </div>
        ) : (
          users.map((user) => (
            <div key={user.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-lg font-bold text-slate-900">{user.full_name}</h3>
                    <span className={`rounded-full border px-3 py-1 text-xs font-bold ${user.isBlocked ? "border-red-200 bg-red-50 text-red-700" : "border-green-200 bg-green-50 text-green-700"}`}>
                      {user.isBlocked ? "BLOCKED" : "ACTIVE"}
                    </span>
                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-600">
                      {user.role}
                    </span>
                    <span className={`rounded-full border px-3 py-1 text-xs font-bold ${user.isVerified ? "border-blue-200 bg-blue-50 text-blue-700" : "border-slate-200 bg-slate-100 text-slate-500"}`}>
                      {user.isVerified ? "VERIFIED" : "UNVERIFIED"}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{user.email}</p>
                  <p className="mt-1 text-xs text-slate-400">Joined: {new Date(user.created_at).toLocaleDateString()}</p>
                  {user.store && (
                    <p className="mt-2 text-sm text-slate-500">
                      Store: {user.store.name} {user.store.isApproved ? "(approved)" : "(pending)"}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  disabled={busyUserId === user.id}
                  onClick={() => onToggleBlock(user)}
                  className={`rounded-xl px-5 py-3 font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${user.isBlocked ? "border border-green-200 text-green-700 hover:bg-green-50" : "bg-red-600 text-white hover:bg-red-700"}`}
                >
                  {busyUserId === user.id ? "Saving..." : user.isBlocked ? "Unblock User" : "Block User"}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

/* --------------------------------------------------------------------- */
/* Reviews                                                                 */
/* --------------------------------------------------------------------- */

function ReviewsSection({
  reviews,
  searchQuery,
  onSearchChange,
  busyReviewId,
  onDeleteReview,
}: {
  reviews: AdminReview[];
  searchQuery: string;
  onSearchChange: (value: string) => void;
  busyReviewId: string | null;
  onDeleteReview: (reviewId: string) => void;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">
            Review moderation
          </p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900">
            Delete user reviews
          </h2>
          <p className="mt-2 max-w-3xl text-sm text-slate-500">
            Search recent reviews by book, reviewer, or comment and delete anything inappropriate.
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search review, book, or reviewer..."
          className="w-full max-w-md rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-400 focus:outline-none"
        />
      </div>

      <div className="mt-5 grid gap-4">
        {reviews.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-slate-500">
            No reviews found.
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-lg font-bold text-slate-900">{review.book.title}</h3>
                    <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
                      {review.rating}/5
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">
                    By {review.user.full_name} · {review.user.email}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {new Date(review.createdAt).toLocaleString()}
                  </p>
                  {review.comment && (
                    <p className="mt-3 max-w-3xl text-sm text-slate-700">{review.comment}</p>
                  )}
                </div>

                <button
                  type="button"
                  disabled={busyReviewId === review.id}
                  onClick={() => onDeleteReview(review.id)}
                  className="rounded-xl border border-red-200 px-5 py-3 font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {busyReviewId === review.id ? "Deleting..." : "Delete Review"}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

/* --------------------------------------------------------------------- */
/* Homepage Banners                                                       */
/* --------------------------------------------------------------------- */

function BannersSection({
  banners,
  busyBannerId,
  onToggleActive,
  onMove,
  onDelete,
  file,
  onFileChange,
  title,
  onTitleChange,
  subtitle,
  onSubtitleChange,
  linkUrl,
  onLinkUrlChange,
  saving,
  onAdd,
}: {
  banners: AdminBanner[];
  busyBannerId: string | null;
  onToggleActive: (banner: AdminBanner) => void;
  onMove: (banner: AdminBanner, direction: "up" | "down") => void;
  onDelete: (banner: AdminBanner) => void;
  file: File | null;
  onFileChange: (file: File | null) => void;
  title: string;
  onTitleChange: (value: string) => void;
  subtitle: string;
  onSubtitleChange: (value: string) => void;
  linkUrl: string;
  onLinkUrlChange: (value: string) => void;
  saving: boolean;
  onAdd: () => void;
}) {
  const sorted = [...banners].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="space-y-8">
      {/* Add new banner */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">Add a homepage banner</h2>
        <p className="mt-1 text-sm text-slate-500">
          Appears in the rotating banner at the top of the homepage. Recommended size: 1600×600px, under 5MB.
        </p>

        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <div>
            <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-8 transition hover:border-indigo-300 hover:bg-indigo-50">
              <span className="text-3xl">🖼️</span>
              <div className="text-center">
                <p className="text-sm font-medium text-slate-700">Click to upload banner image</p>
                <p className="mt-1 text-xs text-slate-400">PNG, JPG, or WEBP up to 10MB</p>
              </div>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => onFileChange(e.target.files?.[0] || null)}
              />
            </label>
            {file && <p className="mt-2 text-xs text-slate-500">✓ Selected: {file.name}</p>}
          </div>

          <div className="flex flex-col gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Title (optional)</label>
              <input
                type="text"
                value={title}
                onChange={(e) => onTitleChange(e.target.value)}
                placeholder="Spring Sale is Live!"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-50"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Subtitle (optional)</label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => onSubtitleChange(e.target.value)}
                placeholder="Up to 40% off selected books"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-50"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Link (optional)</label>
              <input
                type="text"
                value={linkUrl}
                onChange={(e) => onLinkUrlChange(e.target.value)}
                placeholder="https://bookmandu.vercel.app/books?category=fiction"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-50"
              />
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onAdd}
          disabled={saving || !file}
          className="mt-5 rounded-xl bg-indigo-600 px-8 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
        >
          {saving ? "Adding banner..." : "Add Banner"}
        </button>
      </section>

      {/* Existing banners */}
      <section>
        <h2 className="mb-4 text-xl font-bold text-slate-900">
          Live banners <span className="font-normal text-slate-400">({sorted.length})</span>
        </h2>

        {sorted.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
            <h3 className="text-lg font-bold text-slate-900">No banners yet</h3>
            <p className="mt-2 text-slate-500">
              The homepage will show its default welcome hero until you add one here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {sorted.map((banner, index) => (
              <div
                key={banner.id}
                className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center"
              >
                <div className="relative h-28 w-full shrink-0 overflow-hidden rounded-xl bg-slate-100 sm:w-48">
                  <Image src={banner.imageUrl} alt={banner.title || "Banner"} fill className="object-cover" />
                  {!banner.isActive && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-xs font-bold uppercase tracking-wide text-white">
                      Hidden
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-slate-900">{banner.title || "Untitled banner"}</p>
                  {banner.subtitle && <p className="truncate text-sm text-slate-500">{banner.subtitle}</p>}
                  {banner.linkUrl && (
                    <p className="mt-1 truncate text-xs text-indigo-500">{banner.linkUrl}</p>
                  )}
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onMove(banner, "up")}
                    disabled={index === 0 || busyBannerId === banner.id}
                    aria-label="Move banner up"
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => onMove(banner, "down")}
                    disabled={index === sorted.length - 1 || busyBannerId === banner.id}
                    aria-label="Move banner down"
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => onToggleActive(banner)}
                    disabled={busyBannerId === banner.id}
                    className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {banner.isActive ? "Hide" : "Show"}
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(banner)}
                    disabled={busyBannerId === banner.id}
                    className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
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
  );
}

/* --------------------------------------------------------------------- */
/* Messages                                                                */
/* --------------------------------------------------------------------- */

function MessagesSection({
  stores,
  recipientMode,
  onRecipientModeChange,
  storeId,
  onStoreIdChange,
  subject,
  onSubjectChange,
  messageBody,
  onMessageChange,
  sending,
  onSend,
}: {
  stores: AdminStore[];
  recipientMode: "all" | "single";
  onRecipientModeChange: (mode: "all" | "single") => void;
  storeId: string;
  onStoreIdChange: (id: string) => void;
  subject: string;
  onSubjectChange: (value: string) => void;
  messageBody: string;
  onMessageChange: (value: string) => void;
  sending: boolean;
  onSend: () => void;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">
            Seller messaging
          </p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900">
            Send updates to sellers
          </h2>
          <p className="mt-2 max-w-3xl text-sm text-slate-500">
            Use this panel to send approval notes, policy updates, or any admin message through Resend.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Recipient
          <select
            value={recipientMode}
            onChange={(e) => onRecipientModeChange(e.target.value as "all" | "single")}
            className="rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-400 focus:outline-none"
          >
            <option value="all">All sellers</option>
            <option value="single">One seller</option>
          </select>
        </label>

        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Seller store
          <select
            value={storeId}
            onChange={(e) => onStoreIdChange(e.target.value)}
            disabled={recipientMode === "all"}
            className="rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-400 focus:outline-none disabled:bg-slate-100"
          >
            {stores.length === 0 ? (
              <option value="">No stores available</option>
            ) : (
              stores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.name} - {store.seller.full_name}
                </option>
              ))
            )}
          </select>
        </label>
      </div>

      <div className="mt-4 grid gap-4">
        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Subject
          <input
            type="text"
            value={subject}
            onChange={(e) => onSubjectChange(e.target.value)}
            className="rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-400 focus:outline-none"
            placeholder="Example: Policy update from BookMandu"
          />
        </label>

        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Message
          <textarea
            value={messageBody}
            onChange={(e) => onMessageChange(e.target.value)}
            rows={6}
            className="rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-400 focus:outline-none"
            placeholder="Write the message you want to send to sellers..."
          />
        </label>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onSend}
          disabled={sending || !messageBody.trim() || !subject.trim() || (recipientMode === "single" && !storeId)}
          className="rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {sending ? "Sending..." : "Send Email"}
        </button>
        <p className="text-sm text-slate-500">
          Resend will deliver the email to the selected seller or all seller accounts.
        </p>
      </div>
    </section>
  );
}