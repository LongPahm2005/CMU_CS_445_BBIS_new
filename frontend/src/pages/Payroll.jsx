import { useState, useEffect, useMemo } from "react";
import { 
  Download, Search, Filter, 
  DollarSign, Users, Clock, Eye
} from "lucide-react";
import { toast } from "sonner";

export default function Payroll() {
  const [salaries, setSalaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    totalNetSalary: 0,
    employeeCount: 0,
    processedCount: 0
  });

  const [monthFilter, setMonthFilter] = useState("2024-09");
  const [searchTerm, setSearchTerm] = useState("");

  const fetchPayroll = async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/payroll/employees?month=${monthFilter}`, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        }
      });
      const result = await res.json();
      if (result.success) {
        setSalaries(result.data);
        const totalNet = result.data.reduce((sum, emp) => sum + (parseFloat(emp.netSalary) || 0), 0);
        const count = result.data.filter(emp => emp.salaryId).length;
        setSummary({
          totalNetSalary: totalNet,
          employeeCount: result.data.length,
          processedCount: count
        });
      }
    } catch (error) {
      toast.error("Error loading data from Database");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayroll();
  }, [monthFilter]);

  const filteredSalaries = useMemo(() => {
    return salaries.filter(s => 
      s.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(s.employeeId).includes(searchTerm)
    );
  }, [salaries, searchTerm]);

  const fmt = (n) => new Intl.NumberFormat("en-US").format(n || 0);

  const exportCSV = () => {
    if (filteredSalaries.length === 0) {
      toast.error("Không có dữ liệu để xuất!");
      return;
    }
    const headers = ["Employee ID", "Full Name", "Status", "Base Salary (VND)", "Bonus (VND)", "Deductions (VND)", "Net Salary (VND)", "Payment Status"];
    const rows = filteredSalaries.map(s => [
      s.employeeId,
      `"${s.fullName || ""}"`,
      s.status || "",
      s.baseSalary || 0,
      s.salaryId ? (s.bonus || 0) : "",
      s.salaryId ? (s.deductions || 0) : "",
      s.netSalary || "",
      s.salaryId ? "Paid" : "Pending"
    ]);

    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const bom = "\uFEFF";
    const blob = new Blob([bom + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `payroll_report_${monthFilter}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Đã xuất báo cáo tháng ${monthFilter} (${filteredSalaries.length} nhân viên)`);
  };

  return (
    <div className="container-fluid p-4 bg-light min-vh-100">
      {/* Header */}
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between mb-4 gap-3">
        <div>
          <h1 className="fs-4 fw-bold text-dark mb-1">Employee Payroll Data</h1>
          <p className="text-secondary mb-0 d-flex align-items-center small">
            <Clock size={14} className="me-1" /> Querying month: {monthFilter}
          </p>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-primary d-flex align-items-center rounded-pill px-3 shadow-sm border-2 fw-bold" onClick={fetchPayroll}>
            Refresh Data
          </button>
          <button className="btn btn-primary d-flex align-items-center rounded-pill px-3 shadow-sm fw-bold" onClick={exportCSV}>
            <Download size={18} className="me-2" /> Export Report
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white">
            <div className="bg-primary bg-opacity-10 p-2 rounded-3 text-primary w-fit mb-3" style={{width: 'fit-content'}}>
              <DollarSign size={20} />
            </div>
            <p className="text-secondary small mb-1 fw-medium">Total Payroll (in DB)</p>
            <h4 className="fw-bold text-dark mb-0">{fmt(summary.totalNetSalary)} <small className="fs-6 text-secondary fw-normal">VND</small></h4>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white">
            <div className="bg-success bg-opacity-10 p-2 rounded-3 text-success w-fit mb-3" style={{width: 'fit-content'}}>
              <Users size={20} />
            </div>
            <p className="text-secondary small mb-1 fw-medium">Active Headcount</p>
            <h4 className="fw-bold text-dark mb-0">{summary.employeeCount} <small className="fs-6 text-secondary fw-normal">staff</small></h4>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white">
            <div className="bg-info bg-opacity-10 p-2 rounded-3 text-info w-fit mb-3" style={{width: 'fit-content'}}>
              <Eye size={20} />
            </div>
            <p className="text-secondary small mb-1 fw-medium">Processed Records</p>
            <h4 className="fw-bold text-dark mb-0">{summary.processedCount} <small className="fs-6 text-secondary fw-normal">records</small></h4>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card border-0 shadow-sm rounded-4 mb-4">
        <div className="card-body p-3">
          <div className="row g-3">
            <div className="col-md-8">
              <div className="input-group">
                <span className="input-group-text bg-light border-0"><Search size={18} className="text-muted" /></span>
                <input 
                  type="text" 
                  className="form-control bg-light border-0 shadow-none" 
                  placeholder="Search by employee name or ID..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-4">
              <div className="input-group">
                <span className="input-group-text bg-light border-0"><Filter size={18} className="text-muted" /></span>
                <input 
                  type="month" 
                  className="form-control bg-light border-0 shadow-none" 
                  value={monthFilter}
                  onChange={(e) => setMonthFilter(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="bg-light">
              <tr>
                <th className="ps-4 py-3 text-secondary small fw-bold text-uppercase">Employee Full Name</th>
                <th className="py-3 text-secondary small fw-bold text-uppercase text-end">Base Salary</th>
                <th className="py-3 text-secondary small fw-bold text-uppercase text-end">Bonus</th>
                <th className="py-3 text-secondary small fw-bold text-uppercase text-end">Deductions</th>
                <th className="py-3 text-secondary small fw-bold text-uppercase text-end">Net Salary</th>
                <th className="pe-4 py-3 text-secondary small fw-bold text-uppercase text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" className="text-center py-5">Fetching data...</td></tr>
              ) : filteredSalaries.length === 0 ? (
                <tr><td colSpan="6" className="text-center py-5 text-muted">No matching employee records found</td></tr>
              ) : filteredSalaries.map((s) => (
                <tr key={s.employeeId}>
                  <td className="ps-4 py-3 fw-bold text-dark small">
                    {s.fullName} 
                    <br/>
                    <span className="text-secondary extra-small fw-normal">ID: {s.employeeId}</span>
                  </td>
                  <td className="py-3 text-end small">{s.baseSalary ? fmt(s.baseSalary) : "-"}</td>
                  <td className="py-3 text-end text-success small">{s.salaryId ? `+${fmt(s.bonus || 0)}` : "-"}</td>
                  <td className="py-3 text-end text-danger small">{s.salaryId ? `-${fmt(s.deductions || 0)}` : "-"}</td>
                  <td className="py-3 text-end fw-bold text-primary">{s.netSalary ? fmt(s.netSalary) : "-"}</td>
                  <td className="pe-4 py-3 text-center">
                    {s.salaryId ? (
                      <span className="badge bg-success bg-opacity-10 text-success rounded-pill px-3 py-2">Paid</span>
                    ) : (
                      <span className="badge bg-secondary bg-opacity-10 text-secondary rounded-pill px-3 py-2">Pending</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <style>{`.extra-small { font-size: 0.7rem; }`}</style>
    </div>
  );
}
