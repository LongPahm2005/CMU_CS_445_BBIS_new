import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Building2, Save, PlusCircle, Info } from "lucide-react";

export default function DepartmentAdd() {
  const navigate = useNavigate();
  const [deptName, setDeptName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!deptName.trim()) {
      return toast.error("Vui lòng nhập tên phòng ban");
    }

    setLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: deptName.trim() }),
      });

      const result = await response.json();
      if (result.success) {
        toast.success("Thêm phòng ban mới thành công!");
        navigate("/departments");
      } else {
        toast.error(result.message || "Không thể thêm phòng ban");
      }
    } catch (error) {
      toast.error("Lỗi kết nối đến server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid p-4 bg-light min-vh-100">
      <div className="container" style={{ maxWidth: "700px" }}>
        {/* Nút quay lại */}
        <button 
          onClick={() => navigate("/departments")} 
          className="btn btn-link text-decoration-none text-secondary p-0 mb-4 d-flex align-items-center"
        >
          <ArrowLeft size={18} className="me-2" /> Quay lại danh sách
        </button>

        {/* Thẻ chính */}
        <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
          {/* Header Card */}
          <div className="card-header bg-primary py-4 px-4 border-0">
            <div className="d-flex align-items-center">
              <div className="bg-white bg-opacity-25 p-3 rounded-circle me-3">
                <PlusCircle size={32} className="text-white" />
              </div>
              <div>
                <h2 className="h4 mb-0 text-white fw-bold">Thêm Phòng Ban Mới</h2>
                <p className="text-white text-opacity-75 mb-0 small">Thiết lập đơn vị quản lý mới cho hệ thống</p>
              </div>
            </div>
          </div>

          {/* Form Card */}
          <div className="card-body p-4 p-md-5 bg-white">
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="form-label fw-bold text-secondary small text-uppercase mb-2">Tên Phòng Ban</label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-0">
                    <Building2 size={20} className="text-primary" />
                  </span>
                  <input
                    className="form-control form-control-lg bg-light border-0 shadow-none"
                    value={deptName}
                    onChange={(e) => setDeptName(e.target.value)}
                    placeholder="Ví dụ: Phòng Kinh doanh, Ban Công nghệ..."
                    autoFocus
                    required
                  />
                </div>
              </div>

              {/* Gợi ý */}
              <div className="p-4 bg-info bg-opacity-10 rounded-4 border border-info border-opacity-10 mb-5">
                <div className="d-flex align-items-start gap-3">
                  <Info className="text-info mt-1" size={20} />
                  <div>
                    <h6 className="fw-bold text-info mb-1">Gợi ý quản lý</h6>
                    <p className="text-secondary small mb-0 lh-base">
                      Sau khi tạo phòng ban, bạn có thể vào trang **Chi tiết** hoặc **Chỉnh sửa** để bổ nhiệm nhân viên vào đơn vị mới này.
                    </p>
                  </div>
                </div>
              </div>

              {/* Nút thao tác */}
              <div className="d-flex justify-content-end gap-3 pt-4 border-top">
                <button 
                  type="button" 
                  className="btn btn-light px-4 rounded-pill fw-bold border-0 shadow-none"
                  onClick={() => navigate("/departments")}
                >
                  Hủy bỏ
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary px-5 rounded-pill fw-bold d-flex align-items-center gap-2 shadow-sm"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="spinner-border spinner-border-sm"></div>
                  ) : (
                    <Save size={18} />
                  )}
                  Lưu phòng ban
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
