from flask import Blueprint, jsonify, request
from datetime import datetime
from config import get_human_connection, get_mysql_connection

dashboard_bp = Blueprint("dashboard", __name__)

@dashboard_bp.get("/api/dashboard")
def get_dashboard():
    token = request.headers.get("Authorization")
    if token != "demo-token":
        return jsonify({"success": False, "message": "Unauthorized"}), 401

    try:
        hrm_conn = get_human_connection()
        payroll_conn = get_mysql_connection()
        hrm_cursor = hrm_conn.cursor()
        payroll_cursor = payroll_conn.cursor(dictionary=True)

        month = int(request.args.get("month", 9))
        year = int(request.args.get("year", 2024))
        now = datetime(year, month, 1)

        start_date = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        if month == 12:
            end_date = now.replace(year=year + 1, month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
        else:
            end_date = now.replace(month=month + 1, day=1, hour=0, minute=0, second=0, microsecond=0)

        hrm_cursor.execute("SELECT EmployeeID, FullName, Status, DepartmentID FROM employees")
        employee_rows = hrm_cursor.fetchall()
        employees = [{"EmployeeID": r[0], "FullName": r[1], "Status": r[2], "DepartmentID": r[3]} for r in employee_rows]

        hrm_cursor.execute("SELECT DepartmentID, DepartmentName FROM departments")
        department_rows = hrm_cursor.fetchall()
        departments = [{"DepartmentID": r[0], "DepartmentName": r[1]} for r in department_rows]

        active_employees = sum(1 for emp in employees if emp["Status"].strip().lower() in ["đang làm việc", "thử việc", "thực tập"])

        hrm_cursor.execute("""
            SELECT d.DepartmentName, COUNT(e.EmployeeID)
            FROM departments d
            LEFT JOIN employees e ON d.DepartmentID = e.DepartmentID
            GROUP BY d.DepartmentID, d.DepartmentName
            ORDER BY d.DepartmentName
        """)
        dept_data = [{"name": row[0], "count": row[1]} for row in hrm_cursor.fetchall()]

        hrm_cursor.execute("SELECT Status, COUNT(*) FROM employees GROUP BY Status ORDER BY COUNT(*) DESC")
        status_data = [{"name": row[0], "value": row[1]} for row in hrm_cursor.fetchall()]

        payroll_cursor.execute("""
            SELECT COALESCE(SUM(s.NetSalary), 0) AS totalSalary
            FROM salaries s
            INNER JOIN (
                SELECT MAX(SalaryID) as SalaryID 
                FROM salaries 
                WHERE SalaryMonth LIKE %s
                GROUP BY EmployeeID
            ) latest ON s.SalaryID = latest.SalaryID
        """, (f"{year}-{month:02d}%",))
        salary_result = payroll_cursor.fetchone()
        total_salary = float(salary_result["totalSalary"] if salary_result else 0)

        payroll_cursor.execute("""
            SELECT COALESCE(SUM(a.LeaveDays + a.AbsentDays), 0) AS totalLeave
            FROM attendance a
            INNER JOIN (
                SELECT EmployeeID, AttendanceMonth, MAX(AttendanceID) AS LatestID
                FROM attendance
                GROUP BY EmployeeID, AttendanceMonth
            ) latest ON a.AttendanceID = latest.LatestID
            WHERE a.AttendanceMonth >= %s AND a.AttendanceMonth < %s
        """, (start_date, end_date))
        leave_result = payroll_cursor.fetchone()
        total_leave = int(leave_result["totalLeave"] if leave_result else 0)

        payroll_cursor.execute("""
            SELECT dp.DepartmentName AS name, COALESCE(SUM(s.NetSalary), 0) AS total
            FROM departments_payroll dp
            LEFT JOIN employees_payroll ep ON dp.DepartmentID = ep.DepartmentID
            LEFT JOIN (
                SELECT s1.* FROM salaries s1
                INNER JOIN (
                    SELECT EmployeeID, SalaryMonth, MAX(SalaryID) AS LatestID
                    FROM salaries
                    GROUP BY EmployeeID, SalaryMonth
                ) latest ON s1.SalaryID = latest.LatestID
            ) s ON ep.EmployeeID = s.EmployeeID AND s.SalaryMonth >= %s AND s.SalaryMonth < %s
            GROUP BY dp.DepartmentID, dp.DepartmentName
            ORDER BY total DESC
        """, (start_date, end_date))
        salary_by_dept = payroll_cursor.fetchall()

        hrm_cursor.close()
        payroll_cursor.close()
        hrm_conn.close()
        payroll_conn.close()

        return jsonify({
            "success": True,
            "data": {
                "summary": {
                    "totalEmployees": len(employees),
                    "activeEmployees": active_employees,
                    "totalDepartments": len(departments),
                    "totalSalary": total_salary,
                    "totalLeave": total_leave
                },
                "employees": employees,
                "departments": departments,
                "deptData": dept_data,
                "statusData": status_data,
                "salaryByDept": salary_by_dept,
                "filter": {"month": month, "year": year}
            }
        }), 200
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"success": False, "message": str(e)}), 500

@dashboard_bp.route("/api/dashboard_stats", methods=["GET"])
def get_dashboard_stats():
    # Note: Renamed from get_dashboard_stats to avoid conflict if registered on same route
    # Original route was /api/dashboard, changing to /api/dashboard_stats if needed
    # But for now I'll keep the logic and maybe rename the endpoint if it's redundant.
    # Actually, let's keep it as is but I suspect get_dashboard is the one used by frontend.
    conn = None
    try:
        conn = get_mysql_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT COUNT(*) as total FROM employees_payroll")
        total_employees = cursor.fetchone()['total']
        cursor.execute("SELECT COUNT(*) as total FROM departments_payroll")
        total_depts = cursor.fetchone()['total']
        cursor.execute("SELECT SUM(NetSalary) as total_payroll FROM salaries")
        total_payroll = cursor.fetchone()['total_payroll'] or 0

        return jsonify({
            "success": True,
            "totalEmployees": total_employees,
            "totalDepartments": total_depts,
            "totalPayroll": float(total_payroll)
        })
    except Exception as e:
        print(f"DASHBOARD ERROR: {str(e)}")
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        if conn: conn.close()
