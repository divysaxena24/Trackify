# 🚀 Trackify

**Trackify** is a modern price tracking web application that allows users to track product prices in real time, visualize price history, and manage tracked products through a clean, responsive dashboard.

---

## ✨ Features

- 🔐 Google Authentication (Supabase OAuth)
- 🔗 Track products by URL (Amazon, Walmart, etc.)
- 🧠 Automatic product scraping (name, price, image, currency)
- 📈 Price history tracking with interactive charts
- 🗑️ Secure product deletion
- 🔁 Prevents duplicate tracking per user
- 📱 Fully responsive UI (mobile & desktop)
- ⚡ Fast updates using Next.js Server Actions
- 🔔 Price drop notifications
- ⏰ Scheduled background price checks
- 📊 Analytics dashboard
- 🌍 Support for more e-commerce sites
- 🧩 Chrome Extension

---

## 🛠️ Tech Stack

- **Frontend:** Next.js (App Router)
- **Backend:** Next.js Server Actions
- **Database & Auth:** Supabase
- **Styling:** Tailwind CSS + shadcn/ui
- **Charts:** Custom Price History Chart
- **Scraping:** Firecrawl-based product scraper

---

## 🧩 Database Schema

### products
- id
- user_id
- url
- name
- image_url
- current_price
- currency
- created_at
- updated_at

### price_history
- id
- product_id
- price
- currency
- checked_at

> Each user can track a product URL only once.

---

## 🔐 Authentication

Google OAuth using Supabase:

```js
await supabase.auth.signInWithOAuth({
  provider: "google",
  options: {
    redirectTo: `${origin}/auth/callback`,
  },
});
```

## 🔄 Core Functionality

### Add Product
- User submits product URL  
- URL is normalized  
- Product details are scraped  
- Product is upserted (unique per user + URL)  
- Price history is stored only if the price changes  

### View Products
- Users see only their tracked products  
- Each product card shows:
  - Image  
  - Name  
  - Current price  
  - Tracked since date  
  - Price history chart  

### Delete Product
- Secure deletion using `user_id` check  
- Associated price history removed automatically  

---

## 🧪 Security & Data Integrity

- User-based row filtering (`user_id`)
- Composite unique constraint on `(user_id, url)`
- Server-side validation
- Secure delete operations
- Error-safe database queries

---

## 🧱 Project Structure

```txt
app/
 ├─ actions/
 ├─ components/
 │   ├─ ProductGrid.jsx
 │   ├─ PriceChart.jsx
 │   ├─ DeleteButton.jsx
 ├─ auth/
 ├─ page.jsx
 └─ layout.jsx

utils/
 └─ supabase/

lib/
 └─ firecrawl.js
```

## 🚀 Getting Started

### Clone the repository
```bash
git clone https://github.com/your-username/trackify.git
cd trackify
```

### Install dependencies
```
npm install
```
### Environment Variables

Create a .env.local file:

```
 NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```


### Run the app
```
npm run dev
```

### 🌱 Future Enhancements
  
  - 🌍 Support for more e-commerce sites
  
  - 💳 Subscription plans (SaaS)

### 🙌 Author

  Built by Divya Saxena as a full-stack project showcasing real-world problem solving with Next.js and   Supabase.
