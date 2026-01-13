
import { Outlet } from "react-router-dom";
import "../Styles/Layouts/Dashboard.css";
import AdminSidebar from "../Components/AdminDashboard/AdminSidebar";

export default function AdminDashboardLayout() {
  return (
    <div className="dashboard-layout">
      <AdminSidebar/>
      <main className="dashboard-content">
        <Outlet />
      </main>
    </div>
  );
}