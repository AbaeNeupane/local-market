import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ProductsPage from './pages/ProductsPage'
import ProductDetailPage from './pages/ProductDetailPage'
import AddProductPage from './pages/AddProductPage'
import DashboardPage from './pages/DashboardPage'
import ProfilePage from './pages/ProfilePage'
import OrdersPage from './pages/OrdersPage'
import OrderTrackingPage from './pages/OrderTrackingPage'
import StripeOnboardingPage from './pages/StripeOnboardingPage'
import AnalyticsPage from './pages/AnalyticsPage'
import PaymentSuccessPage from './pages/PaymentSuccessPage'
import PaymentCancelPage from './pages/PaymentCancelPage'
import PayPalSuccessPage from './pages/PayPalSuccessPage'

function ProtectedRoute({ children, sellerOnly = false }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading...</div>
  if (!user) return <Navigate to="/login" replace/>
  if (sellerOnly && user.profile?.user_type !== 'seller') return <Navigate to="/dashboard" replace/>
  return children
}

function AppRoutes() {
  return (
    <>
      <Navbar/>
      <Routes>
        <Route path="/" element={<HomePage/>}/>
        <Route path="/login" element={<LoginPage/>}/>
        <Route path="/register" element={<RegisterPage/>}/>
        <Route path="/products" element={<ProductsPage/>}/>
        <Route path="/products/:id" element={<ProductDetailPage/>}/>
        <Route path="/products/add" element={<ProtectedRoute sellerOnly><AddProductPage/></ProtectedRoute>}/>
        <Route path="/products/:id/edit" element={<ProtectedRoute sellerOnly><AddProductPage/></ProtectedRoute>}/>
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage/></ProtectedRoute>}/>
        <Route path="/profile" element={<ProtectedRoute><ProfilePage/></ProtectedRoute>}/>
        <Route path="/orders" element={<ProtectedRoute><OrdersPage/></ProtectedRoute>}/>
        <Route path="/orders/:orderId/tracking" element={<ProtectedRoute><OrderTrackingPage/></ProtectedRoute>}/>
        <Route path="/dashboard/stripe" element={<ProtectedRoute sellerOnly><StripeOnboardingPage/></ProtectedRoute>}/>
        <Route path="/dashboard/stripe/return" element={<ProtectedRoute sellerOnly><StripeOnboardingPage/></ProtectedRoute>}/>
        <Route path="/dashboard/stripe/refresh" element={<ProtectedRoute sellerOnly><StripeOnboardingPage/></ProtectedRoute>}/>
        <Route path="/analytics" element={<ProtectedRoute sellerOnly><AnalyticsPage/></ProtectedRoute>}/>
        <Route path="/payment/success" element={<ProtectedRoute><PaymentSuccessPage/></ProtectedRoute>}/>
        <Route path="/payment/cancel" element={<ProtectedRoute><PaymentCancelPage/></ProtectedRoute>}/>
        <Route path="/payment/paypal-success" element={<ProtectedRoute><PayPalSuccessPage/></ProtectedRoute>}/>
        <Route path="*" element={<Navigate to="/" replace/>}/>
      </Routes>
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes/>
      <Toaster position="top-right" toastOptions={{
        style: { background: '#1f2937', color: '#f9fafb', border: '1px solid rgba(255,255,255,0.1)' },
        success: { iconTheme: { primary: '#10b981', secondary: '#1f2937' } },
        error: { iconTheme: { primary: '#ef4444', secondary: '#1f2937' } },
      }}/>
    </AuthProvider>
  )
}