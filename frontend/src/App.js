import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { useState, useEffect } from "react";

import AppLayout from "./components/AppLayout";
import Auth from "./pages/Auth";

import Dashboard from "./pages/Dashboard";
import Employees from "./pages/Employees";
import EmployeeAdd from "./pages/EmployeeAdd";
import Departments from "./pages/Departments";
import DepartmentAdd from "./pages/DepartmentAdd";
import DepartmentDetail from "./pages/DepartmentDetail";
import EditDepartment from "./pages/EditDepartment";
import Positions from "./pages/Positions";
import PositionAdd from "./pages/PositionAdd";
import Payroll from "./pages/Payroll";
import Attendance from "./pages/Attendance";
import Reports from "./pages/Reports";
import Alerts from "./pages/Alerts";
import AlertsDetail from "./pages/AlertsDetail";
import NotFound from "./pages/NotFound";
import EditEmployee from "./pages/EditEmployee";
import EditPosition from "./pages/EditPosition";

export default function App() {

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // ✅ restore login khi reload
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (token) {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }

    setLoading(false);
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <BrowserRouter>

      <Routes>

        {/* LOGIN */}
        <Route
          path="/"
          element={
            <Auth setIsAuthenticated={setIsAuthenticated} />
          }
        />

        {/* PROTECTED ROUTES */}
        <Route
          element={
            isAuthenticated
              ? <AppLayout />
              : <Navigate to="/" replace />
          }
        >

          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/employees" element={<Employees />} />
          <Route path="/employees/add" element={<EmployeeAdd />} />
          <Route path="/departments" element={<Departments />} />
          <Route path="/departments/add" element={<DepartmentAdd />} />
          <Route path="/departments/:id" element={<DepartmentDetail />} />
          <Route path="/departments/edit/:id" element={<EditDepartment />} />
          <Route path="/positions" element={<Positions />} />
          <Route path="/positions/add" element={<PositionAdd />} />
          <Route path="/payroll" element={<Payroll />} />
          <Route path="/attendance" element={<Attendance />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/alerts/:id" element={<AlertsDetail />} />
          <Route path="/employees/edit/:id" element={<EditEmployee />} />
          <Route path="/positions/edit/:id" element={<EditPosition />} />

        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFound />} />

      </Routes>

    </BrowserRouter>
  );
}