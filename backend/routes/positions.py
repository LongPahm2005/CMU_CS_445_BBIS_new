from flask import Blueprint, jsonify, request
from config import get_human_connection, get_mysql_connection

positions_bp = Blueprint("positions", __name__)

@positions_bp.get("/api/positions")
def get_positions():
    try:
        conn = get_mysql_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT PositionID as positionid, PositionName as positionname, SyncedAt as syncedat FROM positions_payroll ORDER BY PositionID ASC")
        data = cursor.fetchall()
        conn.close()
        # Trả về danh sách trực tiếp để khớp với frontend cũ
        return jsonify(data)
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@positions_bp.get("/api/positions/<int:id>")
def get_position_detail(id):
    try:
        conn = get_mysql_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT PositionID as positionid, PositionName as positionname, SyncedAt as syncedat FROM positions_payroll WHERE PositionID = %s", (id,))
        row = cursor.fetchone()
        conn.close()
        if row:
            return jsonify({"success": True, "data": row})
        return jsonify({"success": False, "message": "Không tìm thấy chức vụ"}), 404
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@positions_bp.get("/api/positions/check-hrm/<int:id>")
def check_hrm_position(id):
    try:
        conn = get_human_connection()
        cur = conn.cursor()
        cur.execute("SELECT PositionName FROM positions WHERE PositionID = ?", (id,))
        row = cur.fetchone()
        conn.close()
        if row:
            return jsonify({"success": True, "positionname": row[0]})
        return jsonify({"success": False, "message": "Không tìm thấy mã này ở hệ thống HRM"})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@positions_bp.route("/api/positions", methods=["POST"])
def add_position():
    h_conn = None
    m_conn = None
    try:
        data = request.json
        pos_name = data.get("positionname")

        h_conn = get_human_connection()
        h_cur = h_conn.cursor()

        h_cur.execute("SELECT MAX(PositionID) FROM positions")
        max_id = h_cur.fetchone()[0]
        new_id = (int(max_id) + 1) if max_id is not None else 1

        try:
            h_cur.execute("SET IDENTITY_INSERT positions ON")
            h_cur.execute("INSERT INTO positions (PositionID, PositionName) VALUES (?, ?)", (new_id, pos_name))
            h_cur.execute("SET IDENTITY_INSERT positions OFF")
        except:
            h_cur.execute("INSERT INTO positions (PositionID, PositionName) VALUES (?, ?)", (new_id, pos_name))
        
        h_conn.commit()

        m_conn = get_mysql_connection()
        m_cur = m_conn.cursor()
        m_cur.execute("INSERT INTO positions_payroll (PositionID, PositionName, SyncedAt) VALUES (%s, %s, NOW())", (new_id, pos_name))
        m_conn.commit()

        return jsonify({"success": True, "message": "Thêm mới thành công!", "new_id": new_id})
    except Exception as e:
        if h_conn: h_conn.rollback()
        if m_conn: m_conn.rollback()
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        if h_conn: h_conn.close()
        if m_conn: m_conn.close()

@positions_bp.route("/api/positions/<int:id>", methods=["PUT"])
def update_position(id):
    h_conn = None
    m_conn = None
    try:
        data = request.json
        name = data.get("positionname")

        h_conn = get_human_connection()
        h_cur = h_conn.cursor()
        h_cur.execute("UPDATE positions SET PositionName = ? WHERE PositionID = ?", (name, id))
        h_conn.commit()

        m_conn = get_mysql_connection()
        m_cur = m_conn.cursor()
        m_cur.execute("UPDATE positions_payroll SET PositionName = %s, SyncedAt = NOW() WHERE PositionID = %s", (name, id))
        m_conn.commit()

        return jsonify({"success": True, "message": "Cập nhật thành công!"})
    except Exception as e:
        if h_conn: h_conn.rollback()
        if m_conn: m_conn.rollback()
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        if h_conn: h_conn.close()
        if m_conn: m_conn.close()

@positions_bp.delete("/api/positions/<int:id>")
def delete_position(id):
    h_conn = None
    m_conn = None
    try:
        h_conn = get_human_connection()
        h_cur = h_conn.cursor()
        h_cur.execute("DELETE FROM positions WHERE PositionID = ?", (id,))
        h_conn.commit()

        m_conn = get_mysql_connection()
        m_cur = m_conn.cursor()
        m_cur.execute("DELETE FROM positions_payroll WHERE PositionID = %s", (id,))
        m_conn.commit()

        return jsonify({"success": True, "message": "Xóa thành công!"})
    except Exception as e:
        if h_conn: h_conn.rollback()
        if m_conn: m_conn.rollback()
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        if h_conn: h_conn.close()
        if m_conn: m_conn.close()

@positions_bp.post("/api/positions/<int:id>/sync")
def sync_position(id):
    h_conn = None
    m_conn = None
    try:
        h_conn = get_human_connection()
        h_cur = h_conn.cursor()
        h_cur.execute("SELECT PositionName FROM positions WHERE PositionID = ?", (id,))
        row = h_cur.fetchone()
        if not row:
            return jsonify({"success": False, "message": "Không tìm thấy ở HRM"}), 404
        
        pos_name = row[0]
        m_conn = get_mysql_connection()
        m_cur = m_conn.cursor()
        m_cur.execute("UPDATE positions_payroll SET PositionName = %s, SyncedAt = NOW() WHERE PositionID = %s", (pos_name, id))
        m_conn.commit()
        return jsonify({"success": True, "message": "Đồng bộ thành công!"})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        if h_conn: h_conn.close()
        if m_conn: m_conn.close()
