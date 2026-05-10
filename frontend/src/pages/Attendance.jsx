import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export default function Attendance() {

  // =====================================================
  // STATES
  // =====================================================

  const [employees, setEmployees] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [months, setMonths] = useState([]);
  const [leaveRate, setLeaveRate] = useState(0);

  const [monthFilter, setMonthFilter] =
    useState("all");

  const [dialogOpen, setDialogOpen] =
    useState(false);

  // =====================================================
  // LOAD API
  // =====================================================

  useEffect(() => {
    fetchAttendance();
  }, []);

  const fetchAttendance = async () => {
    try {

      const response = await fetch(
        "http://127.0.0.1:5000/api/attendances"
      );

      const result = await response.json();

      const data = result.data;

      setEmployees(data.employees || []);
      setAttendance(data.attendance || []);
      setMonths(data.months || []);
      setLeaveRate(data.leaveRate || 0);

    } catch (error) {

      console.error(error);

      toast.error(
        "Failed to load attendance data"
      );
    }
  };

  // =====================================================
  // FILTER
  // =====================================================

  const filtered =
    monthFilter === "all"
      ? attendance
      : attendance.filter(
          (item) =>
            item.attendancemonth === monthFilter
        );

  // =====================================================
  // CHART DATA
  // =====================================================

  const chartData = filtered.map((item) => ({
    name: item.employeename,
    "Work days": item.workdays,
    Leave: item.leavedays,
    Absent: item.absentdays,
  }));

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="container-fluid p-4">

      {/* HEADER */}

      <div className="d-flex align-items-center justify-content-between mb-4">

        <div>
          <h1 className="fs-4 fw-bold text-dark mb-1">
            Attendance
          </h1>

          <p className="small text-secondary mb-0">
            Leave rate: {leaveRate}%
          </p>
        </div>

        <div className="d-flex gap-2">

          {/* FILTER */}

          <select
            className="form-select w-auto"
            value={monthFilter}
            onChange={(e) =>
              setMonthFilter(e.target.value)
            }
          >
            <option value="all">
              All months
            </option>

            {months.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          {/* DIALOG */}

          <Dialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
          >

            <DialogTrigger asChild>
              <button
                className="btn btn-primary d-flex align-items-center"
              >
                <Plus size={16} className="me-2" />
                Add Attendance
              </button>
            </DialogTrigger>

            <DialogContent className="modal-dialog-centered">

              <DialogHeader>
                <DialogTitle>
                  Add Attendance Record
                </DialogTitle>
              </DialogHeader>

              <div className="row g-3 py-3">

                <div className="col-12">
                  <label className="form-label small fw-bold">
                    Employee
                  </label>

                  <select className="form-select">

                    <option value="" disabled>
                      Select employee
                    </option>

                    {employees.map((e) => (
                      <option
                        key={e.employeeid}
                        value={e.employeeid}
                      >
                        {e.fullname}
                      </option>
                    ))}

                  </select>
                </div>

                <div className="col-md-6">
                  <label className="form-label small fw-bold">
                    Month
                  </label>

                  <input
                    className="form-control"
                    placeholder="2024-03"
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label small fw-bold">
                    Work Days
                  </label>

                  <input
                    className="form-control"
                    type="number"
                    placeholder="22"
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label small fw-bold">
                    Leave Days
                  </label>

                  <input
                    className="form-control"
                    type="number"
                    placeholder="0"
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label small fw-bold">
                    Absent Days
                  </label>

                  <input
                    className="form-control"
                    type="number"
                    placeholder="0"
                  />
                </div>

              </div>

              <div className="d-flex justify-content-end gap-2 mt-3">

                <button
                  className="btn btn-secondary"
                  onClick={() =>
                    setDialogOpen(false)
                  }
                >
                  Cancel
                </button>

                <button
                  className="btn btn-primary"
                  onClick={() => {
                    setDialogOpen(false);

                    toast.success(
                      "Attendance record added"
                    );
                  }}
                >
                  Add
                </button>

              </div>

            </DialogContent>

          </Dialog>

        </div>

      </div>

      {/* CHART */}

      <div className="card shadow-sm border-0 mb-4">

        <div className="card-body">

          <h5 className="card-title fw-bold mb-4 small text-uppercase text-secondary">
            Attendance Trends
          </h5>

          <div
            style={{
              width: "100%",
              height: "350px",
            }}
          >

            <ResponsiveContainer
              width="100%"
              height="100%"
            >

              <LineChart data={chartData}>

                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#dee2e6"
                  vertical={false}
                />

                <XAxis
                  dataKey="name"
                  tick={{
                    fontSize: 11,
                    fill: "#6c757d",
                  }}
                  axisLine={{
                    stroke: "#dee2e6",
                  }}
                  tickLine={false}
                  angle={-15}
                  textAnchor="end"
                  height={70}
                />

                <YAxis
                  tick={{
                    fontSize: 12,
                    fill: "#6c757d",
                  }}
                  axisLine={false}
                  tickLine={false}
                />

                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "none",
                    boxShadow:
                      "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                />

                <Legend iconType="circle" />

                <Line
                  type="monotone"
                  dataKey="Work days"
                  stroke="#1abc9c"
                  strokeWidth={3}
                  dot={{
                    r: 4,
                    strokeWidth: 2,
                    fill: "#fff",
                  }}
                  activeDot={{ r: 6 }}
                />

                <Line
                  type="monotone"
                  dataKey="Leave"
                  stroke="#f1c40f"
                  strokeWidth={3}
                  dot={{
                    r: 4,
                    strokeWidth: 2,
                    fill: "#fff",
                  }}
                  activeDot={{ r: 6 }}
                />

                <Line
                  type="monotone"
                  dataKey="Absent"
                  stroke="#e74c3c"
                  strokeWidth={3}
                  dot={{
                    r: 4,
                    strokeWidth: 2,
                    fill: "#fff",
                  }}
                  activeDot={{ r: 6 }}
                />

              </LineChart>

            </ResponsiveContainer>

          </div>

        </div>

      </div>

      {/* TABLE */}

      <div className="card shadow-sm border-0">

        <div className="table-responsive">

          <table className="table table-hover align-middle mb-0">

            <thead className="table-light">

              <tr>

                <th className="text-start py-3 ps-4">
                  Employee
                </th>

                <th className="text-start py-3">
                  Department
                </th>

                <th className="text-center py-3">
                  Work Days
                </th>

                <th className="text-center py-3">
                  Leave
                </th>

                <th className="text-center py-3">
                  Absent
                </th>

                <th className="text-end py-3 pe-4">
                  Month
                </th>

              </tr>

            </thead>

            <tbody>

              {filtered.map((a) => (

                <tr key={a.attendanceid}>

                  <td className="py-3 ps-4">
                    {a.employeename}
                  </td>

                  <td className="py-3">
                    {a.departmentname}
                  </td>

                  <td className="py-3 text-center">
                    {a.workdays}
                  </td>

                  <td className="py-3 text-center">
                    {a.leavedays}
                  </td>

                  <td className="py-3 text-center">
                    {a.absentdays}
                  </td>

                  <td className="py-3 pe-4 text-end">
                    {a.attendancemonth}
                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      </div>

    </div>
  );
}