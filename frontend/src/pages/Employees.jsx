import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, Edit, Trash2, Users, UserCheck, UserMinus, Filter, Mail, Phone, Briefcase, Building2 } from "lucide-react";
import { toast } from "sonner";

export default function Employees() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const loadData = async () => {
    setLoading(true);
    try {
      const [resEmp, resDept] = await Promise.all([
        fetch("http://localhost:5000/api/employees"),
        fetch("http://localhost:5000/api/departments_employees")
      ]);
      const empData = await resEmp.json();
      const deptData = await resDept.json();

      const emps = Array.isArray(empData) ? empData : (empData.data || []);
      setEmployees(emps);
      setDepartments(Array.isArray(deptData) ? deptData : []);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load employee data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const stats = useMemo(() => {
    const active = employees.filter(e => {
      const s = String(e.status || "").toLowerCase();
      return s === 'working' || s === 'đang làm việc';
    }).length;
    
    const onLeave = employees.filter(e => {
      const s = String(e.status || "").toLowerCase();
      return s === 'on leave' || s === 'nghỉ phép';
    }).length;

    const probation = employees.filter(e => {
      const s = String(e.status || "").toLowerCase();
      return s === 'probation' || s === 'thử việc';
    }).length;

    const internship = employees.filter(e => {
      const s = String(e.status || "").toLowerCase();
      return s === 'internship' || s === 'thực tập';
    }).length;

    return {
      total: employees.length,
      active: active,
      onLeave: onLeave,
      probation: probation,
      internship: internship
    };
  }, [employees]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return employees.filter((emp) => {
      const matchSearch = !q || 
        emp.fullname?.toLowerCase().includes(q) || 
        String(emp.employeeid).includes(q) ||
        emp.email?.toLowerCase().includes(q);
      const matchDept = deptFilter === "all" || String(emp.departmentid) === deptFilter;
      
      let matchStatus = true;
      if (statusFilter !== "all") {
        const s = String(emp.status || "").toLowerCase();
        if (statusFilter === "working") matchStatus = s === 'working' || s === 'đang làm việc';
        else if (statusFilter === "on-leave") matchStatus = s === 'on leave' || s === 'nghỉ phép';
        else if (statusFilter === "probation") matchStatus = s === 'probation' || s === 'thử việc';
        else if (statusFilter === "internship") matchStatus = s === 'internship' || s === 'thực tập';
      }
      
      return matchSearch && matchDept && matchStatus;
    });
  }, [employees, search, deptFilter, statusFilter]);

  const handleDelete = async (emp) => {
    if (!window.confirm(`Are you sure you want to delete employee ${emp.fullname}?`)) return;
    try {
      const res = await fetch(`http://localhost:5000/api/employees/${emp.employeeid}`, { method: "DELETE" });
      const result = await res.json();
      if (result.success) {
        toast.success("Employee deleted successfully");
        setEmployees(prev => prev.filter(e => e.employeeid !== emp.employeeid));
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Error deleting employee");
    }
  };

  const getStatusBadge = (status) => {
    const s = String(status || "").toLowerCase();
    if (s === 'working' || s === 'đang làm việc') 
      return <span className="badge bg-success bg-opacity-10 text-success rounded-pill px-3">Đang làm việc</span>;
    if (s === 'on leave' || s === 'nghỉ phép') 
      return <span className="badge bg-warning bg-opacity-10 text-warning rounded-pill px-3">Nghỉ phép</span>;
    if (s === 'probation' || s === 'thử việc') 
      return <span className="badge bg-info bg-opacity-10 text-info rounded-pill px-3">Thử việc</span>;
    if (s === 'intern' || s === 'thực tập') 
      return <span className="badge bg-danger bg-opacity-10 text-danger rounded-pill px-3">Thực tập</span>;
    
    return <span className="badge bg-secondary bg-opacity-10 text-secondary rounded-pill px-3">{status}</span>;
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
      <div className="spinner-border text-primary" role="status"></div>
      </div>
    );
  }

  return (
    <div className="container-fluid p-4 bg-light min-vh-100">
      {/* Header & Quick Stats */}
      <div className="row g-4 mb-4" style={{display: "flex", flexWrap: "wrap"}}>
        <div style={{flex: "0 0 calc(20% - 0.9rem)"}}>
          <div className="card border-0 shadow-sm rounded-4 p-3 d-flex flex-row align-items-center h-100">
            <div className="bg-primary bg-opacity-10 p-2 rounded-3 me-2 text-primary">
              <Users size={24} />
            </div>
            <div>
              <h6 className="text-secondary small text-uppercase fw-bold mb-0" style={{fontSize: "10px"}}>Total</h6>
              <h3 className="mb-0 fw-bold" style={{fontSize: "18px"}}>{stats.total}</h3>
            </div>
          </div>
        </div>
        <div style={{flex: "0 0 calc(20% - 0.9rem)"}}>
          <div className="card border-0 shadow-sm rounded-4 p-3 d-flex flex-row align-items-center h-100">
            <div className="bg-success bg-opacity-10 p-2 rounded-3 me-2 text-success">
              <UserCheck size={24} />
            </div>
            <div>
              <h6 className="text-secondary small text-uppercase fw-bold mb-0" style={{fontSize: "10px"}}>Active Staff</h6>
              <h3 className="mb-0 fw-bold text-success" style={{fontSize: "18px"}}>{stats.active}</h3>
            </div>
          </div>
        </div>
        <div style={{flex: "0 0 calc(20% - 0.9rem)"}}>
          <div className="card border-0 shadow-sm rounded-4 p-3 d-flex flex-row align-items-center h-100">
            <div className="bg-warning bg-opacity-10 p-2 rounded-3 me-2 text-warning">
              <UserMinus size={24} />
            </div>
            <div>
              <h6 className="text-secondary small text-uppercase fw-bold mb-0" style={{fontSize: "10px"}}>On Leave</h6>
              <h3 className="mb-0 fw-bold text-warning" style={{fontSize: "18px"}}>{stats.onLeave}</h3>
            </div>
          </div>
        </div>
        <div style={{flex: "0 0 calc(20% - 0.9rem)"}}>
          <div className="card border-0 shadow-sm rounded-4 p-3 d-flex flex-row align-items-center h-100">
            <div className="bg-info bg-opacity-10 p-2 rounded-3 me-2 text-info">
              <UserCheck size={24} />
            </div>
            <div>
              <h6 className="text-secondary small text-uppercase fw-bold mb-0" style={{fontSize: "10px"}}>Probation</h6>
              <h3 className="mb-0 fw-bold text-info" style={{fontSize: "18px"}}>{stats.probation}</h3>
            </div>
          </div>
        </div>
        <div style={{flex: "0 0 calc(20% - 0.9rem)"}}>
          <div className="card border-0 shadow-sm rounded-4 p-3 d-flex flex-row align-items-center h-100">
            <div className="bg-danger bg-opacity-10 p-2 rounded-3 me-2 text-danger">
              <UserCheck size={24} />
            </div>
            <div>
              <h6 className="text-secondary small text-uppercase fw-bold mb-0" style={{fontSize: "10px"}}>Internship</h6>
              <h3 className="mb-0 fw-bold text-danger" style={{fontSize: "18px"}}>{stats.internship}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Actions Bar */}
      <div className="card border-0 shadow-sm rounded-4 p-3 mb-4">
        <div className="row g-3">
          <div className="col-md-4">
            <div className="input-group">
              <span className="input-group-text bg-light border-0"><Search size={18} className="text-muted" /></span>
              <input
                className="form-control bg-light border-0 shadow-none"
                placeholder="Tìm kiếm theo tên, ID, email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="col-md-3">
            <div className="input-group">
              <span className="input-group-text bg-light border-0"><Filter size={18} className="text-muted" /></span>
              <select
                className="form-select bg-light border-0 shadow-none"
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
              >
                <option value="all">Tất cả Phòng ban</option>
                {departments.map((d) => (
                  <option key={d.departmentid} value={String(d.departmentid)}>{d.departmentname}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="col-md-3">
            <div className="input-group">
              <span className="input-group-text bg-light border-0"><Filter size={18} className="text-muted" /></span>
              <select
                className="form-select bg-light border-0 shadow-none"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">Tất cả Trạng thái</option>
                <option value="working">Đang làm việc</option>
                <option value="on-leave">Nghỉ phép</option>
                <option value="probation">Thử việc</option>
                <option value="internship">Thực tập</option>
              </select>
            </div>
          </div>
          <div className="col-md-2 text-end">
            <button className="btn btn-primary w-100 rounded-pill py-2 fw-bold d-flex align-items-center justify-content-center gap-2 shadow-sm" onClick={() => navigate("/employees/add")}>
              <Plus size={18} /> Add new employee
            </button>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="bg-white border-bottom">
              <tr>
                <th className="ps-4 py-3 text-secondary small fw-bold text-uppercase">ID / Employee</th>
                <th className="py-3 text-secondary small fw-bold text-uppercase">Department</th>
                <th className="py-3 text-secondary small fw-bold text-uppercase">Position</th>
                <th className="py-3 text-secondary small fw-bold text-uppercase">Contact</th>
                <th className="py-3 text-secondary small fw-bold text-uppercase text-center">Status</th>
                <th className="pe-4 py-3 text-end text-secondary small fw-bold text-uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? (
                filtered.map((emp) => (
                  <tr key={emp.employeeid} className="border-bottom-0">
                    <td className="ps-4 py-4">
                      <div className="d-flex align-items-center">
                        <div className="bg-primary bg-opacity-10 text-primary fw-bold rounded-circle me-3 d-flex align-items-center justify-content-center" style={{ width: "45px", height: "45px" }}>
                          {emp.fullname?.charAt(0)}
                        </div>
                        <div>
                          <div className="fw-bold text-dark">{emp.fullname}</div>
                          <div className="text-muted small">ID: {emp.employeeid}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4">
                      <div className="d-flex align-items-center gap-2">
                        <Building2 size={16} className="text-muted" />
                        <span className="small">{emp.departmentname || "Not Assigned"}</span>
                      </div>
                    </td>
                    <td className="py-4">
                      <div className="d-flex align-items-center gap-2">
                        <Briefcase size={16} className="text-muted" />
                        <span className="small">{emp.positionname || "Not Assigned"}</span>
                      </div>
                    </td>
                    <td className="py-4">
                      <div className="d-flex flex-column gap-1">
                        <div className="small d-flex align-items-center gap-1"><Mail size={12} className="text-muted" /> {emp.email || "N/A"}</div>
                        <div className="small d-flex align-items-center gap-1"><Phone size={12} className="text-muted" /> {emp.phonenumber || "N/A"}</div>
                      </div>
                    </td>
                    <td className="py-4 text-center">
                      {getStatusBadge(emp.status)}
                    </td>
                    <td className="pe-4 py-4 text-end">
                      <div className="d-flex justify-content-end gap-2">
                        <button className="btn btn-sm btn-light rounded-circle p-2 shadow-sm border" title="Edit" onClick={() => navigate(`/employees/edit/${emp.employeeid}`)}>
                          <Edit size={18} className="text-primary" />
                        </button>
                        <button className="btn btn-sm btn-light rounded-circle p-2 shadow-sm border" title="Delete" onClick={() => handleDelete(emp)}>
                          <Trash2 size={18} className="text-danger" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-5">
                    <div className="text-muted mb-2"><Search size={40} className="opacity-25" /></div>
                    <div className="fw-bold text-secondary">No employees found</div>
                    <div className="small text-muted">Try changing keywords or filters</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}