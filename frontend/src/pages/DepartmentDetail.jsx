import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Users, Building2, UserCheck, Mail, Briefcase, ChevronRight, Activity, Plus } from "lucide-react";

export default function DepartmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [department, setDepartment] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/departments/${id}/detail`);
      const result = await res.json();

      if (result.success) {
        setDepartment(result.data);
      } else {
        toast.error(result.message || "Không tìm thấy phòng ban");
        navigate("/departments");
      }
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

  if (loading || !department) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-primary"></div>
      </div>
    );
  }

  return (
    <div className="container-fluid p-4 bg-light min-vh-100">
      <div className="container" style={{ maxWidth: "1100px" }}>
        {/* Breadcrumb & Back */}
        <div className="d-flex align-items-center gap-2 mb-4">
          <button onClick={() => navigate("/departments")} className="btn btn-link text-decoration-none text-secondary p-0 d-flex align-items-center">
            <ArrowLeft size={18} className="me-2" /> Departments
          </button>
          <ChevronRight size={14} className="text-muted" />
          <span className="text-primary fw-bold">{department.name}</span>
        </div>

        {/* Header Stats Card */}
        <div className="row g-4 mb-4">
          <div className="col-md-8">
            <div className="card border-0 shadow-sm rounded-4 overflow-hidden h-100">
              <div className="card-header bg-primary py-4 px-4 border-0 d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center">
                  <div className="bg-white bg-opacity-25 p-3 rounded-circle me-3">
                    <Building2 size={32} className="text-white" />
                  </div>
                  <div>
                    <h1 className="h3 mb-0 text-white fw-bold">{department.name}</h1>
                    <p className="text-white text-opacity-75 mb-0 small">Mã định danh: DEPT-{String(department.id).padStart(2, '0')}</p>
                  </div>
                </div>
                <button className="btn btn-white bg-white text-primary rounded-pill px-4 fw-bold shadow-sm" onClick={() => navigate(`/employees/add?dept=${department.id}`)}>
                  <Plus size={18} className="me-1" /> Thêm nhân viên
                </button>
              </div>
              <div className="card-body p-4 bg-white">
                <div className="row text-center">
                  <div className="col-4 border-end">
                    <h5 className="text-muted small text-uppercase mb-2">Trưởng phòng</h5>
                    <div className="d-flex align-items-center justify-content-center gap-2">
                      <div className="bg-info bg-opacity-10 p-2 rounded-circle">
                        <UserCheck size={18} className="text-info" />
                      </div>
                      <span className="fw-bold text-dark">{department.manager}</span>
                    </div>
                  </div>
                  <div className="col-4 border-end">
                    <h5 className="text-muted small text-uppercase mb-2">Tổng nhân sự</h5>
                    <div className="d-flex align-items-center justify-content-center gap-2">
                      <div className="bg-primary bg-opacity-10 p-2 rounded-circle">
                        <Users size={18} className="text-primary" />
                      </div>
                      <span className="fw-bold text-dark h4 mb-0">{department.total}</span>
                    </div>
                  </div>
                  <div className="col-4">
                    <h5 className="text-muted small text-uppercase mb-2">Trạng thái</h5>
                    <span className="badge bg-success rounded-pill px-3">HOẠT ĐỘNG</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card border-0 shadow-sm rounded-4 h-100 bg-white p-4">
              <h5 className="fw-bold mb-4 d-flex align-items-center gap-2">
                <Activity size={20} className="text-primary" /> Phân tích nhanh
              </h5>
              <div className="mb-4">
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-secondary small">Tỷ lệ lấp đầy</span>
                  <span className="fw-bold small">85%</span>
                </div>
                <div className="progress" style={{ height: "8px" }}>
                  <div className="progress-bar bg-primary" style={{ width: "85%" }}></div>
                </div>
              </div>
              <div>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-secondary small">Đồng bộ dữ liệu</span>
                  <span className="text-success fw-bold small">Ổn định</span>
                </div>
                <div className="alert alert-light border-0 small mb-0 py-2">
                  Tất cả nhân viên đã được đồng bộ sang hệ thống Payroll.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Members Table */}
        <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4">
          <div className="card-header bg-white py-3 px-4 border-bottom d-flex justify-content-between align-items-center">
            <h5 className="mb-0 fw-bold d-flex align-items-center gap-2">
              <Users size={20} className="text-primary" /> Danh sách thành viên
            </h5>
            <div className="text-muted small">{department.employees.length} nhân viên trong phòng</div>
          </div>
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="bg-light">
                <tr>
                  <th className="ps-4 py-3 text-secondary small fw-bold border-0">NHÂN VIÊN</th>
                  <th className="py-3 text-secondary small fw-bold border-0">CHỨC VỤ</th>
                  <th className="py-3 text-secondary small fw-bold border-0">LIÊN HỆ</th>
                  <th className="py-3 text-secondary small fw-bold border-0">TRẠNG THÁI</th>
                  <th className="pe-4 py-3 text-end text-secondary small fw-bold border-0">THAO TÁC</th>
                </tr>
              </thead>
              <tbody>
                {department.employees.map((emp) => (
                  <tr key={emp.id}>
                    <td className="ps-4 py-3">
                      <div className="d-flex align-items-center">
                        <div className="bg-primary bg-opacity-10 text-primary fw-bold rounded-circle me-3 d-flex align-items-center justify-content-center" style={{ width: "40px", height: "40px" }}>
                          {emp.name.charAt(0)}
                        </div>
                        <div>
                          <div className="fw-bold">{emp.name}</div>
                          <div className="text-muted small">ID: {emp.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3">
                      <div className="d-flex align-items-center gap-2">
                        <Briefcase size={16} className="text-muted" />
                        <span>{emp.position}</span>
                      </div>
                    </td>
                    <td className="py-3">
                      <div className="d-flex align-items-center gap-2">
                        <Mail size={16} className="text-muted" />
                        <span className="small text-secondary">{emp.email || "N/A"}</span>
                      </div>
                    </td>
                    <td className="py-3">
                      <span className={`badge rounded-pill px-3 ${emp.status === 'Working' ? 'bg-success' : 'bg-warning text-dark'}`}>
                        {emp.status === 'Working' ? 'Đang làm việc' : emp.status}
                      </span>
                    </td>
                    <td className="pe-4 py-3 text-end">
                      <button className="btn btn-sm btn-light rounded-pill px-3 fw-bold" onClick={() => navigate(`/employees/edit/${emp.id}`)}>
                        Xem hồ sơ
                      </button>
                    </td>
                  </tr>
                ))}
                {department.employees.length === 0 && (
                  <tr>
                    <td colSpan="5" className="text-center py-5 text-muted">Phòng ban này hiện chưa có nhân viên nào.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
