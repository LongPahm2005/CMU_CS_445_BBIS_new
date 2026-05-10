import { Outlet } from "react-router-dom";
import AppSidebar from "./AppSidebar";

export default function AppLayout() {
  return (
    <div className="d-flex vh-100 bg-light text-dark">
      <AppSidebar />
      <main className="flex-grow-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
