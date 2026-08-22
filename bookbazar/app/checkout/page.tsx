'use client'
import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { trackEvent } from "@/lib/analytics";

interface book {
  id: string
  quantity: number
  book: {
    title: string
    description: string
    author: string
    price: number
  }
}

export default function checkout() {
  const [fullName, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [books, setBooks] = useState<book[]>([])
  const router = useRouter()
  const [paymentMethod, setPaymentMethod] = useState("COD")
  const [creditBalance, setCreditBalance] = useState(0)
  const [creditValue, setCreditValue] = useState(1)
  const [useCredits, setUseCredits] = useState(false)

 const handleSubmit = async (e: any) => {
  e.preventDefault();

  if (!fullName.trim()) {
    alert("Please enter your full name");
    return;
  }

  if (!phone.trim()) {
    alert("Please enter your phone number");
    return;
  }

  if (!address.trim()) {
    alert("Please enter your address");
    return;
  }

  if (!city.trim()) {
    alert("Please enter your city");
    return;
  }

  if (!state.trim()) {
    alert("Please enter your state");
    return;
  }

  if (!postalCode.trim()) {
    alert("Please enter your postal code");
    return;
  }

  try {
    const response = await axios.post(
      "/api/order/create",
      {
        fullName,
        phone,
        shippingAddr: address,
        city,
        state,
        postalCode,
        creditsToApply: useCredits ? maxRedeemableCredits : 0,
      }
    );

      trackEvent("purchase", {
        transaction_id: response.data.order?.id,
        currency: "NPR",
        value: total,
        items: books.map((item) => ({
          item_id: item.id,
          item_name: item.book.title,
          price: item.book.price,
          quantity: item.quantity,
        })),
      })

    const creditsMsg = response.data.creditsUsed > 0 ? ` ${response.data.creditsUsed} credits were applied — Rs. ${response.data.amountDue} due on delivery.` : "";
    alert(`Order placed successfully. Your delivery code is ${response.data.deliveryCode}. Share it with the seller only after receiving the product.${creditsMsg}`);
    router.push("/orders");
  } catch (error) {
    if (axios.isAxiosError(error)) {
      alert(
        error.response?.data?.message ||
        "Failed to place order"
      );

      console.log(error.response?.data);
    }
  }
};

  useEffect(() => {
    const fetch = async () => {
      const response = await axios.get("api/cart/get")
      if (response.data) {
        setBooks(response.data)
      }
    }
    fetch()

    axios.get("/api/credits/wallet").then((res) => {
      setCreditBalance(res.data.balance)
      setCreditValue(Number(res.data.creditValueInRupees) || 1)
    }).catch(() => {
      // Not logged in yet or wallet unavailable — credits section just won't show.
    })
  }, [])

  const total = books.reduce((sum, items) => sum + items.quantity * items.book.price, 0)
  const maxRedeemableCredits = Math.min(creditBalance, Math.floor(total / creditValue))
  const creditsRupeeValue = Math.round(maxRedeemableCredits * creditValue * 100) / 100
  const amountDue = useCredits ? total - creditsRupeeValue : total

  useEffect(() => {
    if (books.length === 0) {
      return;
    }

    trackEvent("begin_checkout", {
      currency: "NPR",
      value: total,
      items: books.map((item) => ({
        item_id: item.id,
        item_name: item.book.title,
        price: item.book.price,
        quantity: item.quantity,
      })),
    })
  }, [books, total])

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 md:py-12 md:px-6">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">Almost there</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900 md:text-3xl">Checkout</h1>
        </div>

        <div className="flex flex-col gap-8 lg:flex-row lg:items-start">

          {/* Shipping Form */}
          <div className="w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8 lg:w-1/2">
            <h2 className="mb-6 text-xl font-bold text-slate-900 md:text-2xl">
              Shipping Information
            </h2>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-black">

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-50"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+977 98XXXXXXXX"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-50"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Address
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street address"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Kathmandu"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-50"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">State</label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="Bagmati"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-50"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Postal Code
                </label>
                <input
                  type="text"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="44600"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-50"
                />
              </div>

              {/* Payment Method */}
              <div className="mt-2">
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-widest text-slate-400">
                  Payment Method
                </h3>
                <label className="flex cursor-pointer items-center gap-4 rounded-xl border border-indigo-200 bg-indigo-50 p-4 transition hover:border-indigo-400">
                  <input
                    type="radio"
                    name="payment"
                    value="COD"
                    checked={paymentMethod === "COD"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="h-4 w-4 accent-indigo-600"
                  />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Cash on Delivery</p>
                    <p className="text-xs text-slate-500">Pay when your order arrives.</p>
                  </div>
                </label>
              </div>

              <button
                type="submit"
                className="mt-2 w-full rounded-xl bg-indigo-600 py-4 text-sm font-bold text-white shadow-lg transition hover:bg-indigo-700 active:scale-95"
              >
                Place Order
              </button>

            </form>
          </div>

          {/* Order Summary */}
          <div className="w-full lg:w-1/2">
            <h2 className="mb-4 text-xl font-bold text-slate-900 md:text-2xl">
              Order Summary
            </h2>

            <div className="space-y-4">
              {books.map((c) => (
                <div
                  key={c.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
                >
                  <div className="flex gap-4">
                    <div
                      className="flex h-24 w-16 shrink-0 items-center justify-center rounded-xl text-3xl text-white md:h-28 md:w-20"
                      style={{ backgroundImage: "linear-gradient(135deg, #6366f1 0%, #9333ea 100%)" }}
                    >
                      📚
                    </div>
                    <div className="flex flex-1 flex-col justify-between">
                      <div>
                        <h3 className="font-bold text-slate-900 line-clamp-1">{c.book.title}</h3>
                        <p className="mt-0.5 text-xs text-slate-500">✍️ {c.book.author}</p>
                        <p className="mt-2 line-clamp-2 text-xs text-slate-500">{c.book.description}</p>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600">
                          Qty: {c.quantity}
                        </span>
                        <span className="text-sm font-bold text-slate-900">
                          Rs. {c.book.price}
                        </span>
                        <span className="text-sm font-bold text-green-600">
                          = Rs. {c.quantity * c.book.price}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* BookMandu Credits */}
            {creditBalance > 0 && (
              <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={useCredits}
                    onChange={(e) => setUseCredits(e.target.checked)}
                    disabled={maxRedeemableCredits === 0}
                    className="mt-0.5 h-4 w-4 accent-emerald-600"
                  />
                  <div>
                    <p className="text-sm font-semibold text-emerald-900">
                      Use your BookMandu Credits — you have {creditBalance}
                    </p>
                    <p className="mt-0.5 text-xs text-emerald-700">
                      {maxRedeemableCredits > 0
                        ? `Applying ${maxRedeemableCredits} credits saves Rs. ${creditsRupeeValue} on this order.`
                        : "Earned by contributing approved notes to Study Hub."}
                    </p>
                  </div>
                </label>
              </div>
            )}

            {/* Grand Total */}
            <div className="mt-6 rounded-2xl border border-indigo-100 bg-indigo-50 p-5">
              {useCredits && creditsRupeeValue > 0 && (
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-slate-500">Order total</span>
                  <span className="text-slate-500 line-through">Rs. {total}</span>
                </div>
              )}
              {useCredits && creditsRupeeValue > 0 && (
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-emerald-700">Credits applied</span>
                  <span className="font-semibold text-emerald-700">− Rs. {creditsRupeeValue}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">{useCredits && creditsRupeeValue > 0 ? "Due on delivery" : "Grand Total"}</span>
                <span className="text-2xl font-bold text-indigo-600 md:text-3xl">
                  Rs. {amountDue}
                </span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}