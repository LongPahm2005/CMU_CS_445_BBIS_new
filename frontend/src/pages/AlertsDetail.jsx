import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  Calendar, 
  User, 
  AlertTriangle, 
  Info, 
  CheckCircle,
  Clock,
  Briefcase,
  TrendingUp,
  TrendingDown
} from "lucide-react";

export default function AlertsDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`http://localhost:5000/api/alerts/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const result = await res.json();
        if (result.success) {
          setAlert(result.data);
        }
      } catch (err) {
        console.error("Fetch detail error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  if (loading) return (
    <div className="d-flex justify-content-center align-items-center min-vh-100">
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>
  );

  if (!alert) return (
    <div className="container p-5 text-center">
      <div className="alert alert-danger">Không tìm thấy thông báo hoặc dữ liệu đã bị thay đổi.</div>
      <button onClick={() => navigate("/alerts")} className="btn btn-primary mt-3">Quay lại danh sách</button>
    </div>
  );

  const details = alert.details || {};
  const isWarning = alert.severity === 'warning';

  return (
    <div className="container-fluid p-4 bg-light min-vh-100">
      <div className="container">
        <button onClick={() => navigate("/alerts")} className="btn btn-link text-decoration-none text-secondary p-0 mb-4 d-flex align-items-center">
          <ArrowLeft size={18} className="me-2" /> Quay lại danh sách thông báo
        </button>

        <div className="row g-4">
          <div className="col-lg-8">
            <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4">
              <div className={`card-header border-0 py-4 px-4 ${isWarning ? 'bg-danger text-white' : 'bg-primary text-white'}`}>
                <div className="d-flex align-items-center">
                  <div className="bg-white bg-opacity-25 p-3 rounded-circle me-3 shadow-sm">
                    {isWarning ? <AlertTriangle size={32} /> : <Info size={32} />}
                  </div>
                  <div>
                    <h2 className="h4 mb-1 fw-bold">{alert.title}</h2>
                    <p className="mb-0 opacity-75 small font-monospace">Mã tham chiếu: {alert.id}</p>
                  </div>
                </div>
              </div>
              
              <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h5 className="fw-bold mb-0">Chi tiết sự kiện</h5>
                  <span className={`badge rounded-pill px-3 py-2 ${isWarning ? 'bg-danger-subtle text-danger' : 'bg-primary-subtle text-primary'}`}>
                    {isWarning ? 'Cần chú ý ngay' : 'Thông tin tham khảo'}
                  </span>
                </div>

                <div className="row g-3">
                  {Object.entries(details).map(([key, value]) => (
                    <div key={key} className="col-sm-6">
                      <div className="p-3 border rounded-3 bg-white hover-shadow-sm transition-all">
                        <div className="text-muted small text-uppercase fw-bold mb-1" style={{ letterSpacing: '0.5px', fontSize: '11px' }}>{key}</div>
                        <div className="fw-bold text-dark fs-5">{value}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {alert.type === 'abnormal_salary' && details.changePercent && (
                  <div className={`mt-4 p-3 rounded-3 d-flex align-items-center ${parseFloat(details.changePercent) > 0 ? 'bg-danger-subtle text-danger' : 'bg-success-subtle text-success'}`}>
                    {parseFloat(details.changePercent) > 0 ? <TrendingUp size={20} className="me-2" /> : <TrendingDown size={20} className="me-2" />}
                    <span className="fw-bold">Biến động: {details.changePercent}% so với tháng trước</span>
                  </div>
                )}

                <div className="mt-5 p-4 border-0 bg-light rounded-4">
                  <div className="d-flex align-items-start">
                    <CheckCircle size={24} className="text-success me-3 mt-1" />
                    <div>
                      <h6 className="fw-bold text-dark">Ghi chú xử lý</h6>
                      <p className="text-secondary mb-0 small lh-base">
                        Hệ thống đã tự động ghi nhận sự kiện này. Vui lòng kiểm tra lại với hồ sơ nhân sự hoặc bảng lương gốc để xác minh tính chính xác. 
                        Nếu đây là một sự sai sót dữ liệu, hãy cập nhật tại các phân hệ tương ứng.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-4">
            <div className="card border-0 shadow-sm rounded-4 mb-4">
              <div className="card-body p-4">
                <h6 className="fw-bold mb-4 d-flex align-items-center text-primary">
                  <User size={18} className="me-2" /> Đối tượng liên quan
                </h6>
                
                <div className="text-center mb-4">
                  <div className="d-inline-block p-4 rounded-circle bg-primary bg-opacity-10 text-primary mb-3 shadow-sm">
                    <User size={48} />
                  </div>
                  <h5 className="fw-bold mb-1">{details.Employee || "Hệ thống"}</h5>
                  <p className="text-muted small mb-0">{details.Department || "Toàn công ty"}</p>
                </div>

                <hr className="my-4 opacity-50" />
                
                <div className="space-y-3">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <span className="text-muted small d-flex align-items-center"><Calendar size={14} className="me-2" /> Ngày ghi nhận:</span>
                    <span className="small fw-bold">Hôm nay</span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <span className="text-muted small d-flex align-items-center"><Clock size={14} className="me-2" /> Độ ưu tiên:</span>
                    <span className={`badge rounded-pill ${isWarning ? 'bg-danger' : 'bg-info'}`}>
                      {isWarning ? 'Cao' : 'Bình thường'}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="text-muted small d-flex align-items-center"><Briefcase size={14} className="me-2" /> Phân loại:</span>
                    <span className="badge bg-secondary-subtle text-secondary rounded-pill">{alert.type}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="card border-0 shadow-sm rounded-4 bg-dark text-white overflow-hidden position-relative">
              <div className="card-body p-4 position-relative z-1">
                <h6 className="fw-bold mb-2">Bạn cần hỗ trợ?</h6>
                <p className="small mb-0 opacity-75">Liên hệ bộ phận IT hoặc HR nếu bạn phát hiện lỗi hệ thống trong việc gửi thông báo.</p>
              </div>
              <div className="position-absolute end-0 bottom-0 opacity-10 p-2">
                <Info size={100} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}