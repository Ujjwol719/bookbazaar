'use client'

import axios from "axios";
import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics";

type BookViewTrackerProps = {
  bookId: string;
  title: string;
  price: number;
  author?: string | null;
  slug: string;
  // Known server-side (the book page already decrypts the session for
  // wishlist state) — avoids a wasted tracking call for guests.
  loggedIn?: boolean;
};

export default function BookViewTracker({ bookId, title, price, author, slug, loggedIn }: BookViewTrackerProps) {
  useEffect(() => {
    trackEvent("view_item", {
      currency: "NPR",
      value: price,
      items: [
        {
          item_id: bookId,
          item_name: title,
          item_category: author || "Unknown Author",
          item_variant: slug,
          price,
          quantity: 1,
        },
      ],
    });

    if (loggedIn) {
      axios.post("/api/recently-viewed", { bookId }).catch(() => {
        // Homepage "recently viewed" row just won't include this one — not worth surfacing.
      });
    }
  }, [bookId, title, price, author, slug, loggedIn]);

  return null;
}
