import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AdminLayout from "./components/layout/AdminLayout";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import UsersPage from "./pages/UsersPage";
import TransactionsPage from "./pages/TransactionsPage";
import ProductsPage from "./pages/ProductsPage";
import DigiflazzPage from "./pages/DigiflazzPage";
import PriceManagementPage from "./pages/PriceManagementPage";
import ReportsPage from "./pages/ReportsPage";
import VoucherManagementPage from "./pages/VoucherManagementPage";
import SettingsPage from "./pages/SettingsPage";
import LogsPage from "./pages/LogsPage";
import BroadcastPage from "./pages/BroadcastPage";
import PaymentsPage from "./pages/PaymentsPage";

function Guard({ children }: { children: React.ReactNode }) {
  return localStorage.getItem("px_admin_token") ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/*" element={<Guard><AdminLayout /></Guard>}>
          <Route index element={<DashboardPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="transactions" element={<TransactionsPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="digiflazz" element={<DigiflazzPage />} />
          <Route path="prices" element={<PriceManagementPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="vouchers" element={<VoucherManagementPage />} />
          <Route path="payments" element={<PaymentsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="logs" element={<LogsPage />} />
          <Route path="broadcast" element={<BroadcastPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
