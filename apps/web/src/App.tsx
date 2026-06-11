import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "./components/layout/MainLayout";
import HomePage from "./pages/HomePage";
import UserDashboard from "./pages/UserDashboard";
import ProductsPage from "./pages/ProductsPage";
import TransactionPage from "./pages/TransactionPage";
import CheckoutPage from "./pages/CheckoutPage";
import InvoicePage from "./pages/InvoicePage";
import HistoryPage from "./pages/HistoryPage";
import WalletPage from "./pages/WalletPage";
import LoginPage from "./pages/LoginPage";
import FaqPage from "./pages/FaqPage";
import TopupGuidePage from "./pages/TopupGuidePage";
import ContactPage from "./pages/ContactPage";
import TermsPage from "./pages/TermsPage";
import ProfilePage from "./pages/ProfilePage";
import SearchPage from "./pages/SearchPage";
import NotificationsPage from "./pages/NotificationsPage";
import VoucherPage from "./pages/VoucherPage";
import TopUpPage from "./pages/TopUpPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<MainLayout />}>
          <Route index element={<HomePage />} />
          <Route path="/dashboard" element={<UserDashboard />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/transaction" element={<TransactionPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/invoice/:refId" element={<InvoicePage />} />
          <Route path="/wallet" element={<WalletPage />} />
          <Route path="/topup" element={<TopUpPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/faq" element={<FaqPage />} />
          <Route path="/topup-guide" element={<TopupGuidePage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/vouchers" element={<VoucherPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
