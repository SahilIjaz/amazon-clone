# Amazon rebuild

A working rebuild of amazon.com: browse, search, product pages, cart, sign-up with e-mailed one-time passwords, checkout, order history, lists, reviews, deals, help and account settings.

Built with Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4 and libSQL (SQLite locally, Turso in production). The agent session that produced it is logged in [`.agent-logs/`](.agent-logs/).

## Run locally

```bash
npm install
npm run dev          # http://localhost:3000
```

No configuration is needed. Verification codes and order confirmations are kept in a local inbox at `/dev/inbox`; add SMTP variables to have them e-mailed for real:

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=you@gmail.com
SMTP_PASS=app-password
MAIL_FROM="Amazon <you@gmail.com>"
```

Production build: `npm run build && npm start`. If a dev server is running in the same folder, build into a separate directory: `NEXT_DIST_DIR=.next-prod npm run build`.

## What's in the box

| Area | Routes |
|---|---|
| Home | `/` hero carousel, card grid, product rows, browsing-history row when signed in |
| Search | `/s?k=…&i=…` refinements (department, category, reviews, price, deals, brands, Prime), sort, pagination |
| Product | `/dp/:id/:slug` gallery, buy box, related items, reviews with histogram, `/review/create/:id` |
| Cart | `/cart` quantities, delete, save for later, guest cart merged on sign-in |
| Auth | `/ap/signin`, `/ap/register` (OTP), `/ap/forgotpassword` (OTP), `/api/auth/logout` |
| Checkout | `/checkout` addresses, payment methods (demo cards, last four digits stored), shipping speed, `/checkout/thankyou` |
| Account | `/your-account`, `/your-account/{addresses,payments,security,prime}`, `/gp/css/order-history`, `/gp/css/order-details`, `/hz/wishlist/ls`, `/gp/history` |
| Store | `/deals`, `/gp/help/customer/display.html`, `/customer-preferences/edit` |

## Data

Amazon's own listings and imagery are copyrighted, so the catalog is a public product dataset (194 items across 9 departments, `src/data/products.json`, images in `public/products`), normalised with Amazon-style fields: list price, rating, review counts, Prime eligibility, stock.

The database schema lives in `src/lib/db.ts` (users, sessions, OTP codes, outbox, addresses, payment methods, carts, orders, lists, reviews, browsing history). In production the SQLite file is mirrored to a Vercel Blob after every write and refreshed from it across serverless instances (`BLOB_READ_WRITE_TOKEN`), so accounts, carts and orders persist. Set `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` to use a hosted Turso database instead.

## Deploy

The repository is connected to Vercel: every push to `main` deploys. Set the SMTP variables (and Turso, if wanted) in the project's Environment Variables.

## What was left out on purpose

Prime Video, Kindle, Alexa and other digital products; third-party seller marketplace mechanics; real payment processing; personalised ads. Everything a shopper touches on the way from the home page to a placed order is here and works end to end.
