import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Save, Info, CheckCircle, Sparkles, ShieldCheck } from "lucide-react";

export default function PositionAdd() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [position, setPosition] = useState({
    positionname: "",
  });
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
    setSuggestedLevel(getLevelByName(position.positionname));
  }, [position.positionname]);

  const handleSave = async () => {
    if (!position.positionname) {
      return toast.error("Vui lòng nhập tên chức vụ");
    }
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/positions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(position),
      });
      const result = await res.json();
      if (result.success) {
        toast.success(`Thêm mới thành công! (Mã ID: ${result.new_id})`);
        navigate("/positions");
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Lỗi server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid p-4 bg-light min-vh-100">
      <div className="container" style={{ maxWidth: "800px" }}>
        <button onClick={() => navigate("/positions")} className="btn btn-link text-decoration-none text-secondary p-0 mb-4 d-flex align-items-center">
          <ArrowLeft size={18} className="me-2" /> Quay lại danh sách
        </button>

        <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
          <div className="card-header bg-primary py-4 px-4 border-0">
            <h2 className="h4 mb-0 text-white fw-bold">Thêm Chức vụ Mới</h2>
            <p className="text-white text-opacity-75 mb-0 small">Thiết lập chức vụ và kiểm tra phân cấp tự động</p>
          </div>
          
          <div className="card-body p-4">
            <div className="row g-4">
              <div className="col-md-12">
                <label className="form-label fw-bold text-secondary small text-uppercase">Tên Chức vụ</label>
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control form-control-lg bg-light border-0 shadow-none"
                    placeholder="Ví dụ: Trưởng phòng Kinh doanh"
                    value={position.positionname}
                    onChange={(e) => setPosition({ ...position, positionname: e.target.value })}
                    autoFocus
                  />
                </div>
              </div>

              <div className="col-md-12">
                <label className="form-label fw-bold text-secondary small text-uppercase">Phân cấp dự kiến (Level)</label>
                <div className="d-flex align-items-center gap-3 p-3 bg-light rounded-3 border border-dashed">
                  <div className={`badge rounded-circle p-3 ${suggestedLevel <= 2 ? 'bg-primary' : 'bg-secondary'}`} style={{ width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span className="h5 mb-0 text-white">{suggestedLevel}</span>
                  </div>
                  <div>
                    <h6 className="mb-1 fw-bold">Level {suggestedLevel}</h6>
                    <p className="mb-0 text-muted small">
                      {suggestedLevel === "1" && "Cấp lãnh đạo cao cấp (Executive)"}
                      {suggestedLevel === "2" && "Cấp quản lý (Management)"}
                      {suggestedLevel === "3" && "Cấp chuyên gia / Trưởng nhóm"}
                      {suggestedLevel === "4" && "Cấp nhân viên chính thức"}
                      {suggestedLevel === "5" && "Cấp thực tập / Thử việc"}
                    </p>
                  </div>
                  <div className="ms-auto">
                    <ShieldCheck className="text-success" size={20} />
                  </div>
                </div>
                <div className="form-text text-muted small mt-2">
                  <Sparkles size={14} className="me-1 text-primary" /> 
                  Hệ thống tự động xác định Level dựa trên tên bạn nhập (không lưu vào SQL).
                </div>
              </div>
            </div>

            <div className="mt-5 p-4 bg-primary bg-opacity-10 rounded-4 border border-primary border-opacity-10">
              <div className="d-flex align-items-start gap-3">
                <CheckCircle className="text-primary mt-1" size={20} />
                <div>
                  <h6 className="fw-bold text-primary mb-1">Cơ chế đồng bộ</h6>
                  <p className="text-secondary small mb-0 lh-base">
                    Mã ID sẽ được cấp liên tục bởi SQL Server. Tên chức vụ sẽ được đồng bộ sang Payroll ngay sau khi bạn nhấn Lưu.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="card-footer bg-white p-4 border-0 text-end">
            <button className="btn btn-light px-4 me-2 rounded-pill fw-bold" onClick={() => navigate("/positions")}>Hủy bỏ</button>
            <button 
              className="btn btn-primary px-5 rounded-pill fw-bold d-inline-flex align-items-center gap-2" 
              onClick={handleSave}
              disabled={loading}
            >
              {loading ? <div className="spinner-border spinner-border-sm"></div> : <Save size={18} />}
              Lưu & Cấp ID
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
