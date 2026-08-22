export default function BrandPanel() {
  return (
    <div className="relative hidden w-full max-w-[380px] shrink-0 flex-col overflow-hidden bg-linear-to-br from-indigo-700 via-indigo-800 to-slate-900 p-10 text-white lg:flex">
      <div className="absolute top-10 -left-10 h-64 w-64 rounded-full bg-indigo-400/20 blur-3xl" />
      <div className="absolute bottom-10 -right-10 h-64 w-64 rounded-full bg-purple-400/20 blur-3xl" />

      <div className="relative z-10 flex h-full flex-col">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-black">📚 Book<span className="text-amber-400">Mandu</span></h1>
          <p className="mt-1 text-sm font-semibold text-slate-200">Books. Notes. Knowledge. <span className="text-amber-400">For Everyone.</span></p>
          <p className="mt-3 text-sm text-slate-300">Buy, sell and discover books from trusted sellers across Nepal.</p>
        </div>

        <div className="mt-8 flex flex-1 flex-col justify-center gap-3">
          <div className="flex items-start gap-3 rounded-2xl bg-linear-to-r from-orange-500/90 to-pink-500/90 p-4 shadow-lg">
            <span className="text-2xl">🎁</span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold">10% OFF First Order</h3>
                <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide">New</span>
              </div>
              <p className="mt-0.5 text-xs text-white/90">
                Welcome to BookMandu! Use code <span className="font-mono font-semibold">FIRST10</span> on your first order.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-2xl bg-white/10 p-4 backdrop-blur-md">
            <span className="text-2xl">🛡️</span>
            <div>
              <h3 className="text-sm font-semibold">Verified Sellers Only</h3>
              <p className="mt-0.5 text-xs text-slate-300">Every store is reviewed by our team before it can list a book.</p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-2xl bg-white/10 p-4 backdrop-blur-md">
            <span className="text-2xl">🚚</span>
            <div>
              <h3 className="text-sm font-semibold">Cash on Delivery</h3>
              <p className="mt-0.5 text-xs text-slate-300">Pay when your books arrive. Nepal-wide delivery.</p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-2xl bg-white/10 p-4 backdrop-blur-md">
            <span className="text-2xl">🎓</span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold">Study Hub</h3>
                <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide">New</span>
              </div>
              <p className="mt-0.5 text-xs text-slate-300">Notes &amp; question papers for Class 1–12 and Universities.</p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-2xl bg-white/10 p-4 backdrop-blur-md">
            <span className="text-2xl">🪙</span>
            <div>
              <h3 className="text-sm font-semibold">Contribute &amp; Earn Credits</h3>
              <p className="mt-0.5 text-xs text-slate-300">Share approved notes and earn BookMandu Credits. Redeem and save!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
