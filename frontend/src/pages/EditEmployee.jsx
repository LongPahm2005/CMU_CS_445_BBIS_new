import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Save, User, Mail, Phone, Building2, Briefcase, Activity } from "lucide-react";

export default function EditEmployee() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [employee, setEmployee] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [empRes, deptRes, posRes] = await Promise.all([
        fetch(`http://localhost:5000/api/employees/${id}`),
        fetch("http://localhost:5000/api/departments_employees"),
        fetch("http://localhost:5000/api/positions"),
      ]);

      const empResult = await empRes.json();
      const depts = await deptRes.json();
      const poss = await posRes.json();

      if (empResult.success) {
        setEmployee(empResult.data);
      } else {
        toast.error(empResult.message || "Không tìm thấy nhân viên");
        navigate("/employees");
      }

      setDepartments(Array.isArray(depts) ? depts : []);
      setPositions(Array.isArray(poss) ? poss : []);
    } catch (err) {
      console.error(err);
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
      const res = await fetch(`http://localhost:5000/api/employees/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(employee),
      });

      const result = await res.json();
      if (result.success) {
        toast.success("Cập nhật thành công!");
        navigate("/employees");
      } else {
        toast.error(result.message || "Cập nhật thất bại");
      }
    } catch (err) {
      toast.error("Lỗi server");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (key, value) => {
    setEmployee((prev) => ({ ...prev, [key]: value }));
  };

  if (loading || !employee) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-primary"></div>
      </div>
    );
  }

  return (
    <div className="container-fluid p-4 bg-light min-vh-100">
      <div className="container" style={{ maxWidth: "900px" }}>
        <button onClick={() => navigate("/employees")} className="btn btn-link text-decoration-none text-secondary p-0 mb-4 d-flex align-items-center">
          <ArrowLeft size={18} className="me-2" /> Quay lại danh sách nhân viên
        </button>

        <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4">
          <div className="card-header bg-primary py-4 px-4 border-0">
            <div className="d-flex align-items-center">
              <div className="bg-white bg-opacity-25 p-3 rounded-circle me-3">
                <User size={32} className="text-white" />
              </div>
              <div>
                <h2 className="h4 mb-0 text-white fw-bold">Chỉnh sửa hồ sơ nhân sự</h2>
                <p className="text-white text-opacity-75 mb-0 small">Mã nhân viên: {employee.employeeid}</p>
              </div>
            </div>
          </div>
          
          <div className="card-body p-4">
            <div className="row g-4">
              {/* Họ tên */}
              <div className="col-md-8">
                <label className="form-label fw-bold text-secondary small text-uppercase">Họ và tên</label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-0"><User size={18} className="text-muted" /></span>
                  <input
                    className="form-control form-control-lg bg-light border-0 shadow-none"
                    value={employee.fullname || ""}
                    onChange={(e) => handleChange("fullname", e.target.value)}
                    placeholder="Nhập họ và tên đầy đủ"
                  />
                </div>
              </div>

              {/* Giới tính */}
              <div className="col-md-4">
                <label className="form-label fw-bold text-secondary small text-uppercase">Giới tính</label>
                <select
                  className="form-select form-select-lg bg-light border-0 shadow-none"
                  value={employee.gender || "Male"}
                  onChange={(e) => handleChange("gender", e.target.value)}
                >
                  <option value="Male">Nam</option>
                  <option value="Female">Nữ</option>
                  <option value="Other">Khác</option>
                </select>
              </div>

              {/* Email */}
              <div className="col-md-6">
                <label className="form-label fw-bold text-secondary small text-uppercase">Email công việc</label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-0"><Mail size={18} className="text-muted" /></span>
                  <input
                    className="form-control form-control-lg bg-light border-0 shadow-none"
                    value={employee.email || ""}
                    onChange={(e) => handleChange("email", e.target.value)}
                    placeholder="example@company.com"
                  />
                </div>
              </div>

              {/* Số điện thoại */}
              <div className="col-md-6">
                <label className="form-label fw-bold text-secondary small text-uppercase">Số điện thoại</label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-0"><Phone size={18} className="text-muted" /></span>
                  <input
                    className="form-control form-control-lg bg-light border-0 shadow-none"
                    value={employee.phonenumber || ""}
                    onChange={(e) => handleChange("phonenumber", e.target.value)}
                    placeholder="09xx xxx xxx"
                  />
                </div>
              </div>

              {/* Phòng ban */}
              <div className="col-md-6">
                <label className="form-label fw-bold text-secondary small text-uppercase">Phòng ban</label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-0"><Building2 size={18} className="text-muted" /></span>
                  <select
                    className="form-select form-select-lg bg-light border-0 shadow-none"
                    value={employee.departmentid || ""}
                    onChange={(e) => handleChange("departmentid", e.target.value)}
                  >
                    <option value="">-- Chọn phòng ban --</option>
                    {departments.map((d) => (
                      <option key={d.departmentid} value={d.departmentid}>{d.departmentname}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Chức vụ */}
              <div className="col-md-6">
                <label className="form-label fw-bold text-secondary small text-uppercase">Chức vụ</label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-0"><Briefcase size={18} className="text-muted" /></span>
                  <select
                    className="form-select form-select-lg bg-light border-0 shadow-none"
                    value={employee.positionid || ""}
                    onChange={(e) => handleChange("positionid", e.target.value)}
                  >
                    <option value="">-- Chọn chức vụ --</option>
                    {positions.map((p) => (
                      <option key={p.positionid} value={p.positionid}>{p.positionname}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Trạng thái */}
              <div className="col-md-12">
                <label className="form-label fw-bold text-secondary small text-uppercase">Trạng thái làm việc</label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-0"><Activity size={18} className="text-muted" /></span>
                  <select
                    className="form-select form-select-lg bg-light border-0 shadow-none"
                    value={employee.status}
                    onChange={(e) => handleChange("status", e.target.value)}
                  >
                    <option value="Đang làm việc">Đang làm việc</option>
                    <option value="Nghỉ phép">Nghỉ phép</option>
                    <option value="Thử việc">Thử việc</option>
                    <option value="Thực tập">Thực tập</option>
                    <option value="Đã nghỉ việc">Đã nghỉ việc</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="card-footer bg-white p-4 border-0 text-end">
            <button className="btn btn-light px-4 me-2 rounded-pill fw-bold" onClick={() => navigate("/employees")}>Hủy bỏ</button>
            <button 
              className="btn btn-primary px-5 rounded-pill fw-bold d-inline-flex align-items-center gap-2" 
              onClick={handleUpdate}
              disabled={saving}
            >
              {saving ? <div className="spinner-border spinner-border-sm"></div> : <Save size={18} />}
              Lưu hồ sơ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}