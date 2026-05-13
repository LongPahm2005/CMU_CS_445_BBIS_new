from flask import Blueprint, jsonify, request
from datetime import datetime
from config import get_human_connection, get_mysql_connection

employees_bp = Blueprint("employees", __name__)

@employees_bp.get("/api/employees")
def get_employees():
    conn = None
    try:
        conn = get_human_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT e.EmployeeID, e.FullName, e.Gender, e.PhoneNumber, e.Email, e.DepartmentID, e.PositionID, e.Status, d.DepartmentName, p.PositionName
            FROM Employees e
            LEFT JOIN Departments d ON e.DepartmentID = d.DepartmentID
            LEFT JOIN Positions p ON e.PositionID = p.PositionID
            ORDER BY e.EmployeeID ASC
        """)
        rows = cursor.fetchall()
        employees = [{
            "employeeid": row[0], "fullname": row[1], "gender": row[2], "phonenumber": row[3], "email": row[4],
            "departmentid": row[5], "positionid": row[6], "status": row[7],
            "departmentname": (row[8].strip() if row[8] else "") or "Chưa xếp phòng",
            "positionname": (row[9].strip() if row[9] else "") or "Chưa có chức vụ"
        } for row in rows]
        return jsonify(employees), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        if conn: conn.close()

@employees_bp.get("/api/employees/<int:id>")
def get_employee_detail(id):
    conn = None
    try:
        conn = get_human_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT e.EmployeeID, e.FullName, e.Gender, e.PhoneNumber, e.Email, e.DepartmentID, e.PositionID, e.Status
            FROM Employees e
            WHERE e.EmployeeID = ?
        """, (id,))
        row = cursor.fetchone()
        if not row:
            return jsonify({"success": False, "message": "Không tìm thấy nhân viên"}), 404
            
        employee = {
            "employeeid": row[0], "fullname": row[1], "gender": row[2], "phonenumber": row[3], 
            "email": row[4], "departmentid": row[5], "positionid": row[6], "status": row[7]
        }
        return jsonify({"success": True, "data": employee}), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        if conn: conn.close()

@employees_bp.route("/api/employees/<int:id>", methods=["PUT"])
def update_employee(id):
    data = request.get_json()
    fullname = data.get("fullname")
    gender = data.get("gender")
    phone = data.get("phonenumber")
    email = data.get("email")
    dept_id = data.get("departmentid")
    pos_id = data.get("positionid")
    status = data.get("status")

    conn_sql = None
    conn_mysql = None
    try:
        # 1. Update HRM (SQL Server)
        conn_sql = get_human_connection()
        cursor_sql = conn_sql.cursor()
        cursor_sql.execute("""
            UPDATE Employees
            SET FullName=?, Gender=?, PhoneNumber=?, Email=?, DepartmentID=?, PositionID=?, Status=?, UpdatedAt=GETDATE()
            WHERE EmployeeID=?
        """, (fullname, gender, phone, email, dept_id, pos_id, status, id))
        conn_sql.commit()

        # 2. Update Payroll (MySQL)
        conn_mysql = get_mysql_connection()
        cursor_mysql = conn_mysql.cursor()
        cursor_mysql.execute("""
            UPDATE employees_payroll
            SET FullName=%s, DepartmentID=%s, PositionID=%s, Status=%s, SyncedAt=NOW()
            WHERE EmployeeID=%s
        """, (fullname, dept_id, pos_id, status, id))
        conn_mysql.commit()
        
        return jsonify({"success": True, "message": "Cập nhật thành công!"})
    except Exception as e:
        if conn_sql: conn_sql.rollback()
        if conn_mysql: conn_mysql.rollback()
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        if conn_sql: conn_sql.close()
        if conn_mysql: conn_mysql.close()

@employees_bp.delete("/api/employees/<int:id>")
def delete_employee(id):
    conn_sql = None
    conn_mysql = None
    try:
        conn_sql = get_human_connection()
        cursor_sql = conn_sql.cursor()
        cursor_sql.execute("DELETE FROM Employees WHERE EmployeeID=?", (id,))
        conn_sql.commit()

        conn_mysql = get_mysql_connection()
        cursor_mysql = conn_mysql.cursor()
        cursor_mysql.execute("DELETE FROM employees_payroll WHERE EmployeeID=%s", (id,))
        conn_mysql.commit()

        return jsonify({"success": True, "message": "Xóa thành công!"})
    except Exception as e:
        if conn_sql: conn_sql.rollback()
        if conn_mysql: conn_mysql.rollback()
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        if conn_sql: conn_sql.close()
        if conn_mysql: conn_mysql.close()
@employees_bp.route("/api/employees", methods=["POST"])
def add_employee():
    data = request.get_json()
    fullname = data.get("fullname")
    gender = data.get("gender", "Male")
    phone = data.get("phonenumber")
    email = data.get("email")
    dept_id = data.get("departmentid")
    pos_id = data.get("positionid")
    status = data.get("status", "Working")
    dob = data.get("dateofbirth")
    hire_date = data.get("hiredate")

    conn_sql = None
    conn_mysql = None
    try:
        # 1. Tính toán ID tiếp theo (MAX + 1)
        conn_sql = get_human_connection()
        cursor_sql = conn_sql.cursor()
        cursor_sql.execute("SELECT MAX(EmployeeID) FROM Employees")
        max_id = cursor_sql.fetchone()[0]
        new_id = (int(max_id) + 1) if max_id is not None else 1

        # 2. Thêm vào HRM (SQL Server)
        try:
            cursor_sql.execute("SET IDENTITY_INSERT Employees ON")
            cursor_sql.execute("""
                INSERT INTO Employees (EmployeeID, FullName, Gender, PhoneNumber, Email, DepartmentID, PositionID, Status, DateOfBirth, HireDate, CreatedAt, UpdatedAt)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, GETDATE(), GETDATE())
            """, (new_id, fullname, gender, phone, email, dept_id, pos_id, status, dob, hire_date))
            cursor_sql.execute("SET IDENTITY_INSERT Employees OFF")
        except:
            cursor_sql.execute("""
                INSERT INTO Employees (EmployeeID, FullName, Gender, PhoneNumber, Email, DepartmentID, PositionID, Status, DateOfBirth, HireDate, CreatedAt, UpdatedAt)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, GETDATE(), GETDATE())
            """, (new_id, fullname, gender, phone, email, dept_id, pos_id, status, dob, hire_date))
        conn_sql.commit()

        # 3. Thêm vào Payroll (MySQL)
        conn_mysql = get_mysql_connection()
        cursor_mysql = conn_mysql.cursor()
        cursor_mysql.execute("""
            INSERT INTO employees_payroll (EmployeeID, FullName, DepartmentID, PositionID, Status, SyncedAt)
            VALUES (%s, %s, %s, %s, %s, NOW())
        """, (new_id, fullname, dept_id, pos_id, status))
        conn_mysql.commit()

        return jsonify({"success": True, "message": "Thêm nhân viên thành công!", "employeeid": new_id}), 201
    except Exception as e:
        if conn_sql: conn_sql.rollback()
        print("ADD EMPLOYEE ERROR:", str(e))
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        if conn_sql: conn_sql.close()

