from flask import Blueprint, jsonify, request
from datetime import datetime
from config import get_mysql_connection

payroll_bp = Blueprint("payroll", __name__)

# 1. GET /api/payroll/employees - Truy vấn toàn bộ dữ liệu hiện có trong DB
@payroll_bp.get("/api/payroll/employees")
def get_payroll_employees():
    month = request.args.get("month", datetime.now().strftime("%Y-%m"))
    # month sẽ có dạng "2024-09"
    
    try:
        conn_mysql = get_mysql_connection()
        cursor = conn_mysql.cursor(dictionary=True)
        
        # Sử dụng LIKE 'YYYY-MM%' để tìm chính xác và ổn định nhất
        query = """
            SELECT e.EmployeeID as employeeId, e.FullName as fullName, e.Status as status,
                   a.WorkDays as workDays, a.AbsentDays as absentDays, a.LeaveDays as leaveDays,
                   s.SalaryID as salaryId, s.BaseSalary as baseSalary, s.Bonus as bonus, s.Deductions as deductions, s.NetSalary as netSalary
            FROM employees_payroll e
            LEFT JOIN (
                SELECT a1.EmployeeID, a1.WorkDays, a1.AbsentDays, a1.LeaveDays
                FROM attendance a1
                INNER JOIN (
                    SELECT MAX(AttendanceID) as AttendanceID
                    FROM attendance 
                    WHERE AttendanceMonth LIKE %s
                    GROUP BY EmployeeID
                ) latest_a ON a1.AttendanceID = latest_a.AttendanceID
            ) a ON e.EmployeeID = a.EmployeeID
            LEFT JOIN (
                SELECT s1.SalaryID, s1.EmployeeID, s1.BaseSalary, s1.Bonus, s1.Deductions, s1.NetSalary
                FROM salaries s1
                INNER JOIN (
                    SELECT MAX(SalaryID) as SalaryID 
                    FROM salaries 
                    WHERE SalaryMonth LIKE %s
                    GROUP BY EmployeeID
                ) latest_s ON s1.SalaryID = latest_s.SalaryID
            ) s ON e.EmployeeID = s.EmployeeID
        """
        pattern = f"{month}%"
        cursor.execute(query, (pattern, pattern))
        employees = cursor.fetchall()
        
        # Khử trùng - chỉ giữ record mới nhất per employee (SalaryID cao nhất)
        seen = {}
        for emp in employees:
            emp_id = emp['employeeId']
            current_salary_id = emp['salaryId'] or 0
            
            if emp_id not in seen:
                seen[emp_id] = emp
            else:
                # So sánh SalaryID - giữ cái mới nhất
                prev_salary_id = seen[emp_id]['salaryId'] or 0
                if current_salary_id > prev_salary_id:
                    seen[emp_id] = emp
        
        unique_employees = list(seen.values())
        
        response = jsonify({"success": True, "data": unique_employees})
        response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate, max-age=0'
        response.headers['Pragma'] = 'no-cache'
        response.headers['Expires'] = '0'
        return response, 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        if conn_mysql: conn_mysql.close()

# 2. GET /api/payroll/salaries - Lấy danh sách bảng lương thuần túy (đã khử trùng)
@payroll_bp.get("/api/payroll/salaries")
def get_salaries():
    month = request.args.get("month", datetime.now().strftime("%Y-%m"))
    
    try:
        conn_mysql = get_mysql_connection()
        cursor = conn_mysql.cursor(dictionary=True)
        
        query = """
            SELECT s.SalaryID as salaryId, s.EmployeeID as employeeId, e.FullName as employeeName,
                   s.SalaryMonth as salaryMonth, s.BaseSalary as baseSalary, s.Bonus as bonus,
                   s.Deductions as deductions, s.NetSalary as netSalary
            FROM salaries s
            LEFT JOIN employees_payroll e ON s.EmployeeID = e.EmployeeID
            INNER JOIN (
                SELECT MAX(SalaryID) as SalaryID 
                FROM salaries 
                WHERE SalaryMonth LIKE %s
                GROUP BY EmployeeID
            ) latest ON s.SalaryID = latest.SalaryID
        """
        pattern = f"{month}%"
        cursor.execute(query, (pattern,))
        salaries = cursor.fetchall()
        
        return jsonify({"success": True, "data": salaries}), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        if conn_mysql: conn_mysql.close()
