import { useEffect, useState } from "react";

import {
  Users,
  Wallet,
  CalendarClock,
  TrendingUp,
  RefreshCw,
} from "lucide-react";

import StatCard from "../components/StatCard";

import { toast } from "sonner";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

const COLORS = [
  "#f1c40f",
  "#3498db",
  "#1abc9c",
  "#e67e22",
  "#e74c3c",
  "#9b59b6",
  "#a29bfe",
  "#ff7675",
];

export default function Reports() {

  // =====================================================
  // STATES
  // =====================================================

  const [employees, setEmployees] =
    useState([]);

  const [salaryChart, setSalaryChart] =
    useState([]);

  const [salaries, setSalaries] =
    useState([]);

  const [deptDividend, setDeptDividend] =
    useState([]);

  const [activeCount, setActiveCount] =
    useState(0);

  const [totalSalary, setTotalSalary] =
    useState(0);

  const [totalLeave, setTotalLeave] =
    useState(0);

  const [totalDividend, setTotalDividend] =
    useState(0);

  const [activeTab, setActiveTab] =
    useState("general");

  const [isRefreshing, setIsRefreshing] =
    useState(false);

  // =====================================================
  // LOAD API
  // =====================================================

  useEffect(() => {

    fetchReports();

  }, []);

  const fetchReports = async () => {

    setIsRefreshing(true);

    try {

      // =====================================================
      // GENERAL OVERVIEW API
      // =====================================================

      const generalResponse = await fetch(

        "http://127.0.0.1:5000/api/reports/general-overview",

        {
          headers: {
            Authorization: "demo-token",
          },
        }
      );

      const generalResult =
        await generalResponse.json();

      if (generalResult.error) {

        toast.error(
          generalResult.error
        );

        return;
      }

      // =====================================================
      // DIVIDENDS SUMMARY API
      // =====================================================

      const dividendResponse = await fetch(

        "http://127.0.0.1:5000/api/reports/dividends-summary",

        {
          headers: {
            Authorization: "demo-token",
          },
        }
      );

      const dividendResult =
        await dividendResponse.json();

      if (dividendResult.error) {

        toast.error(
          dividendResult.error
        );

        return;
      }

      // =====================================================
      // GENERAL DATA
      // =====================================================

      const generalData =
        generalResult || {};

      setEmployees(
        generalData.workforceByDept || []
      );

      setSalaryChart(
        generalData.salaryExpenditure || []
      );

      setActiveCount(
        generalData.stats
          ?.activeEmployees || 0
      );

      setTotalSalary(
        generalData.stats
          ?.totalPayroll || 0
      );

      setTotalLeave(
        generalData.stats
          ?.totalLeaveDays || 0
      );

      // =====================================================
      // DIVIDEND DATA
      // =====================================================

      const dividendData =
        dividendResult || {};

      const formattedSalaries = (

        dividendData.employeeDividendBreakdown || []

      ).map((item, index) => ({

        salaryid:
          item.employeeId || index,

        employeename:
          item.fullName || "Unknown",

        departmentname:
          item.department || "Unknown",

        basesalary:
          item.baseSalary || 0,

        bonus:
          item.dividend || 0,

      }));

      setSalaries(
        formattedSalaries
      );

      const formattedDeptDividend = (

        dividendData.bonusByDept || []

      ).map((item) => ({

        name:
          item.name || "Unknown",

        value:
          item.amount || 0

      }));

      setDeptDividend(
        formattedDeptDividend
      );

      setTotalDividend(
        dividendData.totalDividends || 0
      );

    } catch (error) {

      console.error(error);

      toast.error(
        "Failed to load reports"
      );
    } finally {

      setIsRefreshing(false);
    }
  };

  // =====================================================
  // FORMAT
  // =====================================================

  const fmt = (n) =>

    new Intl.NumberFormat(
      "vi-VN"
    ).format(n);

  // =====================================================
  // UI
  // =====================================================

  return (

    <div
      className="container-fluid p-4"
      style={{
        backgroundColor: "#f8fafc",
        minHeight: "100vh",
      }}
    >

      {/* HEADER */}

      <div className="mb-4 d-flex justify-content-between align-items-start">

        <div>
          <h1 className="fs-3 fw-bold text-dark mb-2">
            Analytics & Reports
          </h1>

          <p className="text-secondary mb-0 max-w-2xl small">
            Performance metrics, payroll statistics,
            and comprehensive dividend reports.
          </p>
        </div>

        <button
          className="btn btn-outline-primary rounded-pill d-flex align-items-center gap-2"
          onClick={fetchReports}
          disabled={isRefreshing}
          title="Refresh data"
        >
          <RefreshCw size={18} style={{
            animation: isRefreshing ? "spin 1s linear infinite" : "none"
          }} />
          {isRefreshing ? "Đang tải..." : "Làm mới"}
        </button>

      </div>

      {/* TABS */}

      <ul
        className="nav nav-pills mb-0 gap-2 p-1 rounded-top-3 d-inline-flex"
        style={{
          backgroundColor: "#f1f5f9",
          position: "relative",
          zIndex: 2,
        }}
      >

        <li className="nav-item">

          <button
            className={`nav-link small fw-semibold px-4 border-0 ${
              activeTab === "general"
                ? "active bg-white text-dark shadow-sm"
                : "text-secondary"
            }`}
            onClick={() =>
              setActiveTab("general")
            }
          >
            General Overview
          </button>

        </li>

        <li className="nav-item">

          <button
            className={`nav-link small fw-semibold px-4 border-0 ${
              activeTab === "dividend"
                ? "active bg-white text-teal shadow-sm"
                : "text-secondary"
            }`}
            style={
              activeTab === "dividend"
                ? {
                    color: "#1abc9c",
                  }
                : {}
            }
            onClick={() =>
              setActiveTab("dividend")
            }
          >
            Dividends & Bonuses
          </button>

        </li>

      </ul>

      {/* CONTENT */}

      <div
        className="border-top-0 rounded-bottom-4 p-4"
        style={{
          backgroundColor: "#fff",
          border: "1px solid #1abc9c",
          marginTop: "-1px",
        }}
      >

        {/* =====================================================
            GENERAL TAB
        ===================================================== */}

        {activeTab === "general" && (

          <div>

            {/* STATS */}

            <div className="row g-4 mb-4">

              <div className="col-12 col-md-4">

                <StatCard
                  title="Active Employees"
                  value={activeCount}
                  subtitle={`${employees.length} departments`}
                  icon={Users}
                  variant="primary"
                />

              </div>

              <div className="col-12 col-md-4">

                <StatCard
                  title="Total Payroll"
                  value={`${(
                    totalSalary / 1e6
                  ).toFixed(1)}M`}
                  subtitle="VND current month"
                  icon={Wallet}
                  variant="success"
                />

              </div>

              <div className="col-12 col-md-4">

                <StatCard
                  title="Total Leave Days"
                  value={totalLeave}
                  subtitle="Leave + absent"
                  icon={CalendarClock}
                  variant="warning"
                />

              </div>

            </div>

            {/* CHARTS */}

            <div className="row g-4 align-items-stretch">

              {/* PIE CHART */}

              <div className="col-12 col-xl-5">

                <div className="card border-0 shadow-sm rounded-4 p-4 h-100">

                  <h6 className="fw-bold mb-4">
                    Workforce by Department
                  </h6>

                  <div style={{ height: "350px" }}>

                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                    >

                      <PieChart>

                        <Pie
                          data={employees}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={90}
                          label={({ percent }) =>
                            `${(percent * 100).toFixed(0)}%`
                          }
                        >

                          {employees.map(
                            (_, i) => (

                              <Cell
                                key={i}
                                fill={
                                  COLORS[
                                    i %
                                      COLORS.length
                                  ]
                                }
                              />

                            )
                          )}

                        </Pie>

                        <RechartsTooltip
                          formatter={(value) => [
                            `${value} employees`,
                            "Employees",
                          ]}
                        />

                      </PieChart>

                    </ResponsiveContainer>

                  </div>

                  {/* LEGEND */}

                  <div className="d-flex flex-wrap justify-content-center gap-3 mt-3">

                    {employees.map((d, i) => (

                      <div
                        key={i}
                        className="d-flex align-items-center gap-2"
                      >

                        <div
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            backgroundColor:
                              COLORS[
                                i %
                                  COLORS.length
                              ],
                          }}
                        />

                        <span className="small text-secondary fw-medium">

                          {d.name.length > 18
                            ? d.name.substring(0, 18) + "..."
                            : d.name}

                          {" "}

                          {activeCount > 0
                            ? (
                                (d.value /
                                  activeCount) *
                                100
                              ).toFixed(0)
                            : 0}
                          %

                        </span>

                      </div>

                    ))}

                  </div>

                </div>

              </div>

              {/* BAR CHART */}

              <div className="col-12 col-xl-7">

                <div className="card border-0 shadow-sm rounded-4 p-4 h-100">

                  <h6 className="fw-bold mb-4">
                    Salary Expenditure
                  </h6>

                  <div style={{ height: "350px" }}>

                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                    >

                      <BarChart
                        data={salaryChart}
                        margin={{
                          top: 10,
                          right: 20,
                          left: 10,
                          bottom: 80,
                        }}
                      >

                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="#f1f5f9"
                        />

                        <XAxis
                          dataKey="name"
                          interval={0}
                          angle={-35}
                          textAnchor="end"
                          height={80}
                          tick={{
                            fontSize: 11,
                            fill: "#64748b",
                          }}
                          axisLine={false}
                          tickLine={false}
                        />

                        <YAxis
                          tick={{
                            fontSize: 11,
                            fill: "#64748b",
                          }}
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(v) =>
                            `${v / 1e6}M`
                          }
                        />

                        <RechartsTooltip
                          formatter={(value) => [
                            `${fmt(value)} VND`,
                            "Salary",
                          ]}
                        />

                        <Bar
                          dataKey="salary"
                          fill="#1abc9c"
                          radius={[6, 6, 0, 0]}
                          maxBarSize={45}
                        />

                      </BarChart>

                    </ResponsiveContainer>

                  </div>

                </div>

              </div>

            </div>

          </div>
        )}

        {/* =====================================================
            DIVIDEND TAB
        ===================================================== */}

        {activeTab === "dividend" && (

          <div>

            {/* TOTAL DIVIDEND */}

            <div className="row mb-4">

              <div className="col-12 col-md-4">

                <div className="card shadow-sm border-0 p-4 rounded-4">

                  <p className="text-secondary small mb-3">
                    Total Dividends Distributed
                  </p>

                  <div className="d-flex align-items-center justify-content-between">

                    <div>

                      <h2 className="fw-bold mb-1">

                        {(
                          totalDividend / 1e6
                        ).toFixed(1)}M

                      </h2>

                      <p className="text-secondary x-small mb-0">
                        VND in bonuses
                      </p>

                    </div>

                    <div className="bg-success-subtle p-2 rounded-3">

                      <TrendingUp
                        size={20}
                        className="text-success"
                      />

                    </div>

                  </div>

                </div>

              </div>

            </div>

            {/* BONUS CHARTS */}

            <div className="row g-4 mb-4 align-items-stretch">

              {/* BONUS BAR */}

              <div className="col-12 col-xl-7">

                <div className="card border-0 shadow-sm rounded-4 p-4 h-100">

                  <h6 className="fw-bold mb-4">
                    Bonus by Department
                  </h6>

                  <div style={{ height: "350px" }}>

                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                    >

                      <BarChart
                        data={deptDividend}
                        margin={{
                          top: 10,
                          right: 20,
                          left: 10,
                          bottom: 80,
                        }}
                      >

                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="#f1f5f9"
                        />

                        <XAxis
                          dataKey="name"
                          interval={0}
                          angle={-35}
                          textAnchor="end"
                          height={80}
                          tick={{
                            fontSize: 11,
                            fill: "#64748b",
                          }}
                          axisLine={false}
                          tickLine={false}
                        />

                        <YAxis
                          tickFormatter={(v) =>
                            `${v / 1e6}M`
                          }
                          axisLine={false}
                          tickLine={false}
                        />

                        <RechartsTooltip
                          formatter={(value) => [
                            `${fmt(value)} VND`,
                            "Bonus",
                          ]}
                        />

                        <Bar
                          dataKey="value"
                          fill="#b968de"
                          radius={[6, 6, 0, 0]}
                          maxBarSize={45}
                        />

                      </BarChart>

                    </ResponsiveContainer>

                  </div>

                </div>

              </div>

              {/* BONUS PIE */}

              <div className="col-12 col-xl-5">

                <div className="card border-0 shadow-sm rounded-4 p-4 h-100">

                  <h6 className="fw-bold mb-4">
                    Bonus Distribution
                  </h6>

                  <div style={{ height: "350px" }}>

                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                    >

                      <PieChart>

                        <Pie
                          data={deptDividend}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="45%"
                          outerRadius={90}
                          label={({ name, percent }) =>
                            `${name.length > 12
                              ? name.substring(0, 12) + "..."
                              : name
                            } ${(percent * 100).toFixed(0)}%`
                          }
                          labelLine={false}
                        >

                          {deptDividend.map(
                            (_, i) => (

                              <Cell
                                key={i}
                                fill={
                                  COLORS[
                                    i %
                                      COLORS.length
                                  ]
                                }
                              />

                            )
                          )}

                        </Pie>

                        <RechartsTooltip
                          formatter={(value) => [
                            `${fmt(value)} VND`,
                            "Bonus",
                          ]}
                        />

                      </PieChart>

                    </ResponsiveContainer>

                  </div>

                  {/* LEGEND */}

                  <div className="d-flex flex-wrap justify-content-center gap-3 mt-3">

                    {deptDividend.map((d, i) => (

                      <div
                        key={i}
                        className="d-flex align-items-center gap-2"
                      >

                        <div
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            backgroundColor:
                              COLORS[
                                i %
                                  COLORS.length
                              ],
                          }}
                        />

                        <span className="small text-secondary fw-medium">

                          {d.name.length > 18
                            ? d.name.substring(0, 18) + "..."
                            : d.name}

                          {" "}

                          {totalDividend > 0
                            ? (
                                (d.value /
                                  totalDividend) *
                                100
                              ).toFixed(0)
                            : 0}
                          %

                        </span>

                      </div>

                    ))}

                  </div>

                </div>

              </div>

            </div>

            {/* TABLE */}

            <div className="card shadow-sm border-0 rounded-4 overflow-hidden mt-4">

              <div className="card-header bg-white py-4 border-0">

                <h6 className="fw-bold mb-1">
                  Employee Dividend Breakdown
                </h6>

                <p className="text-secondary small mb-0">
                  Bonuses relative to base salary.
                </p>

              </div>

              <div className="table-responsive">

                <table className="table table-hover align-middle mb-0">

                  <thead className="bg-light">

                    <tr>

                      <th className="py-3 ps-4 text-secondary text-uppercase x-small fw-semibold border-0">
                        Employee
                      </th>

                      <th className="py-3 text-secondary text-uppercase x-small fw-semibold border-0">
                        Department
                      </th>

                      <th className="py-3 text-end text-secondary text-uppercase x-small fw-semibold border-0">
                        Base Salary
                      </th>

                      <th className="py-3 text-end text-secondary text-uppercase x-small fw-semibold border-0">
                        Bonus
                      </th>

                      <th className="py-3 pe-4 text-center text-secondary text-uppercase x-small fw-semibold border-0">
                        Rate
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {salaries
                      .sort(
                        (a, b) =>
                          b.bonus - a.bonus
                      )
                      .map((s) => (

                        <tr
                          key={s.salaryid}
                        >

                          <td className="py-3 ps-4 fw-bold text-dark small">
                            {s.employeename}
                          </td>

                          <td className="py-3 text-secondary small">
                            {s.departmentname}
                          </td>

                          <td className="py-3 text-end text-secondary small">
                            {fmt(
                              s.basesalary
                            )} VND
                          </td>

                          <td className="py-3 text-end text-success fw-bold small">
                            +{fmt(
                              s.bonus
                            )} VND
                          </td>

                          <td className="py-3 pe-4 text-center">

                            <span
                              className="badge rounded-pill fw-medium"
                              style={{
                                backgroundColor:
                                  "#475569",
                                color: "#fff",
                                fontSize: "10px",
                                padding:
                                  "4px 8px",
                              }}
                            >

                              {(
                                (s.bonus /
                                  (s.basesalary || 1)) *
                                100
                              ).toFixed(1)}
                              %

                            </span>

                          </td>

                        </tr>
                      ))}

                  </tbody>

                </table>

              </div>

            </div>

          </div>
        )}

      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes spin {
              from {
                transform: rotate(0deg);
              }
              to {
                transform: rotate(360deg);
              }
            }

            .text-teal {
              color: #1abc9c !important;
            }

            .x-small {
              font-size: 10px !important;
              letter-spacing: 0.5px;
            }

            .nav-link.active {
              border-bottom: 3px solid #1abc9c !important;
            }

            .card {
              transition: all 0.2s ease;
            }

            .card:hover {
              transform: translateY(-2px);
            }
          `,
        }}
      />

    </div>
  );
}