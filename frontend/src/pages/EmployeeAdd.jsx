import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Save, User, Mail, Phone, Building2, Briefcase, Activity, UserPlus, Calendar } from "lucide-react";

export default function EmployeeAdd() {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    fullname: "",
    gender: "Male",
    phonenumber: "",
    email: "",
    departmentid: "",
    positionid: "",
    status: "",
    dateofbirth: "",
    hiredate: new Date().toISOString().slice(0, 10),
  });

  useEffect(() => {
    // Load danh mục phòng ban và chức vụ
    const fetchCats = async () => {
      try {
        const [resDept, resPos] = await Promise.all([
          fetch("http://localhost:5000/api/departments_employees"),
          fetch("http://localhost:5000/api/positions")
        ]);
        const depts = await resDept.json();
        const poss = await resPos.json();
        setDepartments(Array.isArray(depts) ? depts : []);
        setPositions(Array.isArray(poss) ? poss : []);
      } catch (err) {
        console.error("Lỗi tải danh mục:", err);
      }
    };
    fetchCats();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.fullname || !formData.departmentid || !formData.positionid || !formData.status) {
      return toast.error("Vui lòng điền đầy đủ các trường bắt buộc (*)");
    }

    setLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const result = await response.json();
      if (result.success) {
        toast.success("Thêm nhân viên mới thành công!");
        navigate("/employees");
      } else {
        toast.error("Lỗi: " + result.message);
      }
    } catch (error) {
      toast.error("Không thể kết nối đến server");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="container-fluid p-4 bg-light min-vh-100">
      <div className="container" style={{ maxWidth: "900px" }}>
        <button onClick={() => navigate("/employees")} className="btn btn-link text-decoration-none text-secondary p-0 mb-4 d-flex align-items-center">
          <ArrowLeft size={18} className="me-2" /> Quay lại danh sách
        </button>

        <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4">
          <div className="card-header bg-primary py-4 px-4 border-0">
            <div className="d-flex align-items-center">
              <div className="bg-white bg-opacity-25 p-3 rounded-circle me-3">
                <UserPlus size={32} className="text-white" />
              </div>
              <div>
                <h2 className="h4 mb-0 text-white fw-bold">Thêm Nhân viên Mới</h2>
                <p className="text-white text-opacity-75 mb-0 small">Hồ sơ sẽ được tự động đồng bộ sang hệ thống Payroll</p>
              </div>
            </div>
          </div>
          
          <div className="card-body p-4 p-md-5">
            <form onSubmit={handleSubmit}>
              <div className="row g-4">
                {/* Họ tên */}
                <div className="col-md-8">
                  <label className="form-label fw-bold text-secondary small text-uppercase">Họ và tên *</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-0"><User size={18} className="text-muted" /></span>
                    <input
                      className="form-control form-control-lg bg-light border-0 shadow-none"
                      value={formData.fullname}
                      onChange={(e) => handleChange("fullname", e.target.value)}
                      placeholder="Nhập họ và tên đầy đủ"
                      required
                    />
                  </div>
                </div>

                {/* Giới tính */}
                <div className="col-md-4">
                  <label className="form-label fw-bold text-secondary small text-uppercase">Giới tính</label>
                  <select
                    className="form-select form-select-lg bg-light border-0 shadow-none"
                    value={formData.gender}
                    onChange={(e) => handleChange("gender", e.target.value)}
                  >
                    <option value="Male">Nam</option>
                    <option value="Female">Nữ</option>
                    <option value="Other">Khác</option>
                  </select>
                </div>

                {/* Email */}
                <div className="col-md-6">
                  <label className="form-label fw-bold text-secondary small text-uppercase">Email</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-0"><Mail size={18} className="text-muted" /></span>
                    <input
                      type="email"
                      className="form-control form-control-lg bg-light border-0 shadow-none"
                      value={formData.email}
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
                      value={formData.phonenumber}
                      onChange={(e) => handleChange("phonenumber", e.target.value)}
                      placeholder="09xx xxx xxx"
                    />
                  </div>
                </div>

                {/* Ngày sinh */}
                <div className="col-md-6">
                  <label className="form-label fw-bold text-secondary small text-uppercase">Ngày sinh *</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-0"><Calendar size={18} className="text-muted" /></span>
                    <input
                      type="date"
                      className="form-control form-control-lg bg-light border-0 shadow-none"
                      value={formData.dateofbirth}
                      onChange={(e) => handleChange("dateofbirth", e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Ngày vào làm */}
                <div className="col-md-6">
                  <label className="form-label fw-bold text-secondary small text-uppercase">Ngày vào làm *</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-0"><Calendar size={18} className="text-muted" /></span>
                    <input
                      type="date"
                      className="form-control form-control-lg bg-light border-0 shadow-none"
                      value={formData.hiredate}
                      onChange={(e) => handleChange("hiredate", e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Phòng ban */}
                <div className="col-md-6">
                  <label className="form-label fw-bold text-secondary small text-uppercase">Phòng ban *</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-0"><Building2 size={18} className="text-muted" /></span>
                    <select
                      className="form-select form-select-lg bg-light border-0 shadow-none"
                      value={formData.departmentid}
                      onChange={(e) => handleChange("departmentid", e.target.value)}
                      required
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
                  <label className="form-label fw-bold text-secondary small text-uppercase">Chức vụ *</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-0"><Briefcase size={18} className="text-muted" /></span>
                    <select
                      className="form-select form-select-lg bg-light border-0 shadow-none"
                      value={formData.positionid}
                      onChange={(e) => handleChange("positionid", e.target.value)}
                      required
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
                  <label className="form-label fw-bold text-secondary small text-uppercase">Trạng thái làm việc *</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-0"><Activity size={18} className="text-muted" /></span>
                    <select
                      className="form-select form-select-lg bg-light border-0 shadow-none"
                      value={formData.status}
                      onChange={(e) => handleChange("status", e.target.value)}
                      required
                    >
                      <option value="">-- Chọn trạng thái --</option>
                      <option value="Đang làm việc">Đang làm việc</option>
                      <option value="Nghỉ phép">Nghỉ phép</option>
                      <option value="Thử việc">Thử việc</option>
                      <option value="Thực tập">Thực tập</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="d-flex justify-content-end gap-2 mt-5 border-top pt-4">
                <button type="button" className="btn btn-light px-4 rounded-pill fw-bold" onClick={() => navigate("/employees")}>Hủy bỏ</button>
                <button 
                  type="submit" 
                  className="btn btn-primary px-5 rounded-pill fw-bold d-inline-flex align-items-center gap-2" 
                  disabled={loading}
                >
                  {loading ? <div className="spinner-border spinner-border-sm"></div> : <Save size={18} />}
                  Thêm & Đồng bộ
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
