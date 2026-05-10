from flask import Blueprint, jsonify, request
from datetime import datetime, timedelta
from enum import Enum
from config import get_human_connection, get_mysql_connection

alerts_bp = Blueprint("alerts", __name__)

class AlertType(Enum):
    EXCESSIVE_LEAVE = "excessive_leave"
    ABNORMAL_SALARY = "abnormal_salary"
    ANNIVERSARY = "anniversary"
    BIRTHDAY = "birthday"
    UPCOMING_ANNIVERSARY = "upcoming_anniversary"
    UPCOMING_BIRTHDAY = "upcoming_birthday"
    DEPARTMENT = "department"
    WELCOME = "welcome"

class AlertSeverity(Enum):
    INFO = "info"
    WARNING = "warning"

@alerts_bp.get("/api/alerts")
def get_alerts():
    try:
        hrm_conn = get_human_connection()
        payroll_conn = get_mysql_connection()
        hrm_cur = hrm_conn.cursor()
        payroll_cur = payroll_conn.cursor(dictionary=True)

        alert_type_filter = request.args.get("type", "all")
        severity_filter = request.args.get("severity", "all")
        search_query = request.args.get("search", "").lower()

        all_alerts = []
        now = datetime.now()

        # 1. Abnormal Salary (> 20M OR tăng > 30% so với tháng trước)
        payroll_cur.execute("""
            SELECT s.SalaryID, s.EmployeeID, s.NetSalary, e.FullName, s.SalaryMonth
            FROM salaries s
            JOIN employees_payroll e ON s.EmployeeID = e.EmployeeID
            WHERE s.NetSalary > 20000000
        """)
        for row in payroll_cur.fetchall():
            salary_month = row['SalaryMonth']
            created_at = salary_month.isoformat() if hasattr(salary_month, 'isoformat') else str(salary_month)
            all_alerts.append({
                "id": f"SAL_{row['SalaryID']}",
                "displayId": f"SAL{row['SalaryID']:03d}",
                "type": AlertType.ABNORMAL_SALARY.value,
                "severity": AlertSeverity.WARNING.value,
                "employeeId": row['EmployeeID'],
                "employeeName": row['FullName'],
                "title": "Abnormal Salary Alert",
                "description": f"High salary detected: {row['NetSalary']:,.0f} VND for {row['FullName']}",
                "createdAt": created_at
            })

        # 2. Excessive Leave (> 3 days in a month)
        payroll_cur.execute("""
            SELECT a.AttendanceID, a.EmployeeID, a.LeaveDays, a.AbsentDays, e.FullName, a.AttendanceMonth
            FROM attendance a
            JOIN employees_payroll e ON a.EmployeeID = e.EmployeeID
            WHERE (a.LeaveDays + a.AbsentDays) > 3
        """)
        for row in payroll_cur.fetchall():
            att_month = row['AttendanceMonth']
            created_at = att_month.isoformat() if hasattr(att_month, 'isoformat') else str(att_month)
            month_label = att_month.strftime('%B %Y') if hasattr(att_month, 'strftime') else str(att_month)
            all_alerts.append({
                "id": f"LEV_{row['AttendanceID']}",
                "displayId": f"LEV{row['AttendanceID']:03d}",
                "type": AlertType.EXCESSIVE_LEAVE.value,
                "severity": AlertSeverity.WARNING.value,
                "employeeId": row['EmployeeID'],
                "employeeName": row['FullName'],
                "title": "Excessive Leave Alert",
                "description": f"{row['FullName']} had {row['LeaveDays'] + row['AbsentDays']} days off in {month_label}",
                "createdAt": created_at
            })

        # Fetch all employees once for birthday/anniversary checks
        hrm_cur.execute("SELECT EmployeeID, FullName, DateOfBirth, HireDate, DepartmentID FROM employees")
        all_employees = hrm_cur.fetchall()

        # 3. Birthdays (this month)
        for row in all_employees:
            dob = row[2]
            if dob and dob.month == now.month:
                is_today = dob.day == now.day
                label = "today" if is_today else f"on {dob.day:02d}/{now.month:02d}"
                title = "🎂 Happy Birthday!" if is_today else f"🎂 Birthday This Month"
                all_alerts.append({
                    "id": f"BTH_{row[0]}_{now.strftime('%Y%m')}{dob.day:02d}",
                    "displayId": f"BTH{row[0]:03d}",
                    "type": AlertType.BIRTHDAY.value,
                    "severity": AlertSeverity.INFO.value,
                    "employeeId": row[0],
                    "employeeName": row[1],
                    "title": title,
                    "description": f"{row[1]}'s birthday is {label} ({dob.strftime('%d %B')}). Don't forget to send wishes!",
                    "createdAt": now.isoformat()
                })

        # 4. Work Anniversaries (this month)
        for row in all_employees:
            hire = row[3]
            if hire and hire.month == now.month:
                years = now.year - hire.year
                if years > 0:
                    is_today = hire.day == now.day
                    label = "today" if is_today else f"on {hire.day:02d}/{now.month:02d}"
                    all_alerts.append({
                        "id": f"ANV_{row[0]}_{now.strftime('%Y%m')}{hire.day:02d}",
                        "displayId": f"ANV{row[0]:03d}",
                        "type": AlertType.ANNIVERSARY.value,
                        "severity": AlertSeverity.INFO.value,
                        "employeeId": row[0],
                        "employeeName": row[1],
                        "title": "🏆 Work Anniversary",
                        "description": f"Congratulations to {row[1]} for {years} year(s) with the company! ({label})",
                        "createdAt": now.isoformat()
                    })

        # 5. Upcoming Birthdays (Next 30 days, skip this month already shown)
        seen_ubt = set()
        for i in range(1, 31):
            future = now + timedelta(days=i)
            if future.month == now.month:
                continue
            for row in all_employees:
                dob = row[2]
                if dob and dob.month == future.month and dob.day == future.day:
                    uid = f"UBT_{row[0]}_{future.strftime('%Y%m%d')}"
                    if uid not in seen_ubt:
                        seen_ubt.add(uid)
                        all_alerts.append({
                            "id": uid,
                            "displayId": f"UBT{row[0]:03d}",
                            "type": AlertType.UPCOMING_BIRTHDAY.value,
                            "severity": AlertSeverity.INFO.value,
                            "employeeId": row[0],
                            "employeeName": row[1],
                            "title": "⏰ Upcoming Birthday",
                            "description": f"{row[1]}'s birthday is on {future.strftime('%d %B')} ({i} days away)",
                            "createdAt": now.isoformat()
                        })

        # 6. Upcoming Anniversaries (Next 30 days, skip this month already shown)
        seen_uan = set()
        for i in range(1, 31):
            future = now + timedelta(days=i)
            if future.month == now.month:
                continue
            for row in all_employees:
                hire = row[3]
                if hire and hire.month == future.month and hire.day == future.day:
                    years = future.year - hire.year
                    if years > 0:
                        uid = f"UAN_{row[0]}_{future.strftime('%Y%m%d')}"
                        if uid not in seen_uan:
                            seen_uan.add(uid)
                            all_alerts.append({
                                "id": uid,
                                "displayId": f"UAN{row[0]:03d}",
                                "type": AlertType.UPCOMING_ANNIVERSARY.value,
                                "severity": AlertSeverity.INFO.value,
                                "employeeId": row[0],
                                "employeeName": row[1],
                                "title": "⏰ Upcoming Anniversary",
                                "description": f"{row[1]} will celebrate {years} year(s) of service on {future.strftime('%d %B')} ({i} days away)",
                                "createdAt": now.isoformat()
                            })

        # 7. New Employees Welcome (Joined in the last 90 days)
        hrm_cur.execute("""
            SELECT e.EmployeeID, e.FullName, e.HireDate, d.DepartmentName, e.DepartmentID
            FROM employees e
            LEFT JOIN departments d ON e.DepartmentID = d.DepartmentID
            WHERE e.HireDate >= ? AND e.HireDate <= ?
        """, (now - timedelta(days=90), now))
        for row in hrm_cur.fetchall():
            hire_dt = row[2]
            created_at = hire_dt.isoformat() if hasattr(hire_dt, 'isoformat') else str(hire_dt)
            hire_label = hire_dt.strftime('%d %B %Y') if hasattr(hire_dt, 'strftime') else str(hire_dt)
            all_alerts.append({
                "id": f"ALT_WELCOME_{row[0]}",
                "displayId": f"ALT{row[0]+500:03d}",
                "type": AlertType.WELCOME.value,
                "severity": AlertSeverity.INFO.value,
                "employeeId": row[0],
                "employeeName": row[1],
                "departmentId": row[4],
                "departmentName": row[3],
                "title": "Welcome New Member",
                "description": f"Welcome {row[1]} to {row[3] or 'the company'}! (Joined {hire_label})",
                "createdAt": created_at
            })

        # Apply filters
        if alert_type_filter != "all":
            all_alerts = [a for a in all_alerts if a['type'] == alert_type_filter]
        if severity_filter != "all":
            all_alerts = [a for a in all_alerts if a['severity'] == severity_filter]
        if search_query:
            all_alerts = [a for a in all_alerts if
                          search_query in (a.get('employeeName') or '').lower() or
                          search_query in a['description'].lower() or
                          search_query in a['displayId'].lower()]

        # Sort by createdAt DESC
        all_alerts.sort(key=lambda x: x['createdAt'], reverse=True)

        stats = {
            "total": len(all_alerts),
            "warnings": sum(1 for a in all_alerts if a['severity'] == AlertSeverity.WARNING.value),
            "info": sum(1 for a in all_alerts if a['severity'] == AlertSeverity.INFO.value)
        }

        payroll_cur.close()
        hrm_cur.close()
        payroll_conn.close()
        hrm_conn.close()

        return jsonify({"success": True, "data": all_alerts, "stats": stats}), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@alerts_bp.get("/api/alerts/<alert_id>")
def get_alert_detail(alert_id):
    try:
        hrm_conn = get_human_connection()
        payroll_conn = get_mysql_connection()
        hrm_cur = hrm_conn.cursor()
        payroll_cur = payroll_conn.cursor(dictionary=True)

        data = {"id": alert_id}

        # Parse emp_id correctly based on alert type prefix
        parts = alert_id.split("_")
        if alert_id.startswith("ALT_WELCOME_"):
            emp_id = parts[-1]
        elif alert_id.startswith("BTH_") or alert_id.startswith("ANV_") or \
             alert_id.startswith("UBT_") or alert_id.startswith("UAN_"):
            # Format: BTH_<empid>_<date>  → second part is emp_id
            emp_id = parts[1]
        else:
            # SAL_<id> or LEV_<id>
            emp_id = parts[-1]

        if alert_id.startswith("SAL_"):
            payroll_cur.execute("""
                SELECT s.NetSalary, e.FullName, s.SalaryMonth 
                FROM salaries s JOIN employees_payroll e ON s.EmployeeID = e.EmployeeID
                WHERE s.SalaryID = %s
            """, (emp_id,))
            r = payroll_cur.fetchone()
            if r:
                month_label = r['SalaryMonth'].strftime("%B %Y") if hasattr(r['SalaryMonth'], 'strftime') else str(r['SalaryMonth'])
                data.update({
                    "type": "abnormal_salary", "title": "Abnormal Salary Alert", "severity": "warning",
                    "details": {"Employee": r['FullName'], "Amount": f"{r['NetSalary']:,.0f} VND", "Month": month_label}
                })
        elif alert_id.startswith("LEV_"):
            payroll_cur.execute("""
                SELECT a.LeaveDays, a.AbsentDays, e.FullName, a.AttendanceMonth
                FROM attendance a JOIN employees_payroll e ON a.EmployeeID = e.EmployeeID
                WHERE a.AttendanceID = %s
            """, (emp_id,))
            r = payroll_cur.fetchone()
            if r:
                month_label = r['AttendanceMonth'].strftime("%B %Y") if hasattr(r['AttendanceMonth'], 'strftime') else str(r['AttendanceMonth'])
                data.update({
                    "type": "excessive_leave", "title": "Excessive Leave Alert", "severity": "warning",
                    "details": {"Employee": r['FullName'], "Leave Days": r['LeaveDays'], "Absent Days": r['AbsentDays'], "Month": month_label}
                })
        elif alert_id.startswith("BTH_"):
            hrm_cur.execute(
                "SELECT e.FullName, e.DateOfBirth, d.DepartmentName FROM employees e LEFT JOIN departments d ON e.DepartmentID = d.DepartmentID WHERE e.EmployeeID = ?",
                (emp_id,)
            )
            r = hrm_cur.fetchone()
            if r:
                data.update({
                    "type": "birthday", "title": "Happy Birthday!", "severity": "info",
                    "details": {"Employee": r[0], "Birthday": r[1].strftime("%d %B") if r[1] else "N/A", "Department": r[2] or "N/A"}
                })
        elif alert_id.startswith("ANV_"):
            hrm_cur.execute(
                "SELECT e.FullName, e.HireDate, d.DepartmentName FROM employees e LEFT JOIN departments d ON e.DepartmentID = d.DepartmentID WHERE e.EmployeeID = ?",
                (emp_id,)
            )
            r = hrm_cur.fetchone()
            if r:
                data.update({
                    "type": "anniversary", "title": "Work Anniversary", "severity": "info",
                    "details": {"Employee": r[0], "Department": r[2] or "N/A", "Hire Date": r[1].strftime("%d/%m/%Y") if r[1] else "N/A", "Years": datetime.now().year - r[1].year if r[1] else 0}
                })
        elif alert_id.startswith("UBT_"):
            hrm_cur.execute(
                "SELECT e.FullName, e.DateOfBirth, d.DepartmentName FROM employees e LEFT JOIN departments d ON e.DepartmentID = d.DepartmentID WHERE e.EmployeeID = ?",
                (emp_id,)
            )
            r = hrm_cur.fetchone()
            if r:
                data.update({
                    "type": "upcoming_birthday", "title": "Upcoming Birthday", "severity": "info",
                    "details": {"Employee": r[0], "Birthday": r[1].strftime("%d %B") if r[1] else "N/A", "Department": r[2] or "N/A"}
                })
        elif alert_id.startswith("UAN_"):
            hrm_cur.execute(
                "SELECT e.FullName, e.HireDate, d.DepartmentName FROM employees e LEFT JOIN departments d ON e.DepartmentID = d.DepartmentID WHERE e.EmployeeID = ?",
                (emp_id,)
            )
            r = hrm_cur.fetchone()
            if r:
                years = datetime.now().year - r[1].year if r[1] else 0
                data.update({
                    "type": "upcoming_anniversary", "title": "Upcoming Anniversary", "severity": "info",
                    "details": {"Employee": r[0], "Department": r[2] or "N/A", "Hire Date": r[1].strftime("%d/%m/%Y") if r[1] else "N/A", "Years": years}
                })
        elif alert_id.startswith("ALT_WELCOME_"):
            hrm_cur.execute("""
                SELECT e.FullName, e.HireDate, d.DepartmentName, e.Email, e.PhoneNumber
                FROM employees e 
                LEFT JOIN departments d ON e.DepartmentID = d.DepartmentID
                WHERE e.EmployeeID = ?
            """, (emp_id,))
            r = hrm_cur.fetchone()
            if r:
                data.update({
                    "type": "welcome", "title": "Welcome New Member", "severity": "info",
                    "details": {
                        "Employee": r[0],
                        "Department": r[2] or "N/A",
                        "Hire Date": r[1].strftime("%d %B %Y") if r[1] else "N/A",
                        "Email": r[3] or "N/A",
                        "Phone": r[4] or "N/A"
                    }
                })

        payroll_cur.close()
        hrm_cur.close()
        payroll_conn.close()
        hrm_conn.close()
        return jsonify({"success": True, "data": data}), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500