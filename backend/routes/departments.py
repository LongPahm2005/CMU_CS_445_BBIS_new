from flask import Blueprint, jsonify, request
from config import get_human_connection, get_mysql_connection

departments_bp = Blueprint("departments", __name__)

@departments_bp.get("/api/departments")
def list_departments():
    conn = None
    try:
        conn = get_human_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT d.DepartmentID, d.DepartmentName, COUNT(e.EmployeeID) AS TotalEmp,
                   MAX(m.FullName) AS ManagerName
            FROM Departments d
            LEFT JOIN Employees e ON e.DepartmentID = d.DepartmentID
            LEFT JOIN Employees m ON m.DepartmentID = d.DepartmentID AND m.PositionID = 4
            GROUP BY d.DepartmentID, d.DepartmentName
        """)
        rows = cursor.fetchall()
        departments = [
            {
                "id": r[0], 
                "name": r[1], 
                "employee_count": r[2] or 0, 
                "manager": r[3] if r[3] else "Chưa bổ nhiệm"
            } for r in rows
        ]
        return jsonify({"success": True, "data": departments}), 200
    except Exception as e:
        print("DEPARTMENTS ERROR:", str(e))
        return jsonify({"success": False, "data": [], "message": str(e)}), 500
    finally:
        if conn: conn.close()

@departments_bp.delete("/api/departments/<int:dept_id>")
def delete_department(dept_id):
    conn = None
    m_conn = None
    try:
        conn = get_human_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM Departments WHERE DepartmentID = ?", (dept_id,))
        conn.commit()
        
        # Sync delete to payroll DB (MySQL)
        try:
            m_conn = get_mysql_connection()
            m_cur = m_conn.cursor()
            m_cur.execute("DELETE FROM departments_payroll WHERE DepartmentID = %s", (dept_id,))
            m_conn.commit()
        except Exception as sync_err:
            print(f"SYNC DELETE ERROR: {sync_err}")
            
        return jsonify({"success": True, "message": "Xóa phòng ban thành công"}), 200
    except Exception as e:
        print(f"DELETE DEPARTMENT ERROR: {e}")
        return jsonify({"success": False, "message": "Không thể xóa phòng ban"}), 500
    finally:
        if conn: conn.close()
        if m_conn: m_conn.close()

@departments_bp.put("/api/departments/<int:dept_id>")
def update_department(dept_id):
    conn = None
    m_conn = None
    try:
        data = request.get_json()
        new_name = data.get("name")
        if not new_name:
            return jsonify({"success": False, "message": "Tên phòng ban không được trống"}), 400
            
        conn = get_human_connection()
        cursor = conn.cursor()
        cursor.execute("UPDATE Departments SET DepartmentName = ? WHERE DepartmentID = ?", (new_name, dept_id))
        conn.commit()
        
        # Sync update to MySQL payroll DB
        try:
            m_conn = get_mysql_connection()
            m_cur = m_conn.cursor()
            # Note: Screen 2 shows only DepartmentID, DepartmentName, SyncedAt
            m_cur.execute("UPDATE departments_payroll SET DepartmentName = %s, SyncedAt = NOW() WHERE DepartmentID = %s", (new_name, dept_id))
            m_conn.commit()
        except Exception as sync_err:
            print(f"SYNC UPDATE ERROR: {sync_err}")
            
        return jsonify({"success": True, "message": "Cập nhật thành công"}), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        if conn: conn.close()
        if m_conn: m_conn.close()

@departments_bp.get("/api/departments/<int:dept_id>/employees")
def get_department_employees(dept_id):
    conn = None
    try:
        conn = get_human_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT EmployeeID, FullName FROM Employees WHERE DepartmentID = ?", (dept_id,))
        rows = cursor.fetchall()
        employees = [{"id": r[0], "name": r[1]} for r in rows]
        return jsonify({"success": True, "data": employees}), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        if conn: conn.close()

@departments_bp.post("/api/departments/<int:dept_id>/add-employee")
def add_employee_to_department(dept_id):
    conn = None
    try:
        data = request.get_json()
        emp_name = data.get("name")
        if not emp_name:
            return jsonify({"success": False, "message": "Tên nhân viên không được trống"}), 400
        conn = get_human_connection()
        cursor = conn.cursor()
        cursor.execute("INSERT INTO Employees (FullName, DepartmentID) VALUES (?, ?)", (emp_name, dept_id))
        conn.commit()
        return jsonify({"success": True, "message": "Thêm nhân viên thành công"}), 201
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        if conn: conn.close()

@departments_bp.get("/api/departments_employees")
def get_departments_employees():
    conn = get_mysql_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT DepartmentID as departmentid, DepartmentName as departmentname FROM departments_payroll")
    data = cursor.fetchall()
    conn.close()
    return jsonify(data)
@departments_bp.get("/api/departments/<int:id>/detail")
def get_department_detail(id):
    conn = None
    try:
        conn = get_human_connection()
        cursor = conn.cursor()
        
        # 1. Lấy thông tin phòng ban
        cursor.execute("SELECT DepartmentID, DepartmentName FROM Departments WHERE DepartmentID = ?", (id,))
        dept_row = cursor.fetchone()
        if not dept_row:
            return jsonify({"success": False, "message": "Không tìm thấy phòng ban"}), 404
            
        # 2. Lấy danh sách nhân viên thuộc phòng ban
        cursor.execute("""
            SELECT e.EmployeeID, e.FullName, p.PositionName, e.Email, e.Status
            FROM Employees e
            LEFT JOIN Positions p ON e.PositionID = p.PositionID
            WHERE e.DepartmentID = ?
        """, (id,))
        emp_rows = cursor.fetchall()
        employees = [{
            "id": r[0], "name": r[1], "position": r[2] or "Chưa rõ", "email": r[3], "status": r[4]
        } for r in emp_rows]
        
        return jsonify({
            "success": True,
            "data": {
                "id": dept_row[0],
                "name": dept_row[1],
                "employees": employees,
                "total": len(employees),
                "manager": "Chưa bổ nhiệm" # Sau này có thể thêm logic lấy manager
            }
        })
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        if conn: conn.close()
@departments_bp.post("/api/departments")
def add_department():
    conn = None
    m_conn = None
    try:
        data = request.get_json()
        name = data.get("name")
        if not name:
            return jsonify({"success": False, "message": "Tên phòng ban là bắt buộc"}), 400
            
        conn = get_human_connection()
        cursor = conn.cursor()
        cursor.execute("INSERT INTO Departments (DepartmentName, CreatedAt, UpdatedAt) VALUES (?, GETDATE(), GETDATE())", (name,))
        conn.commit()
        
        # Retrieve newly inserted DepartmentID using SCOPE_IDENTITY for SQL Server
        cursor.execute("SELECT @@IDENTITY")
        new_id_row = cursor.fetchone()
        new_id = int(new_id_row[0]) if new_id_row and new_id_row[0] else None
        
        if not new_id:
             # Fallback to MAX if @@IDENTITY fails
             cursor.execute("SELECT MAX(DepartmentID) FROM Departments")
             new_id = cursor.fetchone()[0]

        # Sync to MySQL payroll DB
        try:
            m_conn = get_mysql_connection()
            m_cur = m_conn.cursor()
            # MySQL table columns: DepartmentID, DepartmentName, SyncedAt
            m_cur.execute("INSERT INTO departments_payroll (DepartmentID, DepartmentName, SyncedAt) VALUES (%s, %s, NOW())", (new_id, name))
            m_conn.commit()
        except Exception as sync_err:
            print(f"SYNC ADD ERROR: {sync_err}")
        
        return jsonify({"success": True, "message": "Thêm phòng ban thành công", "id": new_id}), 201
    except Exception as e:
        print(f"ADD DEPARTMENT ERROR: {e}")
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        if conn: conn.close()
        if m_conn: m_conn.close()
