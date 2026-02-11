# 📋 Local Market UI Structure & Documentation

## 🏗️ Overall Architecture

The Local Market application is built with Django and uses a modular structure with the following main components:
- **Base Template** - Master template for all pages
- **Custom CSS** - Styling and responsive design
- **Multiple App Templates** - User, Products, Orders, Payments
- **Static Files** - CSS, JavaScript, images

---

## 📁 File Structure & Locations

### **Root Directory**
```
Local Market/
├── README.md                 # Project documentation
├── requirements.txt          # Python dependencies
└── mysite/                   # Main Django project folder
    ├── manage.py            # Django management script
    ├── db.sqlite3           # Database file
    └── ...
```

### **Templates Directory**
```
mysite/templates/
├── base.html                          # Base template (master layout)
├── home_landing.html                  # Landing page for visitors
├── home_dashboard.html                # Dashboard for logged-in users
└── [app_name]/templates/[app_name]/  # App-specific templates
```

### **Static Files Directory**
```
mysite/static/
└── css/
    └── style.css                      # Main stylesheet (381 lines)
```

### **Individual App Templates**

#### **Products App** (`mysite/products/templates/products/`)
- `product_list.html` - Grid of all products
- `product_detail.html` - Single product view with buy button
- `add_product.html` - Form to create new product
- `edit_product.html` - Form to edit existing product
- `delete_product.html` - Confirmation page for deletion

#### **Users App** (`mysite/users/templates/users/`)
- `login.html` - Login form with password toggle
- `register.html` - Registration form with account type selection

#### **Orders App** (`mysite/orders/templates/orders/`)
- `order_list.html` - User's order history

#### **Payments App** (`mysite/payments/templates/payments/`)
- `checkout.html` - Stripe payment page
- `success.html` - Payment successful confirmation
- `cancel.html` - Payment cancelled message

---

## 🎨 Design System

### **Color Palette**
- **Primary Gradient**: #667eea (Purple) → #764ba2 (Dark Purple)
- **Primary Color**: #007bff (Blue)
- **Success Color**: #28a745 (Green)
- **Danger Color**: #dc3545 (Red)
- **Dark Color**: #343a40 (Dark Gray)
- **Background**: #f8f9fa (Light Gray)
- **Text**: #333 (Dark Gray)

### **Typography**
- **Font Family**: Segoe UI, Tahoma, Geneva, Verdana, sans-serif
- **Heading Sizes**: H1 (3rem), H2 (2rem), H5 (1.5rem)
- **Body Text**: 1rem (16px)

### **Components**
- **Cards**: 12px border-radius, shadow 0 4px 15px
- **Buttons**: 8px border-radius, hover animations
- **Forms**: 8px border-radius with focus shadows
- **Icons**: Font Awesome 6.4.0 (CDN)

---

## 🧭 Navigation Structure

### **Main Navigation Bar** (`base.html`)
Located at the top of every page with:

**Logo Section:**
- 🏪 Local Market (clickable, links to home)

**Authenticated User Menu:**
- 🏠 Home → `/`
- ➕ Sell Product → `/products/add/`
- 👜 My Orders → `/orders/`
- 👤 User Dropdown
  - Logout → `/users/logout/`

**Unauthenticated User Menu:**
- 🏠 Home → `/`
- 🔐 Login → `/users/login/`
- 📝 Sign Up → `/users/register/`

**Features:**
- Responsive hamburger menu on mobile
- Gradient background
- Smooth transitions
- Font Awesome icons

---

## 📄 Page-by-Page Breakdown

### **1. HOME PAGE `/`**

#### **For Visitors (Non-Authenticated)**
**File:** `templates/home_landing.html`

**Sections:**
1. **Hero Section**
   - Title: "Welcome to Local Market"
   - Subtitle: Description of the platform
   - CTAs: Login & Get Started buttons
   - Large shopping bag icon graphic

2. **Statistics Cards**
   - Total Active Products ({{ total_products }})
   - Local Sellers Count ({{ total_sellers }})
   - 100% Secure Payments badge

3. **Why Choose Us (Features)**
   - 🔒 Secure Transactions (Stripe)
   - 👥 Community Focused
   - 🚀 Easy to Use
   - 🎧 24/7 Support

4. **Featured Products Grid**
   - 6 featured products displayed
   - Product name, seller, price
   - "Login to Buy" buttons
   - Product image/icon

5. **Final CTA Section**
   - "Ready to Join?" message
   - "Create Account" button

**Design:**
- Gradient background sections
- Hover animations on cards
- Responsive grid (mobile-first)
- Call-to-action focus

---

#### **For Logged-In Users (Dashboard)**
**File:** `templates/home_dashboard.html`

**Sections:**
1. **Personalized Welcome**
   - "Welcome back, [username]!"
   - User avatar placeholder icon

2. **Quick Stats Cards (4 cards)**
   - 📦 Your Products + Add link
   - 🛍️ Your Orders + View link
   - 🏪 All Products + Browse link
   - ❤️ Active Sellers + Discover link

3. **Recent Products Section**
   - 6 latest products
   - Buy Now & View Details buttons
   - Product details preview

4. **Quick Actions (4 cards)**
   - 📤 List a New Product → `/products/add/`
   - 🔍 Browse Products → `/products/`
   - 📋 View Your Orders → `/orders/`
   - ⚙️ Account Settings (future)

**Design:**
- Card-based layout
- Icon-driven interface
- Smooth hover effects
- Quick navigation cards with arrows

---

### **2. USER AUTHENTICATION**

#### **Login Page** `/users/login/`
**File:** `templates/users/login.html`

**Elements:**
- Centered form container
- Username field (text input)
- Password field with 👁️ toggle
- "Login" button (blue)
- "Sign up here" link for new users
- Non-field error display
- Bootstrap form styling

**Features:**
- Password visibility toggle (eye icon)
  - Click to show/hide password
  - Icon changes from 👁️ to 👁️‍🗨️
- Bootstrap 5 styling
- Form validation messages

#### **Register Page** `/users/register/`
**File:** `templates/users/register.html`

**Elements:**
- Centered form container
- Username field (with help text)
- Email field
- Password field with 👁️ toggle
- Confirm Password field with 👁️ toggle
- Account Type dropdown (Buyer/Seller)
- "Create Account" button (green)
- "Login here" link for existing users

**Features:**
- Password confirmation validation
- Account type selection
- Help text for each field
- Error message display
- Password toggle on both fields

---

### **3. PRODUCTS MANAGEMENT**

#### **Product List Page** `/products/`
**File:** `templates/products/product_list.html`

**Layout:**
- Section title: "Browse Products"
- Responsive grid (3 columns on desktop, 1-2 on mobile)

**Product Cards (each):**
- Box icon placeholder (or product image)
- Product name (h5, bold)
- Seller name with icon
- Price in green ($amount)
- Truncated description (max 15 words)
- "View Details" button (outline)
- "Buy Now" button (green)

**Empty State:**
- Large inbox icon
- "No products available" message
- "Be the first to sell!" button for sellers

**Design:**
- Card shadows with hover lift effect
- Gradient icon backgrounds
- Responsive spacing (g-4 gap)

---

#### **Product Detail Page** `/products/<id>/`
**File:** `templates/products/product_detail.html`

**Layout:**
- Back to Products link (top)
- Two-column layout:
  - Left: Product image/icon (250x400px placeholder)
  - Right: Product info

**Right Column Content:**
- Dropdown menu (⋮) for owners with:
  - ✏️ Edit Product
  - 🗑️ Delete Product
- Product name (h1)
- Listed date
- Price (large, green)

**Seller Info Card:**
- 🏪 Seller name (bold)
- Joined date

**Description Section:**
- Product description text

**For Product Owners:**
- Info alert: "This is your product..."
- Dropdown menu with edit/delete

**For Buyers:**
- "Buy Now" button (green, large)
- Stripe security badge

---

#### **Add Product Page** `/products/add/`
**File:** `templates/products/add_product.html`

**Form Fields:**
1. Product Name (text input)
2. Description (textarea, 5 rows)
3. Price (number input with $ prefix, step 0.01)
4. Product Image (file input with JPEG/PNG filter)

**Buttons:**
- "List Product" button (green, bold)
- "Cancel" button (outline secondary)

**Design:**
- Centered form card
- Gradient header
- Helper text for image
- Proper field spacing
- Bootstrap form styling

---

#### **Edit Product Page** `/products/<id>/edit/`
**File:** `templates/products/edit_product.html`

**Similar to Add Product:**
- Same form fields as add
- Shows current product image preview
- Fields pre-filled with current values
- "Save Changes" button (blue)
- "Cancel" button (outline)

---

#### **Delete Product Page** `/products/<id>/delete/`
**File:** `templates/products/delete_product.html`

**Elements:**
- Warning alert (yellow)
- Product preview card showing:
  - Product name
  - Price
- Confirmation message
- "Yes, Delete Product" button (red, bold)
- "Cancel" button (outline)
- Additional warning text

**Design:**
- Red border card
- High visibility warning
- Clear action buttons

---

### **4. ORDERS MANAGEMENT**

#### **Orders List Page** `/orders/`
**File:** `templates/orders/order_list.html`

**Order Cards (each):**
- Left border (5px, primary color)
- Information:
  - Order ID (#123)
  - Order date
  - Status badge (color-coded)
  - Product name
  - Seller name
  - Amount ($price, green)
- "View Product" button

**Status Badges:**
- ⏳ Pending: Yellow badge
- ✅ Completed: Green badge
- ❌ Failed: Red badge

**Empty State:**
- Inbox icon
- "No Orders Yet" message
- "Browse Products" button

---

### **5. PAYMENTS**

#### **Checkout Page** `/payments/checkout/<product_id>/`
**File:** `templates/payments/checkout.html`

**Layout:**
- Centered form card
- Card header: "Complete Your Purchase"
- Info alert: Secure payment info
- "Proceed to Payment" button (green, large)
- "Continue Shopping" button (outline)
- Stripe logo at bottom

**Features:**
- Stripe session integration
- Security assurance message

---

#### **Success Page** `/payments/success/`
**File:** `templates/payments/success.html`

**Elements:**
- Large green checkmark icon (4rem)
- "Payment Successful!" heading
- Success message
- Two buttons:
  - "View Your Orders" (blue)
  - "Continue Shopping" (outline)

---

#### **Cancel Page** `/payments/cancel/`
**File:** `templates/payments/cancel.html`

**Elements:**
- Large red X icon (4rem)
- "Payment Cancelled" heading
- Reassurance message ("No charges were made")
- "Back to Products" button (blue)

---

## 🎯 Key CSS Classes & Components

### **Base Layout Classes**
- `.container` - Bootstrap container (max-width: 1200px)
- `.row` - Bootstrap row
- `.col-*` - Bootstrap columns (responsive)

### **Custom Component Classes**

**Auth Components:**
- `.auth-container` - Centered form box (450px max-width)
- `.auth-title` - Title with gradient text
- `.auth-link` - Links in auth pages
- `.password-wrapper` - Password field with eye toggle
- `.password-toggle` - Eye icon button

**Product Components:**
- `.product-card` - Product grid card
- `.product-card-img` - Product image area (250x height)
- `.product-card-body` - Product info section
- `.product-name` - Product title
- `.product-price` - Price display (green, large)
- `.product-seller` - Seller info line
- `.product-detail-*` - Detail page specific classes

**Dashboard Components:**
- `.welcome-section` - Welcome header
- `.stat-card` - Statistics card
- `.stat-icon` - Icon in stat card
- `.quick-action-card` - Quick action button card
- `.feature-card` - Feature description card

**Order Components:**
- `.order-card` - Order history card
- `.order-header` - Order header with ID
- `.order-status` - Status badge (pending/completed/failed)

**Navigation:**
- `.bg-gradient` - Gradient background (navbar)
- `.navbar-brand` - Logo/brand text
- `.btn-signup` - Sign up button styling

---

## 🔄 User Flow & Navigation

### **Visitor Journey**
1. Land on `/` (home landing page)
   ↓
2. See featured products & features
   ↓
3. Click "Get Started" → `/users/register/`
   ↓
4. Fill registration form (select Buyer or Seller)
   ↓
5. Redirected to `/products/` (product list)

### **Seller Journey**
1. Log in → `/` (dashboard)
   ↓
2. Click "Sell Product" → `/products/add/`
   ↓
3. Fill product form
   ↓
4. Product appears in `/products/`
   ↓
5. Can edit/delete from product detail page

### **Buyer Journey**
1. Log in → `/` (dashboard)
   ↓
2. Click "Browse Products" → `/products/`
   ↓
3. Click product card → `/products/<id>/`
   ↓
4. Click "Buy Now" → `/payments/checkout/<id>/`
   ↓
5. Complete Stripe payment
   ↓
6. Success page → can view `/orders/`

---

## 📱 Responsive Design

### **Breakpoints**
- **Mobile (< 576px)**: Single column, full width
- **Tablet (576px - 768px)**: 2 columns for grids
- **Desktop (768px - 1200px)**: 3-4 columns
- **Large Desktop (> 1200px)**: Full layout

### **Mobile-Friendly Features**
- Hamburger menu in navbar
- Stacked form fields
- Single column product view
- Touch-friendly buttons (44px+ height)
- Readable font sizes (16px base)

---

## 🛠️ Styling & Animations

### **Transitions**
- Default: `all 0.3s ease`
- Hover lift: `translateY(-5px)`
- Button click: `scale(0.95)`

### **Shadows**
- Light: `0 2px 8px rgba(0, 0, 0, 0.1)`
- Medium: `0 4px 15px rgba(0, 0, 0, 0.1)`
- Dark: `0 8px 25px rgba(0, 0, 0, 0.15)`

### **Border Radius**
- Small: 5px (buttons)
- Medium: 8px (form fields)
- Large: 12px (cards)

---

## 📊 Form Elements Styling

### **Text Inputs & Selects**
- Border: 1px solid #ddd
- Padding: 0.6rem 1rem
- Border-radius: 8px
- Focus: Primary color border + shadow
- Transition: all 0.3s ease

### **Labels**
- Font-weight: 600
- Color: #333
- Margin-bottom: 0.5rem

### **Buttons**
- Standard: 0.6rem 1.5rem padding
- Large: 0.75rem 2rem padding
- Border-radius: 8px
- Hover: lift + shadow
- Font-weight: 600

---

## 🎨 CSS File Structure

**File:** `mysite/static/css/style.css` (381 lines)

**Sections:**
1. Root variables (colors)
2. Global styles (*, body)
3. Navigation styles
4. Card styles
5. Button styles
6. Form styles
7. Auth page styles
8. Product detail styles
9. Order styles
10. Footer styles
11. Utility classes
12. Responsive media queries

---

## 🔐 Form Validation & Messages

### **Error Display**
- `.invalid-feedback` - Red error text
- `.alert` - Alert boxes (danger, success, info)
- Bootstrap `.is-invalid` class applied to fields

### **Field Validation**
- Username: Required, unique
- Email: Required, valid format
- Password: Required, 8+ chars (Django default)
- Price: Number, positive, 2 decimals
- File: Image only (jpg, png, gif)

---

## 📌 Important Notes

### **Security**
- All forms use CSRF tokens (`{% csrf_token %}`)
- Password fields use Django's password input widget
- Forms with `novalidate` for custom Bootstrap validation
- Only product owners can edit/delete their products
- Only product buyers can view orders

### **Dynamic Content**
- User greeting on dashboard (`{{ user.username }}`)
- Product counts from database (`{{ total_products }}`)
- User's products & orders filtered by owner
- Order status updates in real-time

### **Future Enhancements**
- Search and filter functionality
- Product reviews and ratings
- User messaging system
- Wishlist feature
- Seller analytics dashboard
- Product categories

---

## 🚀 Getting Started with UI Customization

### **To Change Colors:**
Edit `mysite/static/css/style.css` line 1-5 (root variables)

### **To Add New Page:**
1. Create template in `mysite/templates/`
2. Extend `base.html`
3. Add URL in `urls.py`
4. Create view function

### **To Modify Navigation:**
Edit `mysite/templates/base.html` navbar section

### **To Update Styling:**
1. Modify `mysite/static/css/style.css`
2. Add custom styles in `<style>` tags in templates for page-specific CSS
3. Use Bootstrap utilities for quick changes

---

## 📞 Support Components

**None yet** - Future enhancement for user support system

**Status Components:**
- Messages display for notifications
- Success/error/warning/info alerts
- Form error messages with field-level details

---

**Last Updated:** February 9, 2026
**Version:** 1.0
**Author:** GitHub Copilot
