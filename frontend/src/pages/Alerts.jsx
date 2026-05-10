import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Info,
  Search,
  Eye,
  Calendar,
  Gift,
  Award,
  Building2,
  Filter,
  RefreshCw,
  Clock,
  UserPlus
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState({ total: 0, warnings: 0, info: 0 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const navigate = useNavigate();

  const typeIcons = {
    excessive_leave: Calendar,
    abnormal_salary: AlertTriangle,
    anniversary: Award,
    birthday: Gift,
    upcoming_anniversary: Clock,
    upcoming_birthday: Clock,
    department: Building2,
    welcome: UserPlus,
  };

  const typeLabels = {
    excessive_leave: "Leave Alert",
    abnormal_salary: "Salary Alert",
    anniversary: "Anniversary",
    birthday: "Birthday",
    upcoming_anniversary: "Upcoming Anniversary",
    upcoming_birthday: "Upcoming Birthday",
    department: "Department",
    welcome: "New Member",
  };

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams({
        type: typeFilter,
        severity: severityFilter,
        search: searchQuery,
      });
      const res = await fetch(`http://localhost:5000/api/alerts?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (result.success) {
        setAlerts(result.data || []);
        setStats(result.stats);
      }
    } catch (err) {
      console.error("Fetch alerts error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [typeFilter, severityFilter, searchQuery]);

  return (
    <div className="container-fluid p-4 bg-light min-vh-100">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-1 fw-bold">Notifications & Alerts</h1>
          <p className="text-muted mb-0">
            Total: {stats.total} | <span className="text-danger">{stats.warnings} Warnings</span> | <span className="text-primary">{stats.info} Information</span>
          </p>
        </div>
        <button onClick={fetchAlerts} className="btn btn-outline-secondary btn-sm rounded-pill px-3 shadow-sm border-2 fw-bold">
          <RefreshCw size={14} className="me-1" /> Refresh
        </button>
      </div>

      <div className="card border-0 shadow-sm mb-4 overflow-hidden rounded-4">
        <div className="card-body p-3">
          <div className="row g-3">
            <div className="col-md-5">
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0">
                  <Search size={16} className="text-muted" />
                </span>
                <input
                  type="text"
                  className="form-control border-start-0 ps-0 shadow-none"
                  placeholder="Search by name, content or code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-3">
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0">
                  <Filter size={16} className="text-muted" />
                </span>
                <select
                  className="form-select border-start-0 ps-0 shadow-none"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  <option value="all">All Types</option>
                  {Object.entries(typeLabels).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="col-md-4">
              <div className="btn-group w-100">
                <button 
                  className={`btn ${severityFilter === 'all' ? 'btn-dark' : 'btn-outline-dark shadow-sm'}`}
                  onClick={() => setSeverityFilter('all')}
                >All</button>
                <button 
                  className={`btn ${severityFilter === 'warning' ? 'btn-danger' : 'btn-outline-danger shadow-sm'}`}
                  onClick={() => setSeverityFilter('warning')}
                >Warnings</button>
                <button 
                  className={`btn ${severityFilter === 'info' ? 'btn-primary' : 'btn-outline-primary shadow-sm'}`}
                  onClick={() => setSeverityFilter('info')}
                >Info</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="bg-light">
              <tr>
                <th className="ps-4 py-3 text-secondary small fw-bold text-uppercase">Code</th>
                <th className="py-3 text-secondary small fw-bold text-uppercase">Type</th>
                <th className="py-3 text-secondary small fw-bold text-uppercase">Involved Person</th>
                <th className="py-3 text-secondary small fw-bold text-uppercase">Description</th>
                <th className="py-3 text-secondary small fw-bold text-uppercase text-center">Severity</th>
                <th className="pe-4 py-3 text-secondary small fw-bold text-uppercase text-end">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" className="text-center py-5"><RefreshCw className="spinner-border spinner-border-sm me-2" /> Loading...</td></tr>
              ) : alerts.length === 0 ? (
                <tr><td colSpan="6" className="text-center py-5 text-muted">No notifications found.</td></tr>
              ) : (
                alerts.map((alert) => {
                  const Icon = typeIcons[alert.type] || Info;
                  return (
                    <tr key={alert.id}>
                      <td className="ps-4">
                        <span className="badge bg-light text-dark border font-monospace">{alert.displayId}</span>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className={`p-2 rounded-3 me-2 ${alert.severity === 'warning' ? 'bg-danger-subtle text-danger' : 'bg-primary-subtle text-primary'}`}>
                            <Icon size={18} />
                          </div>
                          <span className="fw-medium">{typeLabels[alert.type]}</span>
                        </div>
                      </td>
                      <td><span className="fw-semibold">{alert.employeeName || "System"}</span></td>
                      <td style={{ maxWidth: "300px" }} className="text-truncate">{alert.description}</td>
                      <td className="text-center">
                        <span className={`badge rounded-pill px-3 py-2 ${alert.severity === 'warning' ? 'bg-danger text-white' : 'bg-info text-white'}`}>
                          {alert.severity === 'warning' ? 'Warning' : 'Info'}
                        </span>
                      </td>
                      <td className="text-end pe-4">
                        <button className="btn btn-sm btn-white border shadow-sm rounded-pill px-3 fw-bold" onClick={() => navigate(`/alerts/${alert.id}`)}>
                          <Eye size={14} className="me-1" /> View Details
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}