# 🛒 Django Marketplace (Stripe Connect)

A multi-vendor marketplace where:
- Sellers can register and upload products
- Buyers can register and purchase products
- Payments are processed using **Stripe Connect**
- Platform takes a commission automatically

---

## 🚀 Project Setup

### 1️⃣ Clone or Download Project

Place the project folder on your computer.

### 2️⃣ Create Virtual Environment

**Windows**
```bash
python -m venv env
env\Scripts\activate
```

**Mac/Linux**
```bash
python3 -m venv env
source env/bin/activate
```

---

### 3️⃣ Install Requirements

```bash
pip install -r requirements.txt
```

---

### 4️⃣ Add Stripe API Keys

Open:

```
marketplace_project/settings.py
```

Replace:

```python
STRIPE_PUBLIC_KEY = "pk_test_xxx"
STRIPE_SECRET_KEY = "sk_test_xxx"
```

with your real Stripe test keys from  
👉 https://dashboard.stripe.com/test/apikeys

---

### 5️⃣ Apply Database Migrations

```bash
python manage.py makemigrations
python manage.py migrate
```

---

### 6️⃣ Create Admin User

```bash
python manage.py createsuperuser
```

Follow prompts.

---

### 7️⃣ Run Development Server

```bash
python manage.py runserver
```

Open in browser:

```
http://127.0.0.1:8000/products/
```

---

## 👤 User Flow

### Sellers
1. Register as **Seller**
2. (Next step you will add Stripe onboarding)
3. Add products

### Buyers
1. Register as **Buyer**
2. Browse products
3. Click **Buy**
4. Pay using Stripe Checkout

---

## 💳 Stripe Webhook Setup (IMPORTANT)

Install Stripe CLI:

https://stripe.com/docs/stripe-cli

Login:

```bash
stripe login
```

Forward webhooks to your server:

```bash
stripe listen --forward-to localhost:8000/payments/webhook/
```

This allows Django to receive payment confirmations.

---

## 🖼 Media Files (Product Images)

Images are stored in `/media/`

Already configured in settings:
```python
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'
```

---

## 💰 Platform Commission

Inside:

`payments/views.py`

You’ll see:

```python
"application_fee_amount": int(product.price * 100 * 0.10)
```

Change `0.10` to adjust your commission.

---



## 🌍 Deployment


Backend → **Render**
Frontend/Static → **Vercel**
Database → **PostgreSQL (Render provides)**

---


Features You Can Add

- Seller dashboard
- Order history
- Product categories
- Reviews & ratings
- Search & filters
- Esewa/Khalti for Nepal users

---

Made with Django + Stripe Connect 💙
"# local-market" 
"# local-market" 
