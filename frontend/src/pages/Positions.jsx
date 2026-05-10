import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Edit, Trash2, RefreshCw, Search, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

export default function Positions() {
  const navigate = useNavigate();

  const [positions, setPositions] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [syncingId, setSyncingId] = useState(null);

  // =========================
  // Load data
  // =========================
  const loadData = useCallback(async () => {
    try {
      const res = await fetch("http://localhost:5000/api/positions");
      const data = await res.json();
      setPositions(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error("Load positions failed");
      setPositions([]);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // =========================
  // Helper functions
  // =========================
  const getLevelByName = (name = "") => {
    const lower = name.toLowerCase();
    if (["giám đốc", "director", "ceo", "president"].some(k => lower.includes(k))) return 1;
    if (["trưởng phòng", "phó phòng", "manager", "head"].some(k => lower.includes(k))) return 2;
    if (["leader", "engineer", "lead", "supervisor", "advisor"].some(k => lower.includes(k))) return 3;
    if (["intern", "trainee"].some(k => lower.includes(k))) return 5;
    return 4; // Staff/Officer
  };

  const handleSync = async (id) => {
    setSyncingId(id);
    try {
      const res = await fetch(`http://localhost:5000/api/positions/${id}/sync`, {
        method: "POST"
      });
      const result = await res.json();
      if (result.success) {
        toast.success("Synced successfully!");
        loadData();
      } else {
        toast.error(result.message || "Sync failed");
      }
    } catch (err) {
      toast.error("Server error during sync");
    } finally {
      setSyncingId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this position?")) return;

    try {
      const res = await fetch(`http://localhost:5000/api/positions/${id}`, {
        method: "DELETE"
      });
      const result = await res.json();
      if (result.success) {
        toast.success("Deleted successfully");
        loadData();
      } else {
        toast.error(result.message || "Delete failed");
      }
    } catch (err) {
      toast.error("Server error");
    }
  };

  // =========================
  // Filtered data
  // =========================
  const filteredPositions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return positions;
    return positions.filter((pos) =>
      pos.positionname?.toLowerCase().includes(q) ||
      pos.positionid?.toString().includes(q)
    );
  }, [positions, searchQuery]);

  return (
    <div className="container-fluid p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-0 fw-bold">Position Directory</h1>
          <p className="text-muted small mb-0">{positions.length} active positions in system</p>
        </div>
        <div className="d-flex gap-2">
          <div className="input-group" style={{ width: "300px" }}>
            <span className="input-group-text bg-white border-end-0">
              <Search size={16} className="text-muted" />
            </span>
            <input
              className="form-control border-start-0 shadow-none"
              placeholder="Search positions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="btn btn-primary d-flex align-items-center gap-2 rounded-pill px-3 shadow-sm fw-bold" onClick={() => navigate("/positions/add")}>
            <Plus size={18} /> Add New
          </button>
        </div>
      </div>

      <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="bg-light text-secondary small text-uppercase">
              <tr>
                <th className="ps-4 py-3">Code</th>
                <th className="py-3">Position Title</th>
                <th className="py-3">Level</th>
                <th className="py-3">Sync Status</th>
                <th className="text-end pe-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPositions.map((pos) => {
                const level = getLevelByName(pos.positionname);
                const isSynced = !!pos.syncedat;

                return (
                  <tr key={pos.positionid}>
                    <td className="ps-4 py-4">
                      <span className="badge bg-light text-dark border font-monospace px-3 py-2">{pos.positionid}</span>
                    </td>
                    <td className="fw-semibold py-3 fs-6">{pos.positionname}</td>
                    <td className="py-3">
                      <span className={`badge rounded-pill px-3 py-2 ${level <= 2 ? 'bg-primary' : 'bg-secondary'}`}>
                        Level {level}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="d-flex align-items-center gap-2">
                        {isSynced ? (
                          <>
                            <CheckCircle size={16} className="text-success" />
                            <span className="text-success small fw-medium">Synced</span>
                            <span className="text-muted small">({new Date(pos.syncedat).toLocaleDateString('en-US')})</span>
                          </>
                        ) : (
                          <>
                            <XCircle size={16} className="text-danger" />
                            <span className="text-danger small fw-medium">Not Synced</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="text-end pe-4 py-3">
                      <div className="d-flex justify-content-end gap-1">
                        <button 
                          className={`btn btn-icon btn-light border-0 rounded-circle ${syncingId === pos.positionid ? 'disabled' : ''}`}
                          title="Sync from HRM"
                          style={{width: '36px', height: '36px'}}
                          onClick={() => handleSync(pos.positionid)}
                        >
                          <RefreshCw size={16} className={syncingId === pos.positionid ? 'spinner-border spinner-border-sm' : 'text-secondary'} />
                        </button>
                        <button 
                          className="btn btn-icon btn-light border-0 rounded-circle text-primary"
                          title="Edit"
                          style={{width: '36px', height: '36px'}}
                          onClick={() => navigate(`/positions/edit/${pos.positionid}`)}
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          className="btn btn-icon btn-light border-0 rounded-circle text-danger"
                          title="Delete"
                          style={{width: '36px', height: '36px'}}
                          onClick={() => handleDelete(pos.positionid)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredPositions.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center text-muted py-5">No positions found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}