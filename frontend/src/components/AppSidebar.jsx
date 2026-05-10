import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Building2,
  Briefcase,
  Wallet,
  CalendarClock,
  BarChart3,
  Bell,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from "lucide-react";
// Supabase removed
import { useState } from "react";

const menuItems = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/employees", label: "Employees", icon: Users },
  { path: "/departments", label: "Departments", icon: Building2 },
  { path: "/positions", label: "Positions", icon: Briefcase },
  { path: "/payroll", label: "Payroll", icon: Wallet },
  { path: "/attendance", label: "Attendance", icon: CalendarClock },
  { path: "/reports", label: "Reports", icon: BarChart3 },
  { path: "/alerts", label: "Alerts", icon: Bell },
];

const TEAL = "#1abc9c";
const SIDEBAR_BG = "#1c2434";
const SIDEBAR_HOVER = "#2a3547";

export default function AppSidebar() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [hoveredPath, setHoveredPath] = useState(null);

  return (
    <aside
      className="d-flex flex-column shadow flex-shrink-0 vh-100 transition-all"
      style={{
        width: collapsed ? "80px" : "240px",
        backgroundColor: SIDEBAR_BG,
        color: "#d1d5db", // gray-300
      }}
    >
      <div
        className="d-flex align-items-center justify-content-between p-3 border-bottom"
        style={{ height: "64px", borderColor: "rgba(255,255,255,0.1) !important" }}
      >
        {!collapsed && (
          <div className="d-flex align-items-center gap-2">
            <div
              className="rounded d-flex align-items-center justify-content-center text-white"
              style={{ width: 32, height: 32, backgroundColor: TEAL }}
            >
              <span className="fw-bold small">HR</span>
            </div>
            <span className="fw-semibold small text-white tracking-wide">
              HRM System
            </span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="btn btn-sm d-flex align-items-center justify-content-center p-1 border-0"
          style={{
            margin: collapsed ? "0 auto" : "",
            color: "#9ca3af",
            backgroundColor: "transparent",
          }}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      <nav className="flex-grow-1 p-2">
        <ul className="nav nav-pills flex-column mb-auto gap-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            const isHovered = hoveredPath === item.path;
            
            return (
              <li className="nav-item" key={item.path}>
                <Link
                  to={item.path}
                  onMouseEnter={() => setHoveredPath(item.path)}
                  onMouseLeave={() => setHoveredPath(null)}
                  className="d-flex align-items-center gap-3 py-2 px-3 fw-medium transition-all text-decoration-none"
                  style={{
                    justifyContent: collapsed ? "center" : "flex-start",
                    borderRadius: "2rem",
                    color: isActive || isHovered ? "#fff" : "#adb5bd",
                    backgroundColor: isActive ? TEAL : isHovered ? SIDEBAR_HOVER : "transparent",
                  }}
                  title={collapsed ? item.label : undefined}
                >
                  <item.icon size={18} className="flex-shrink-0" style={{ color: "inherit" }} />
                  {!collapsed && <span style={{ fontSize: "0.95rem", color: "inherit" }}>{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-3 border-top" style={{ borderColor: "rgba(255,255,255,0.1) !important" }}>
        <button
          onClick={async () => {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            localStorage.removeItem("isLoggedIn");
            window.location.href = "/dashboard";
          }}
          className="btn w-100 d-flex align-items-center gap-3 border-0 p-2"
          style={{
            justifyContent: collapsed ? "center" : "flex-start",
            color: "#adb5bd",
            backgroundColor: "transparent",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "#fff"; e.currentTarget.style.backgroundColor = SIDEBAR_HOVER; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "#adb5bd"; e.currentTarget.style.backgroundColor = "transparent"; }}
          title="Logout"
        >
          <LogOut size={18} className="flex-shrink-0" />
          {!collapsed && <span style={{ fontSize: "0.95rem" }}>Logout</span>}
        </button>
        {!collapsed && (
          <p
            className="text-center mt-2 mb-0"
            style={{ fontSize: "12px", color: "#6c757d" }}
          >
            v1.0.0 &bull; HRM System
          </p>
        )}
      </div>
    </aside>
  );
}
