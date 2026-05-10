import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Users, RefreshCw, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function Departments() {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/departments');
      const result = await response.json();
      if (result.success && result.data) {
        const formatted = result.data.map(dept => ({
          id: dept.id, 
          deptCode: `DEPT-${String(dept.id).padStart(2, '0')}`,
          deptName: dept.name,
          managerName: dept.manager || "Not Assigned",
          employeeCount: dept.employee_count || 0,
          status: 'ACTIVE'
        }));
        setDepartments(formatted);
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to load department data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete department "${name}"?`)) return;
    try {
      const response = await fetch(`http://localhost:5000/api/departments/${id}`, { method: 'DELETE' });
      const result = await response.json();
      if (result.success) {
        toast.success("Department deleted successfully!");
        setDepartments(prev => prev.filter(dept => dept.id !== id));
      } else {
        toast.error("Error: " + result.message);
      }
    } catch (error) {
      toast.error("Could not connect to server for deletion.");
    }
  };

  const filteredDepartments = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return departments.filter(dept => 
      dept.deptName?.toLowerCase().includes(query) ||
      dept.deptCode?.toLowerCase().includes(query)
    );
  }, [departments, searchQuery]);

  if (loading) return <div className="p-5 text-center fw-bold text-secondary">Loading...</div>;

  return (
    <div className="container-fluid p-4 bg-light min-vh-100">
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h1 className="fs-3 fw-bold text-dark mb-1">Department Management</h1>
          <p className="text-secondary small mb-0">{departments.length} active departments in system</p>
        </div>
        <div className="d-flex align-items-center gap-3">
          <div className="position-relative" style={{ width: "20rem" }}>
            <Search size={16} className="position-absolute top-50 translate-middle-y text-secondary" style={{ left: "0.75rem" }} />
            <input
              className="form-control ps-5 bg-white border-light-subtle shadow-sm"
              placeholder="Search code or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ height: "45px", borderRadius: "10px" }}
            />
          </div>
          <button className="btn btn-primary d-flex align-items-center shadow-sm px-4 fw-bold" 
            style={{ height: "45px", borderRadius: "10px", backgroundColor: "#2563eb", border: "none" }}
            onClick={() => navigate("/departments/add")}>
            <Plus size={18} className="me-2" /> Add Department
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="card shadow-sm border-0 rounded-4 overflow-hidden">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th className="py-3 ps-4 text-secondary small fw-bold border-0">CODE</th>
                <th className="py-3 text-secondary small fw-bold border-0 text-uppercase">Department Name</th>
                <th className="py-3 text-secondary small fw-bold border-0 text-uppercase">Manager</th>
                <th className="py-3 text-secondary small fw-bold border-0 text-uppercase">Members</th>
                <th className="py-3 text-secondary small fw-bold border-0 text-uppercase">Status</th>
                <th className="py-3 pe-4 text-end text-secondary small fw-bold border-0 text-uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDepartments.map((dept) => (
                <tr key={dept.id} className="border-bottom">
                  <td className="ps-4 py-4 text-sm text-muted">{dept.deptCode}</td>
                  <td className="py-4 text-sm fw-bold">{dept.deptName}</td>
                  <td className="py-4 text-sm text-secondary">{dept.managerName}</td>
                  <td className="py-4 text-sm text-secondary">{dept.employeeCount} staff members</td>
                  <td className="py-4">
                    <span className="text-white px-3 py-1 rounded-pill fw-bold" 
                      style={{ backgroundColor: "#2563eb", fontSize: "10px" }}>
                      {dept.status}
                    </span>
                  </td>
                  <td className="py-4 pe-4 text-end">
                    <div className="d-flex justify-content-end align-items-center gap-3">
                      <button 
                        className="btn p-0 border-0 text-primary opacity-75 hover:opacity-100"
                        title="View Members"
                        onClick={() => navigate(`/departments/${dept.id}`)}
                      >
                        <Users size={18} />
                      </button>
                      
                      <button className="btn p-0 border-0 text-success opacity-75 hover:opacity-100" title="Refresh" onClick={loadData}>
                        <RefreshCw size={18} />
                      </button>
                      
                      <button className="btn p-0 border-0 text-secondary opacity-75 hover:opacity-100" title="Edit" onClick={() => navigate(`/departments/edit/${dept.id}`)}>
                        <Edit size={18} />
                      </button>
                      
                      <button className="btn p-0 border-0 text-danger opacity-75 hover:opacity-100" title="Delete" onClick={() => handleDelete(dept.id, dept.deptName)}>
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredDepartments.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center py-5 text-muted">No departments found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}