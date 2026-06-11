import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function AdminLayout() {
  return (
    <div className="flex min-h-screen bg-px-bg">
      <div className="fixed inset-0 scanline pointer-events-none" />
      <Sidebar />
      <main className="flex-1 ml-[260px]">
        <Topbar />
        <Outlet />
      </main>
    </div>
  );
}
