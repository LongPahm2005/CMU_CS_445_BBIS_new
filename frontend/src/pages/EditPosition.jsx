import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Save, Info, Trash2, UserCheck, Sparkles } from "lucide-react";

export default function EditPosition() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [position, setPosition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [suggestedLevel, setSuggestedLevel] = useState("4");

  const getLevelByName = (name = "") => {
    const lower = name.toLowerCase();
    if (["giám đốc", "director", "ceo"].some(k => lower.includes(k))) return "1";
    if (["trưởng phòng", "phó phòng", "manager"].some(k => lower.includes(k))) return "2";
    if (["leader", "engineer", "trưởng nhóm", "cố vấn", "kỹ sư"].some(k => lower.includes(k))) return "3";
    if (["thử việc", "thực tập", "intern"].some(k => lower.includes(k))) return "5";
    return "4";
  };

  useEffect(() => {
    if (position?.positionname) {
      setSuggestedLevel(getLevelByName(position.positionname));
    }
  }, [position?.positionname]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/positions/${id}`);
      const result = await res.json();

      if (result.success) {
        setPosition({
          positionname: result.data.positionname || "",
          positionid: result.data.positionid || "",
        });
      } else {
        toast.error(result.message || "Không tìm thấy chức vụ");
        navigate("/positions");
      }
    } catch (err) {
      toast.error("Lỗi khi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleUpdate = async () => {
    setSaving(true);
    try {
      const res = await fetch(`http://localhost:5000/api/positions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(position),
      });

      const result = await res.json();
      if (result.success) {
        toast.success("Cập nhật thành công!");
        navigate("/positions");
      } else {
        toast.error(result.message || "Cập nhật thất bại");
      }
    } catch (err) {
      toast.error("Lỗi server");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Bạn có chắc muốn xóa chức vụ này?")) return;
    try {
      const res = await fetch(`http://localhost:5000/api/positions/${id}`, { method: "DELETE" });
      const result = await res.json();
      if (result.success) {
        toast.success("Đã xóa chức vụ");
        navigate("/positions");
      }
    } catch (err) {
      toast.error("Không thể xóa");
    }
  };

  if (loading || !position) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-primary"></div>
      </div>
    );
  }

  return (
    <div className="container-fluid p-4 bg-light min-vh-100">
      <div className="container" style={{ maxWidth: "800px" }}>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <button onClick={() => navigate("/positions")} className="btn btn-link text-decoration-none text-secondary p-0 d-flex align-items-center">
            <ArrowLeft size={18} className="me-2" /> Quay lại danh sách
          </button>
          <button className="btn btn-outline-danger btn-sm rounded-pill px-3 d-flex align-items-center gap-2" onClick={handleDelete}>
            <Trash2 size={16} /> Xóa chức vụ
          </button>
        </div>

        <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4">
          <div className="card-header bg-dark py-4 px-4 border-0">
            <div className="d-flex align-items-center">
              <div className="bg-white bg-opacity-10 p-3 rounded-circle me-3">
                <UserCheck size={32} className="text-white" />
              </div>
              <div>
                <h2 className="h4 mb-0 text-white fw-bold">Chỉnh sửa Chức vụ</h2>
                <p className="text-white text-opacity-50 mb-0 small">Mã hệ thống: {position.positionid}</p>
              </div>
            </div>
          </div>
          
          <div className="card-body p-4">
            <div className="row g-4">
              <div className="col-md-12">
                <label className="form-label fw-bold text-secondary small text-uppercase">Tên Chức vụ</label>
                <input
                  type="text"
                  className="form-control form-control-lg bg-light border-0 shadow-none"
                  value={position.positionname}
                  onChange={(e) => setPosition({ ...position, positionname: e.target.value })}
                  autoFocus
                />
              </div>

              <div className="col-md-12">
                <label className="form-label fw-bold text-secondary small text-uppercase">Phân cấp hiện tại (Level)</label>
                <div className="d-flex align-items-center gap-3 p-3 bg-light rounded-3 border border-dashed">
                  <div className={`badge rounded-circle p-3 ${suggestedLevel <= 2 ? 'bg-primary' : 'bg-secondary'}`} style={{ width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span className="h5 mb-0 text-white">{suggestedLevel}</span>
                  </div>
                  <div>
                    <h6 className="mb-1 fw-bold">Level {suggestedLevel}</h6>
                    <p className="mb-0 text-muted small">
                      Phân cấp tự động dựa trên tên chức vụ.
                    </p>
                  </div>
                </div>
                <div className="form-text text-muted small mt-2">
                  <Sparkles size={14} className="me-1 text-primary" /> 
                  Level sẽ thay đổi nếu bạn đổi tên chức vụ sang nhóm phân cấp khác.
                </div>
              </div>
            </div>

            <div className="mt-5 p-4 bg-info bg-opacity-10 rounded-4 border border-info border-opacity-10">
              <div className="d-flex align-items-start gap-3">
                <Info className="text-info mt-1" size={20} />
                <div>
                  <h6 className="fw-bold text-info mb-1">Lưu ý khi cập nhật</h6>
                  <p className="text-secondary small mb-0 lh-base">
                    Việc đổi tên chức vụ sẽ ảnh hưởng đến hiển thị trên bảng lương và báo cáo nhân sự. 
                    Dữ liệu sẽ được đồng bộ ngay lập tức sang cả hai hệ thống.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="card-footer bg-white p-4 border-0 text-end">
            <button className="btn btn-light px-4 me-2 rounded-pill fw-bold" onClick={() => navigate("/positions")}>Hủy bỏ</button>
            <button 
              className="btn btn-dark px-5 rounded-pill fw-bold d-inline-flex align-items-center gap-2" 
              onClick={handleUpdate}
              disabled={saving}
            >
              {saving ? <div className="spinner-border spinner-border-sm"></div> : <Save size={18} />}
              Lưu thay đổi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}