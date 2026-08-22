# BookMandu

BookMandu is a full-stack online book marketplace built with Next.js 16, PostgreSQL, Prisma, Redis, and Cloudinary. It connects buyers, sellers, and administrators through a seamless book-buying and selling experience.

🌐 **Live Demo:** [bookmandu.vercel.app](https://www.bookmandu.vercel.app)

---

## Features

### Buyer
- Browse active book listings across all stores
- Search books by title, author, description, or ISBN
- Filter books by category
- View detailed book pages with cover image, description, author, price, and ISBN
- Add books to cart and manage cart items
- Checkout with shipping details (name, phone, address, city, state, postal code)
- View order history and track order status

### Seller
- Register and create a store
- Add books with title, author, ISBN, category, price, stock quantity, description, and cover image
- Upload book cover images via Cloudinary
- Edit and soft-delete book listings
- View and manage incoming orders
- Update order status

### Admin
- Manage users and sellers
- Approve or reject seller applications
- Ban or unban seller accounts
- Monitor platform activity and listings

### Auth and Security
- Email and password signup and login
- JWT session cookies signed with `jose`
- Passwords hashed with `bcryptjs`
- Login rate limiting with Redis — blocks after repeated failed attempts, resets after 15 minutes
- Role-based middleware protecting `/admin`, `/seller`, and `/buyer` routes

### AI Chatbot
- Built-in AI book assistant powered by Google Gemini via the Vercel AI SDK
- Answers buyer questions about available books
- Recommends titles based on user queries
- Provides pricing and store information
- Strictly limited to books listed on the platform

### Media
- Book cover image uploads handled server-side via Cloudinary
- Optimized image delivery with Next.js Image component
- Secure upload flow — API secret never exposed to the client

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS |
| Backend | Next.js API Routes, REST APIs |
| Database | PostgreSQL (Neon) |
| ORM | Prisma 7 |
| Auth | JWT, jose, bcryptjs |
| Storage | Cloudinary |
| Caching & Rate Limiting | Redis (Upstash) |
| AI | Google Gemini via Vercel AI SDK |
| Deployment | Vercel |

---

## Repository Structure

```
bookbazaar/
├── app/
│   ├── api/          # REST endpoints (auth, book, cart, order, upload, chat)
│   ├── buyer/        # Buyer pages (cart, checkout, orders)
│   ├── seller/       # Seller dashboard (books, orders)
│   ├── admin/        # Admin dashboard
│   ├── books/        # Public book listing and detail pages
│   └── lib/          # Session and type definitions
├── components/       # Navbar, Footer, shared UI
├── lib/              # Prisma client, Redis client, utilities
├── prisma/           # Schema and migrations
├── middleware.ts     # Route protection
└── .env              # Environment variables
```


---

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database (Neon recommended)
- Redis server (Upstash recommended)
- Cloudinary account
- Google Gemini API key

### Install dependencies

```bash
cd bookbazaar
npm install
```

### Environment variables

Create a `.env` file in the `bookbazaar/` directory:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE
SESSION_SECRET=your-session-secret
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-key
CLOUDINARY_API_SECRET=your-cloudinary-secret
REDIS_URL=rediss://default:password@your-upstash-host:6379
GOOGLE_GENERATIVE_AI_API_KEY=your-gemini-api-key
NEXT_PUBLIC_APP_URL=https://bookmandu.vercel.app
GOOGLE_CLIENT_ID=your-google-oauth-client-id
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret
```

`GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` come from a Google Cloud Console OAuth client (Web application type), with authorized redirect URI `${NEXT_PUBLIC_APP_URL}/api/auth/google/callback` — see `/api/auth/google` and `/api/auth/google/callback`.

### Generate Prisma client and run migrations

```bash
npx prisma generate
npx prisma migrate deploy
```

### Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Generate Prisma client and build for production |
| `npm run start` | Run the production build |
| `npm run lint` | Run ESLint |

---

## Auth Flow

- Signup and login handled via `app/api/auth/`
- Passwords hashed with `bcryptjs` before storage
- On login, a signed JWT is issued as an HTTP-only session cookie using `jose`
- Middleware checks the session cookie and decodes the role to protect routes
- Redis tracks failed login attempts per email — rate limited to prevent brute-force attacks

---

## Database Schema

| Model | Description |
|---|---|
| `User` | Buyers, sellers, and admins |
| `Store` | Belongs to a seller, contains book listings |
| `Book` | Belongs to a store, supports soft delete via `isActive` |
| `Category` | Book categories with slug-based upsert |
| `CartItem` | Buyer cart before checkout |
| `Order` | Checkout order with shipping details |
| `OrderItem` | Individual books within an order |

---

## Book Lifecycle

1. Seller creates a book listing with cover image upload
2. Book is stored with `isActive: true`
3. Buyers browse and add books to cart
4. On checkout, an order is created with order items
5. Seller views and updates order status
6. If a seller deletes a book, it is soft-deleted (`isActive: false`) — order history is preserved

---

## Troubleshooting

- If login fails repeatedly, wait 15 minutes for the rate limit to reset
- Ensure `SESSION_SECRET` is set before starting the server
- Confirm `DATABASE_URL` uses a valid PostgreSQL connection string
- Add `res.cloudinary.com` to `remotePatterns` in `next.config.ts` for image rendering
- Vercel deployments require all environment variables set in the Vercel dashboard

---

## Future Improvements

- Payment gateway integration (eSewa, Khalti)
- Book reviews and ratings system
- Seller analytics dashboard
- Email notifications for order updates
- Wishlist and saved books feature
- Advanced search with price range and condition filters
- Mobile app

---

## License

MIT
