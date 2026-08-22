'use client'

import Navbar from "@/components/Navbar"
import Footer from "@/components/home/footer"
import axios from "axios"
import { useEffect, useState } from "react"
import Image from "next/image"
import { buildWhatsAppLink } from "@/lib/whatsapp"

interface Order {
  id: string
  status: string
  totalAmount: string
  deliveryCode: string | null
  shippingAddr: string
  city: string
  state: string
  postalCode: string
  createdAt: string

  items: {
    id: string
    quantity: number
    unitPrice: string
    totalPrice: string

    book: {
      title: string
      author: string
      imageUrl:string |null
    }

    store: {
      name: string
      phone: string | null
    }
  }[]
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])

  useEffect(() => {
    async function getOrders() {
      const result = await axios.get("/api/order/get")

      if (result.data) {
        setOrders(result.data)
      }
    }

    getOrders()
  }, [])

  return (
    <>
    <Navbar/>
    <main className="min-h-screen bg-slate-50 py-12">
      <div className="mx-auto max-w-7xl px-6">

        {/* Header */}
        <div className="mb-10">
          <h1 className="text-5xl font-bold text-slate-900">
            My Orders
          </h1>

          <p className="mt-2 text-slate-600">
            Track your purchases and order history.
          </p>
        </div>

        {orders.length === 0 ? (
          <div className="rounded-3xl bg-white p-12 text-center shadow-lg">
            <h2 className="text-2xl font-bold text-slate-800">
              No Orders Found
            </h2>

            <p className="mt-3 text-slate-500">
              You haven&apos;t placed any orders yet.
            </p>
          </div>
        ) : (
          <div className="space-y-8">

            {orders.map((order) => (

              <div
                key={order.id}
                className="rounded-3xl bg-white p-8 shadow-lg border border-slate-100"
              >

                {/* Order Header */}
                <div className="flex items-center justify-between">

                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">
                      Order #{order.id.slice(0, 8)}
                    </h2>

                    <p className="mt-1 text-slate-500">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <span className="rounded-full bg-yellow-100 px-4 py-2 text-sm font-semibold text-yellow-700">
                    {order.status}
                  </span>

                </div>

                {/* Items */}
                <div className="mt-8 space-y-4">

                  {order.items.map((item) => (

                    <div
                      key={item.id}
                      className="rounded-2xl bg-slate-50 p-5 border border-slate-100"
                    >

                      <div className="flex gap-25">

                       <div className="flex h-32 w-full items-center justify-center rounded-xl bg-indigo-50 sm:w-24 overflow-hidden relative">
                         {item.book.imageUrl ? (
                           <Image
                             src={item.book.imageUrl}
                             alt={item.book.title}
                             fill
                             className="object-cover"
                             sizes="96px"
                           />
                         ) : (
                           <span className="text-5xl">📚</span>
                         )}
                       </div>
                        <div className="flex-1">

                          <h3 className="text-xl font-bold text-slate-900">
                            {item.book.title}
                          </h3>

                          <p className="mt-1 text-slate-500">
                            ✍️ {item.book.author}
                          </p>

                          <p className="mt-2 font-medium text-indigo-600">
                            Store: {item.store.name}
                          </p>

                          {(() => {
                            const whatsappLink = buildWhatsAppLink(
                              item.store.phone,
                              `Hi, I'm asking about order #${order.id.slice(0, 8)} (${item.book.title}).`
                            );
                            return whatsappLink ? (
                              <a
                                href={whatsappLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-green-700 hover:text-green-800"
                              >
                                <span aria-hidden="true">💬</span> Contact seller on WhatsApp
                              </a>
                            ) : null;
                          })()}

                          <div className="mt-4 flex flex-wrap gap-4">

                            <span className="rounded-full bg-indigo-50 px-3 py-1 text-sm font-semibold text-indigo-600">
                              Qty: {item.quantity}
                            </span>

                            <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
                              ₹ {Number(item.unitPrice)}
                            </span>

                            <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-700">
                              ₹ {Number(item.totalPrice)}
                            </span>

                          </div>

                        </div>

                      </div>

                    </div>

                  ))}

                </div>

                {/* Summary */}
                <div className="mt-8 border-t border-slate-200 pt-6">

                  {order.deliveryCode && (
                    <div className="mb-6 rounded-2xl border border-dashed border-indigo-200 bg-indigo-50 p-4">
                      <p className="text-sm font-semibold uppercase tracking-wide text-indigo-700">
                        Delivery code
                      </p>
                      <p className="mt-2 text-2xl font-bold text-indigo-700">
                        {order.deliveryCode}
                      </p>
                      <p className="mt-2 text-sm text-indigo-700/80">
                        Share this code with the seller only after you receive the product.
                      </p>
                    </div>
                  )}

                  <h4 className="text-lg font-bold text-slate-900">
                    Shipping Address
                  </h4>

                  <p className="mt-2 text-slate-600">
                    {order.shippingAddr}
                  </p>

                  <p className="text-slate-600">
                    {order.city}, {order.state}
                  </p>

                  <p className="text-slate-600">
                    {order.postalCode}
                  </p>

                  <div className="mt-6 flex items-center justify-between rounded-2xl bg-linear-to-r from-indigo-50 to-purple-50 p-5">

                    <span className="text-xl font-semibold text-slate-700">
                      Grand Total
                    </span>

                    <span className="text-3xl font-bold text-indigo-600">
                      ₹ {Number(order.totalAmount)}
                    </span>

                  </div>

                </div>

              </div>

            ))}

          </div>
        )}

      </div>
    </main>
    <Footer/>
    </>
  )
}