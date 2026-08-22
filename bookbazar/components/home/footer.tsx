import Link from "next/link";

export default function Footer() {
  return (
<footer className="border-t border-slate-200 bg-slate-50 text-slate-700">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <span>📚</span> BookMandu
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-500">
              Nepal's trusted online book marketplace. Buy and sell new or used books with ease.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-slate-400">
              Quick Links
            </h3>
            <ul className="space-y-3 text-sm text-slate-600">
              <li>
                <Link href="/" className="hover:text-indigo-600 transition-colors">Home</Link>
              </li>
              <li>
                <Link href="/books" className="hover:text-indigo-600 transition-colors">Books</Link>
              </li>
              <li>
                <Link href="/help" className="hover:text-indigo-600 transition-colors">How we function</Link>
              </li>
              <li>
                <Link href="/seller" className="hover:text-indigo-600 transition-colors">Become a Seller</Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-slate-400">
              Categories
            </h3>
            <ul className="space-y-3 text-sm text-slate-600">
              <li><Link href="/books?category=fiction" className="hover:text-indigo-600 transition-colors">Fiction</Link></li>
              <li><Link href="/books?category=non-fiction" className="hover:text-indigo-600 transition-colors">Non-Fiction</Link></li>
              <li><Link href="/books?category=self-improvement" className="hover:text-indigo-600 transition-colors">Self Improvement</Link></li>
              <li><Link href="/books?category=business" className="hover:text-indigo-600 transition-colors">Business</Link></li>
              <li><Link href="/books?category=technology" className="hover:text-indigo-600 transition-colors">Technology</Link></li>
              <li><Link href="/books?category=academic" className="hover:text-indigo-600 transition-colors">Academic</Link></li>
              <li><Link href="/books?category=others" className="hover:text-indigo-600 transition-colors">Others</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-slate-400">
              Contact
            </h3>
            <ul className="space-y-3 text-sm text-slate-600">
              <li className="flex items-center gap-2">
                <span>📧</span>
                <a href="mailto:karnakreeshal@gmail.com" className="hover:text-indigo-600 transition-colors">karnakreeshal@gmail.com</a>
              </li>
              <li className="flex items-center gap-2">
                <span>📍</span> Kathmandu, Nepal
              </li>
              <li className="flex items-center gap-2">
                <span>📞</span> +977 9827897983
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 border-t border-slate-100 pt-6">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-sm text-slate-400">
              © 2026 BookMandu. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm text-slate-400">
              <Link href="/privacy" className="hover:text-indigo-600 transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-indigo-600 transition-colors">Terms of Service</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}