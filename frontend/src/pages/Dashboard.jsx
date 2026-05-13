import React, { useEffect, useState } from "react";
import {
  Users,
  Building2,
  Wallet,
  AlertTriangle,
} from "lucide-react";

import StatCard from "../components/StatCard";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const CHART_COLORS = [
  "#1abc9c",
  "#3498db",
  "#f39c12",
  "#9b59b6",
  "#e74c3c",
];

export default function Dashboard() {

  const [dashboardData, setDashboardData] = useState({
    summary: {
      totalEmployees: 0,
      activeEmployees: 0,
      totalDepartments: 0,
      totalSalary: 0,
      totalLeave: 0,
    },

    deptData: [],
    statusData: [],
    salaryByDept: [],
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {

    const isLoggedIn =
      localStorage.getItem("isLoggedIn");

    const token =
      localStorage.getItem("token");

    if (!isLoggedIn || !token) {

      window.location.href = "/";

      return;
    }

    const fetchDashboardData = async () => {

      try {

        const response = await fetch(
          "http://127.0.0.1:5000/api/dashboard",
          {
            method: "GET",

            headers: {
              Authorization:
                localStorage.getItem("token"),
            },
          }
        );

        const result = await response.json();

        console.log("Dashboard API:", result);

        if (result.success && result.data) {

          setDashboardData({

            summary:
              result.data.summary || {
                totalEmployees: 0,
                activeEmployees: 0,
                totalDepartments: 0,
                totalSalary: 0,
                totalLeave: 0,
              },

            deptData:
              result.data.deptData || [],

            statusData:
              result.data.statusData || [],

            salaryByDept:
              result.data.salaryByDept || [],
          });

        } else {

          console.error(
            "Dashboard API Error:",
            result
          );

          setDashboardData({
            summary: {
              totalEmployees: 0,
              activeEmployees: 0,
              totalDepartments: 0,
              totalSalary: 0,
              totalLeave: 0,
            },

            deptData: [],
            statusData: [],
            salaryByDept: [],
          });
        }

      } catch (error) {

        console.error(
          "Failed to fetch dashboard data:",
          error
        );

        setDashboardData({
          summary: {
            totalEmployees: 0,
            activeEmployees: 0,
            totalDepartments: 0,
            totalSalary: 0,
            totalLeave: 0,
          },

          deptData: [],
          statusData: [],
          salaryByDept: [],
        });

      } finally {

        setLoading(false);
      }
    };

    fetchDashboardData();

  }, []);

  const {
    summary = {},
    deptData = [],
    statusData = [],
    salaryByDept = [],
  } = dashboardData || {};

  const {
    totalEmployees = 0,
    activeEmployees = 0,
    totalDepartments = 0,
    totalSalary = 0,
    totalLeave = 0,
  } = summary || {};

  const fmt = (value) => {

    return new Intl.NumberFormat(
      "vi-VN"
    ).format(value);
  };

  if (loading) {

    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <h4 className="text-secondary">
          Loading dashboard...
        </h4>
      </div>
    );
  }

  return (
    <div className="container-fluid p-4 bg-light min-vh-100">

      {/* Header */}
      <div className="mb-4">
        <h1 className="fs-3 fw-bold text-dark">
          Dashboard
        </h1>
      </div>

      {/* Stats */}
      <div className="row g-4 mb-4">

        <div className="col-md-6 col-lg-3">
          <StatCard
            title="Employees"
            value={activeEmployees}
            subtitle={`${totalEmployees} total`}
            icon={Users}
            variant="primary"
          />
        </div>

        <div className="col-md-6 col-lg-3">
          <StatCard
            title="Departments"
            value={totalDepartments}
            subtitle="active"
            icon={Building2}
            variant="info"
          />
        </div>

        <div className="col-md-6 col-lg-3">
          <StatCard
            title="Total Salary"
            value={`${(totalSalary / 1e6).toFixed(1)}M`}
            subtitle="VND"
            icon={Wallet}
            variant="success"
          />
        </div>

        <div className="col-md-6 col-lg-3">
          <StatCard
            title="Leave Days"
            value={totalLeave}
            subtitle="Leave + absent"
            icon={AlertTriangle}
            variant="warning"
          />
        </div>

      </div>

      {/* Charts */}
      <div className="row g-4 mb-4">

        {/* Employees by Department */}
        <div className="col-lg-7">

          <div className="card shadow-sm border-0 rounded-4 h-100">

            <div className="card-body p-4">

              <h5 className="card-title fw-bold mb-4">
                Employees by Department
              </h5>

              <ResponsiveContainer width="100%" height={320}>

                <BarChart data={deptData}>

                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f1f5f9"
                  />

                  <XAxis
                    dataKey="name"
                    tick={{
                      fontSize: 10,
                      fill: "#94a3b8",
                    }}
                    axisLine={false}
                    tickLine={false}
                    angle={-15}
                    textAnchor="end"
                    height={60}
                  />

                  <YAxis
                    tick={{
                      fontSize: 11,
                      fill: "#94a3b8",
                    }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <Tooltip />

                  <Bar
                    dataKey="count"
                    fill="#1c723cff"
                    radius={[6, 6, 0, 0]}
                    barSize={40}
                  />

                </BarChart>

              </ResponsiveContainer>

            </div>

          </div>

        </div>

        {/* Employee Status */}
        <div className="col-lg-5">

          <div className="card shadow-sm border-0 rounded-4 h-100">

            <div className="card-body p-4">

              <h5 className="card-title fw-bold mb-4">
                Employee Status
              </h5>

              <ResponsiveContainer width="100%" height={320}>

                <PieChart>

                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={8}
                    dataKey="value"
                    stroke="none"
                  >

                    {statusData.map((entry, i) => (

                      <Cell
                        key={i}
                        fill={
                          CHART_COLORS[
                            i % CHART_COLORS.length
                          ]
                        }
                      />

                    ))}

                  </Pie>

                  <Tooltip />

                </PieChart>

              </ResponsiveContainer>

            </div>

          </div>

        </div>

      </div>

      {/* Salary by Department */}
      <div className="row">

        <div className="col-12">

          <div className="card shadow-sm border-0 rounded-4">

            <div className="card-body p-4">

              <h5 className="card-title fw-bold mb-4">
                Salary by Department
              </h5>

              <ResponsiveContainer width="100%" height={300}>

                <BarChart data={salaryByDept}>

                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f1f5f9"
                  />

                  <XAxis
                    dataKey="name"
                    tick={{
                      fontSize: 11,
                      fill: "#94a3b8",
                    }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <YAxis
                    tickFormatter={(v) =>
                      `${(v / 1e6).toFixed(0)}M`
                    }
                  />

                  <Tooltip
                    formatter={(v) => [
                      `${fmt(v)} VND`,
                      "Total Salary",
                    ]}
                  />

                  <Bar
                    dataKey="total"
                    fill="#3498db"
                    radius={[6, 6, 0, 0]}
                    barSize={60}
                  />

                </BarChart>

              </ResponsiveContainer>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}