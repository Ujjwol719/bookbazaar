"use client";

import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/home/footer";
import Image from "next/image";

interface WishlistItem {
  id: string;
  book: {
    id: string;
    slug: string;
    title: string;
    author: string | null;
    price: number;
    stockQty: number;
    imageUrl: string | null;
  };
}

export default function WishlistPage() {
  const router = useRouter();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyBookId, setBusyBookId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const result = await axios.get<WishlistItem[]>("/api/wishlist/get");
        setItems(result.data);
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 401) {
          router.push("/login");
          return;
        }
        setError("Unable to load your wishlist");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

  async function removeFromWishlist(bookId: string) {
    setBusyBookId(bookId);
    try {
      await axios.post("/api/wishlist/toggle", { bookId });
      setItems((current) => current.filter((item) => item.book.id !== bookId));
    } catch {
      setError("Unable to remove item");
    } finally {
      setBusyBookId(null);
    }
  }

  async function addToCart(bookId: string) {
    setBusyBookId(bookId);
    try {
      await axios.post("/api/cart/add", { bookID: bookId });
      router.push("/cart");
    } catch {
      setError("Unable to add to cart");
      setBusyBookId(null);
    }
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-slate-50 p-6 md:p-8">
          <div className="mx-auto max-w-6xl">
            <div className="h-24 animate-pulse rounded-2xl bg-white shadow-sm" />
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-72 animate-pulse rounded-2xl bg-white shadow-sm" />
              ))}
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-slate-50 px-4 py-8 md:px-6 md:py-12">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h1 className="text-3xl font-bold text-slate-900 md:text-4xl">Your Wishlist</h1>
            <p className="mt-2 text-slate-500">Books you&apos;ve saved for later.</p>
          </div>

          {error && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 font-medium text-red-700">
              {error}
            </div>
          )}

          {items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
              <h2 className="text-2xl font-bold text-slate-900">Your wishlist is empty</h2>
              <p className="mt-2 text-slate-500">
                Tap the heart on any book to save it here for later.
              </p>
              <button
                onClick={() => router.push("/books")}
                className="mt-6 rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-700"
              >
                Browse Books
              </button>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                >
                  <Link href={`/books/${item.book.slug}`} className="relative h-56 w-full overflow-hidden bg-indigo-50">
                    {item.book.imageUrl ? (
                      <Image src={item.book.imageUrl} alt={item.book.title} fill className="object-cover" sizes="320px" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-5xl">📚</div>
                    )}
                  </Link>

                  <div className="flex flex-1 flex-col p-5">
                    <Link href={`/books/${item.book.slug}`} className="line-clamp-2 font-bold text-slate-900 hover:text-indigo-600">
                      {item.book.title}
                    </Link>
                    <p className="mt-1 text-sm text-slate-500">{item.book.author || "Unknown Author"}</p>
                    <p className="mt-3 text-lg font-bold text-indigo-600">Rs. {Number(item.book.price)}</p>

                    <div className="mt-auto flex flex-col gap-2 pt-4">
                      <button
                        onClick={() => addToCart(item.book.id)}
                        disabled={busyBookId === item.book.id || item.book.stockQty === 0}
                        className="rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {item.book.stockQty === 0 ? "Out of stock" : "Add to Cart"}
                      </button>
                      <button
                        onClick={() => removeFromWishlist(item.book.id)}
                        disabled={busyBookId === item.book.id}
                        className="rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
