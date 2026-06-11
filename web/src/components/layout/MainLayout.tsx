import { Outlet } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
export default function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col relative">
      <div className="fixed inset-0 scanline pointer-events-none" />
      <div className="fixed inset-0 grid-bg pointer-events-none" />
      <Header />
      <main className="flex-1 pt-[70px]">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
