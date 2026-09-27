# Alchemy

Social commerce + community investment for tier 2–3 India. Hindi/English UI,
React Native (Expo) client, Node/Express/MongoDB API.

Every purchase splits three ways — **90% seller, 5% referrer, 5% community
investment pool** — and the pool lends to local businesses. Buyers earn a
share of the pool just by shopping.

## Layout

```
Alchemy/
├── backend/                  Node + Express + MongoDB
│   ├── docker-compose.yml    local mongo (no mongod installed on this machine)
│   └── src/
│       ├── config/           env + db connection, the 90/5/5 split constant
│       ├── models/           User, Product, Post, Transaction, Pool
│       ├── middleware/       auth, optionalAuth, zod validate, errors
│       ├── controllers/      auth, users, products, posts, transactions, pool
│       ├── routes/           one router per resource, mounted at /api
│       ├── seedData.js       demo users, products, posts, funded businesses
│       ├── devServer.js      API + in-memory mongo, zero setup
│       └── server.js         API against a real mongo
└── mobile/                   Expo (SDK 57, RN 0.86)
    └── src/
        ├── api/              fetch client + typed endpoint map
        ├── store/            zustand: auth, feed, shop, wallet, pool
        ├── i18n/             en.js + hi.js dictionaries, translate()
        ├── theme/            colors, spacing, radius, type scale
        ├── components/       Button, TextField, Avatar, Badge, StatCard,
        │                     ProductCard, PostCard, Screen, EmptyState
        ├── navigation/       RootNavigator (auth ⇄ app), TabNavigator
        └── screens/
            ├── auth/         LoginScreen, OtpScreen
            ├── FeedScreen            social feed, product tags, like/comment/share
            ├── ShopScreen            grid, search, category + sort filters
            ├── ProductDetailScreen   buy flow, shows the split before paying
            ├── WalletScreen          balance, cashback, ledger, top-up
            ├── PoolScreen            fund balance, funded businesses, your share %
            └── ProfileScreen         earnings, referral link, language toggle
```

## Run it

**Backend** — no MongoDB is installed on this machine, so the fastest path is
the in-memory server (it seeds itself on boot):

```bash
cd backend
npm install
npm run dev:mem          # API on :4000, in-memory mongo, demo data loaded
```

With a real MongoDB (`docker compose up -d`, or Atlas — set `MONGO_URI`):

```bash
npm run seed
npm run dev
```

**Mobile**

```bash
cd mobile
npm install
npm start               # then press a for Android, i for iOS
```

The client resolves the API host from the Expo dev server URI, so a physical
phone on the same Wi-Fi works with no edits. Override with
`EXPO_PUBLIC_API_URL=http://192.168.1.5:4000/api npm start`.

## Demo accounts

Seeded users — any of these phone numbers logs in. With `OTP_DEV_MODE=true`
the API returns the OTP in the response and the app pre-fills it.

| Phone | Who | Notes |
|---|---|---|
| 9834567890 | Anjali Kumari | buyer, ₹2,000 wallet, was referred by Ramesh |
| 9823456789 | Ramesh Yadav | earns the 5% referral cut on Anjali's purchases |
| 9812345678 | Sunita Devi | seller, owns all seeded products |

Plus six more community members holding pool units, so `pool.totalUnits`
equals the units actually held. That invariant matters: `recordReturn` divides
by `totalUnits`, so if the seed inflates it, most of a distributed return
silently stays in the fund instead of reaching holders.

## The money model

All amounts are **integer paise**. Never floats — rupee arithmetic on floats
drifts, and `splitAmount()` in `backend/src/utils/money.js` gives the rounding
remainder to the first party so the legs always sum to the total.

One purchase writes a parent `purchase` row plus one child row per leg, so the
ledger reconciles:

| Leg | Share | Notes |
|---|---|---|
| `seller_payout` | 90% | minus the cashback, which the seller funds |
| `referral_bonus` | 5% | to the buyer's referrer |
| `pool_contribution` | 5% | to the community fund, and mints pool units for the buyer |
| `cashback` | per-product % | credited to the buyer's wallet |

Two deliberate choices worth knowing:

- **A buyer with no referrer sends that 5% to the pool** instead of the seller,
  so the fund still grows on organic sales.
- **Pool units are minted to the buyer**, 1 unit per paise contributed. Share %
  is `userUnits / pool.totalUnits`, so it dilutes correctly as others shop.
  `POST /api/pool/businesses/:id/return` distributes returns pro-rata by units
  and keeps the rounding dust in the fund — on the seeded data a ₹500 return
  distributes ₹499.96 across nine holders.

Multi-document transactions are used **only when the deployment supports them**
(replica set / Atlas). A standalone `mongod` silently rejects them, so
`startSessionIfSupported()` degrades to sequential writes.

## API

| Method | Path | Auth | |
|---|---|---|---|
| POST | `/api/auth/request-otp` | — | creates the user on first contact; rate-limited 5/10min |
| POST | `/api/auth/verify-otp` | — | returns JWT; accepts name/city for signup |
| GET | `/api/auth/me` | ✓ | |
| PATCH | `/api/users/me` | ✓ | name, city, language, role |
| GET | `/api/users/me/summary` | ✓ | everything the Profile screen needs |
| GET | `/api/products` | — | `q, category, minPrice, maxPrice, city, sort, page` |
| GET | `/api/products/:id` | — | |
| POST | `/api/products` | ✓ | seller creates a listing |
| GET | `/api/products/meta/categories` | — | with counts, for the filter chips |
| GET | `/api/posts` | optional | `likedByMe` is set when a token is sent |
| POST | `/api/posts` | ✓ | `text, images, taggedProducts` |
| POST | `/api/posts/:id/like` | ✓ | toggles |
| POST | `/api/posts/:id/comment` | ✓ | |
| POST | `/api/posts/:id/share` | ✓ | returns a referral-tagged share URL |
| GET | `/api/transactions` | ✓ | the user's ledger |
| GET | `/api/transactions/wallet` | ✓ | balance + headline totals |
| POST | `/api/transactions/purchase` | ✓ | runs the split |
| POST | `/api/transactions/topup` | ✓ | stands in for a payment gateway callback |
| GET | `/api/pool` | optional | fund snapshot; includes your share when signed in |
| GET | `/api/pool/me` | ✓ | units, share %, value |
| POST | `/api/pool/businesses` | ✓ | fund a business out of the pool |
| POST | `/api/pool/businesses/:id/return` | ✓ | book a return, distribute pro-rata |

## Built for low-end Android

- Flat colours, no gradients or elevation — cheap panels crush subtle greys.
- Tab icons are text glyphs, not an icon font: one less asset, and they scale
  with the system font size.
- No chart library; the pool share bar is a single `View`.
- Every `FlatList` is tuned (`initialNumToRender`, `windowSize`,
  `removeClippedSubviews`) and `PostCard` is memoized so a like doesn't
  re-render the feed.
- 48dp minimum touch targets throughout.
- Search input is debounced 400ms so a 2G connection isn't hit per keystroke.

## Before production

These are scaffolded as stubs and need real work:

- **OTP delivery** — `backend/src/utils/otp.js` only logs. Wire MSG91/Gupshup,
  and set `OTP_DEV_MODE=false` so the OTP stops coming back in the response.
- **Payments** — `/transactions/topup` credits the wallet with no gateway.
  Replace with a Razorpay/UPI webhook that verifies the signature.
- **Pool admin endpoints** — `POST /pool/businesses` and the return endpoint
  are open to any signed-in user. They need an admin role check.
- **Compliance** — a pooled fund paying returns to retail contributors is a
  regulated activity in India. Get this reviewed before taking real money.
- **Images** — products/posts take URLs; there is no upload pipeline yet.
