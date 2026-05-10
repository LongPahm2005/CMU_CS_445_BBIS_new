from flask import Blueprint, jsonify, request
from datetime import datetime
from config import get_human_connection, get_mysql_connection

reports_bp = Blueprint("reports", __name__)

@reports_bp.get("/api/reports/general-overview")
def general_overview():
    try:
        hrm_conn = get_human_connection()
        payroll_conn = get_mysql_connection()
        hrm_cursor = hrm_conn.cursor()
        payroll_cursor = payroll_conn.cursor(dictionary=True)

        # Mặc định lấy tháng 09/2024
        month = request.args.get("month", "2024-09")

        hrm_cursor.execute("""
            SELECT e.EmployeeID, e.FullName, e.Status, d.DepartmentName
            FROM employees e
            LEFT JOIN departments d ON e.DepartmentID = d.DepartmentID
        """)
        employee_rows = hrm_cursor.fetchall()
        total_employees = len(employee_rows)
        active_employees = 0
        workforce_map = {}

        for row in employee_rows:
            status = (row[2] or "").strip().lower()
            if status in ["đang làm việc", "thử việc", "thực tập"]:
                active_employees += 1
            dept_name = row[3] or "Unknown"
            workforce_map.setdefault(dept_name, 0)
            workforce_map[dept_name] += 1

        # Lấy lương theo tháng và khử trùng lặp
        payroll_cursor.execute("""
            SELECT s.EmployeeID, s.NetSalary, dp.DepartmentName
            FROM salaries s
            INNER JOIN (
                SELECT EmployeeID, MAX(SalaryID) AS LatestID
                FROM salaries
                WHERE SalaryMonth LIKE %s
                GROUP BY EmployeeID
            ) latest ON s.SalaryID = latest.LatestID
            LEFT JOIN employees_payroll ep ON s.EmployeeID = ep.EmployeeID
            LEFT JOIN departments_payroll dp ON ep.DepartmentID = dp.DepartmentID
        """, (f"{month}%",))
        salary_rows = payroll_cursor.fetchall()
        total_payroll = 0
        salary_map = {}
        for row in salary_rows:
            salary = float(row["NetSalary"] or 0)
            dept = row["DepartmentName"] or "Unknown"
            total_payroll += salary
            salary_map.setdefault(dept, 0)
            salary_map[dept] += salary

        # Lấy chuyên cần theo tháng và khử trùng lặp
        payroll_cursor.execute("""
            SELECT COALESCE(SUM(latest.LeaveDays + latest.AbsentDays), 0) AS totalLeave
            FROM (
                SELECT a.EmployeeID, a.LeaveDays, a.AbsentDays
                FROM attendance a
                INNER JOIN (
                    SELECT EmployeeID, MAX(AttendanceID) AS LatestID
                    FROM attendance
                    WHERE AttendanceMonth LIKE %s
                    GROUP BY EmployeeID
                ) x ON a.AttendanceID = x.LatestID
            ) latest
        """, (f"{month}%",))
        leave_row = payroll_cursor.fetchone()
        total_leave = int(leave_row["totalLeave"] or 0)

        workforce_by_dept = []
        for dept, count in workforce_map.items():
            percentage = round((count / total_employees) * 100, 1) if total_employees else 0
            workforce_by_dept.append({"name": dept, "value": count, "percentage": percentage})

        salary_expenditure = [{"name": dept, "salary": total} for dept, total in salary_map.items()]

        hrm_cursor.close()
        payroll_cursor.close()
        hrm_conn.close()
        payroll_conn.close()

        return jsonify({
            "stats": {
                "activeEmployees": active_employees,
                "activeEmployeesDetail": "Active staff across all departments",
                "totalPayroll": total_payroll,
                "payrollDetail": f"In {month}",
                "totalLeaveDays": total_leave,
                "leaveDaysDetail": "Paid leave & unpaid absences"
            },
            "workforceByDept": workforce_by_dept,
            "salaryExpenditure": salary_expenditure
        }), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@reports_bp.get("/api/reports/dividends-summary")
def dividends_summary():
    try:
        payroll_conn = get_mysql_connection()
        payroll_cursor = payroll_conn.cursor(dictionary=True)
        month = request.args.get("month", "2024-09")

        payroll_cursor.execute("""
            SELECT s.EmployeeID, ep.FullName, dp.DepartmentName, s.BaseSalary, s.Bonus
            FROM salaries s
            INNER JOIN (
                SELECT EmployeeID, MAX(SalaryID) AS LatestID
                FROM salaries
                WHERE SalaryMonth LIKE %s
                GROUP BY EmployeeID
            ) latest ON s.SalaryID = latest.LatestID
            LEFT JOIN employees_payroll ep ON s.EmployeeID = ep.EmployeeID
            LEFT JOIN departments_payroll dp ON ep.DepartmentID = dp.DepartmentID
            ORDER BY s.Bonus DESC
        """, (f"{month}%",))
        rows = payroll_cursor.fetchall()
        total_dividends = 0
        bonus_by_dept_map = {}
        employee_breakdown = []

        for row in rows:
            bonus = float(row["Bonus"] or 0)
            base_salary = float(row["BaseSalary"] or 0)
            dept = row["DepartmentName"] or "Unknown"
            total_dividends += bonus
            bonus_by_dept_map.setdefault(dept, 0)
            bonus_by_dept_map[dept] += bonus
            rate = round((bonus / base_salary) * 100, 2) if base_salary else 0
            employee_breakdown.append({
                "employeeId": row["EmployeeID"],
                "fullName": row["FullName"],
                "department": dept,
                "baseSalary": base_salary,
                "dividend": bonus,
                "rate": rate
            })

        bonus_by_dept = [{"name": dept, "amount": amount} for dept, amount in bonus_by_dept_map.items()]
        bonus_distribution = [{"name": dept, "value": round((amount / total_dividends) * 100, 1) if total_dividends else 0} for dept, amount in bonus_by_dept_map.items()]

        payroll_cursor.close()
        payroll_conn.close()

        return jsonify({
            "totalDividends": total_dividends,
            "totalDividendsDetail": f"Report for {month}",
            "bonusByDept": bonus_by_dept,
            "bonusDistribution": bonus_distribution,
            "employeeDividendBreakdown": employee_breakdown
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@reports_bp.get("/api/reports/payroll-analysis")
def payroll_analysis():
    try:
        payroll_conn = get_mysql_connection()
        payroll_cursor = payroll_conn.cursor(dictionary=True)
        month = request.args.get("month", "2024-09")

        # Khử trùng lặp bản ghi lương khi phân tích
        payroll_cursor.execute("""
            SELECT s.EmployeeID, s.NetSalary, dp.DepartmentName
            FROM salaries s
            INNER JOIN (
                SELECT EmployeeID, MAX(SalaryID) AS LatestID
                FROM salaries
                WHERE SalaryMonth LIKE %s
                GROUP BY EmployeeID
            ) latest ON s.SalaryID = latest.LatestID
            LEFT JOIN employees_payroll ep ON s.EmployeeID = ep.EmployeeID
            LEFT JOIN departments_payroll dp ON ep.DepartmentID = dp.DepartmentID
        """, (f"{month}%",))
        rows = payroll_cursor.fetchall()
        salaries = [float(r["NetSalary"] or 0) for r in rows]
        total_salary = sum(salaries)
        avg_salary = (total_salary / len(salaries)) if salaries else 0
        dept_map = {}
        for row in rows:
            dept = row["DepartmentName"] or "Unknown"
            dept_map.setdefault(dept, [])
            dept_map[dept].append(float(row["NetSalary"] or 0))

        by_department = [{"DepartmentName": dept, "employeeCount": len(values), "totalSalary": sum(values), "averageSalary": sum(values) / len(values)} for dept, values in dept_map.items()]

        payroll_cursor.close()
        payroll_conn.close()

        return jsonify({
            "month": month,
            "summary": {
                "employeeCount": len(salaries),
                "totalSalary": total_salary,
                "averageSalary": avg_salary,
                "minSalary": min(salaries) if salaries else 0,
                "maxSalary": max(salaries) if salaries else 0
            },
            "byDepartment": by_department
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
