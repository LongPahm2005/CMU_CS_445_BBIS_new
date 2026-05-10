import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Save, Building2, Info, Users, Edit3 } from "lucide-react";

export default function EditDepartment() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [deptName, setDeptName] = useState("");
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/departments/${id}/detail`);
      const result = await res.json();

      if (result.success) {
        setDeptName(result.data.name);
        setEmployees(result.data.employees || []);
      } else {
        toast.error(result.message || "Không tìm thấy phòng ban");
        navigate("/departments");
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
    if (!deptName.trim()) return toast.error("Tên phòng ban không được để trống");
    
    setSaving(true);
    try {
      const res = await fetch(`http://localhost:5000/api/departments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: deptName.trim() }),
      });

      const result = await res.json();
      if (result.success) {
        toast.success("Cập nhật tên phòng ban thành công!");
        navigate("/departments");
      } else {
        toast.error(result.message || "Cập nhật thất bại");
      }
    } catch (err) {
      toast.error("Lỗi server");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-primary"></div>
      </div>
    );
  }

  return (
    <div className="container-fluid p-4 bg-light min-vh-100">
      <div className="container" style={{ maxWidth: "800px" }}>
        <button onClick={() => navigate("/departments")} className="btn btn-link text-decoration-none text-secondary p-0 mb-4 d-flex align-items-center">
          <ArrowLeft size={18} className="me-2" /> Quay lại danh sách
        </button>

        <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4">
          <div className="card-header bg-primary py-4 px-4 border-0">
            <div className="d-flex align-items-center">
              <div className="bg-white bg-opacity-25 p-3 rounded-circle me-3">
                <Building2 size={32} className="text-white" />
              </div>
              <div>
                <h2 className="h4 mb-0 text-white fw-bold">Chỉnh sửa Phòng ban</h2>
                <p className="text-white text-opacity-75 mb-0 small">Mã phòng: DEPT-{String(id).padStart(2, '0')}</p>
              </div>
            </div>
          </div>
          
          <div className="card-body p-4">
            <div className="mb-4">
              <label className="form-label fw-bold text-secondary small text-uppercase">Tên Phòng Ban</label>
              <div className="input-group">
                <span className="input-group-text bg-light border-0"><Edit3 size={18} className="text-muted" /></span>
                <input
                  className="form-control form-control-lg bg-light border-0 shadow-none"
                  value={deptName}
                  onChange={(e) => setDeptName(e.target.value)}
                  placeholder="Nhập tên phòng ban mới"
                />
              </div>
            </div>

            <div className="p-4 bg-light rounded-4 border border-dashed mb-4">
              <div className="d-flex align-items-center gap-2 mb-3">
                <Users size={20} className="text-primary" />
                <h6 className="fw-bold mb-0">Danh sách nhân sự hiện tại ({employees.length})</h6>
              </div>
              <div className="list-group list-group-flush bg-transparent">
                {employees.slice(0, 5).map((emp) => (
                  <div key={emp.id} className="list-group-item bg-transparent border-0 px-0 py-2 d-flex justify-content-between align-items-center">
                    <span className="small fw-medium">{emp.name}</span>
                    <span className="badge bg-white text-primary border border-primary-subtle rounded-pill" style={{ fontSize: '10px' }}>{emp.position}</span>
                  </div>
                ))}
                {employees.length > 5 && (
                  <button className="btn btn-link btn-sm text-decoration-none p-0 mt-2" onClick={() => navigate(`/departments/${id}`)}>
                    Và {employees.length - 5} nhân viên khác... Xem chi tiết
                  </button>
                )}
                {employees.length === 0 && <div className="text-muted small italic">Chưa có nhân viên nào trong phòng này.</div>}
              </div>
            </div>

            <div className="p-4 bg-info bg-opacity-10 rounded-4 border border-info border-opacity-10">
              <div className="d-flex align-items-start gap-3">
                <Info className="text-info mt-1" size={20} />
                <div>
                  <h6 className="fw-bold text-info mb-1">Quy tắc quản lý</h6>
                  <p className="text-secondary small mb-0 lh-base">
                    Trưởng phòng được xác định dựa trên nhân viên có chức vụ là "Trưởng phòng" trong danh sách nhân sự trên. 
                    Để thay đổi trưởng phòng, hãy thay đổi chức vụ của nhân viên đó.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="card-footer bg-white p-4 border-0 text-end">
            <button className="btn btn-light px-4 me-2 rounded-pill fw-bold" onClick={() => navigate("/departments")}>Hủy bỏ</button>
            <button 
              className="btn btn-primary px-5 rounded-pill fw-bold d-inline-flex align-items-center gap-2" 
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
