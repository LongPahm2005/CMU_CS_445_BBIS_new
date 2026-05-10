from flask import Blueprint, jsonify, request
from config import get_human_connection, get_mysql_connection

attendance_bp = Blueprint("attendance", __name__)

@attendance_bp.get("/api/attendances")
def get_attendances():
    try:
        hrm_conn = get_human_connection()
        payroll_conn = get_mysql_connection()
        hrm_cursor = hrm_conn.cursor()
        payroll_cursor = payroll_conn.cursor(dictionary=True)

        # Mặc định lấy tháng 09/2024 nếu không có tham số truyền vào
        month = request.args.get("month", "2024-09")

        hrm_cursor.execute("""
            SELECT e.EmployeeID, e.FullName, d.DepartmentName
            FROM employees e
            LEFT JOIN departments d ON e.DepartmentID = d.DepartmentID
        """)
        employee_rows = hrm_cursor.fetchall()
        employees_map = {}
        employees = []
        for row in employee_rows:
            emp = {"employeeid": row[0], "fullname": row[1], "departmentname": row[2]}
            employees.append(emp)
            employees_map[row[0]] = emp

        # Sử dụng LIKE để truy vấn chuyên cần đồng bộ với trang Lương
        payroll_cursor.execute("""
            SELECT a.AttendanceID, a.EmployeeID, a.AttendanceMonth, a.WorkDays, a.LeaveDays, a.AbsentDays
            FROM attendance a
            INNER JOIN (
                SELECT EmployeeID, MAX(AttendanceID) AS LatestID
                FROM attendance
                WHERE AttendanceMonth LIKE %s
                GROUP BY EmployeeID
            ) latest ON a.AttendanceID = latest.LatestID
            ORDER BY a.EmployeeID ASC
        """, (f"{month}%",))

        attendance_rows = payroll_cursor.fetchall()
        attendance = []
        total_leave = 0
        total_work = 0

        for row in attendance_rows:
            employee = employees_map.get(row["EmployeeID"], {})
            work_days = int(row["WorkDays"] or 0)
            leave_days = int(row["LeaveDays"] or 0)
            absent_days = int(row["AbsentDays"] or 0)
            total_leave += (leave_days + absent_days)
            total_work += work_days

            attendance.append({
                "attendanceid": row["AttendanceID"],
                "employeeid": row["EmployeeID"],
                "employeename": employee.get("fullname", "Unknown"),
                "departmentname": employee.get("departmentname", "Unknown"),
                "workdays": work_days,
                "leavedays": leave_days,
                "absentdays": absent_days,
                "attendancemonth": row["AttendanceMonth"].strftime("%Y-%m")
            })

        chart_data = [{"name": item["employeename"], "Work days": item["workdays"], "Leave": item["leavedays"], "Absent": item["absentdays"]} for item in attendance]
        
        # Lấy danh sách các tháng có dữ liệu để hiển thị trong bộ lọc
        payroll_cursor.execute("SELECT DISTINCT DATE_FORMAT(AttendanceMonth, '%Y-%m') as m FROM attendance ORDER BY m DESC")
        months = [r['m'] for r in payroll_cursor.fetchall()]
        
        leave_rate = round((total_leave / total_work) * 100, 2) if total_work > 0 else 0

        hrm_cursor.close()
        payroll_cursor.close()
        hrm_conn.close()
        payroll_conn.close()

        return jsonify({
            "success": True,
            "data": {
                "employees": employees,
                "attendance": attendance,
                "months": months,
                "chartData": chart_data,
                "leaveRate": leave_rate
            }
        }), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
