from flask import Blueprint, jsonify, request
from config import get_access_connection

auth_bp = Blueprint("auth", __name__)

@auth_bp.post("/api/auth/login")
def login():
    try:
        data = request.get_json()

        username = data.get("username")
        password = data.get("password")

        conn = get_access_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT
                UserID,
                Username,
                FullName,
                Email
            FROM Users
            WHERE Username = ?
              AND PasswordHash = ?
        """, (username, password))

        user = cursor.fetchone()

        cursor.close()
        conn.close()

        if user:
            return jsonify({
                "success": True,
                "token": "demo-token",
                "user": {
                    "UserID": user[0],
                    "Username": user[1],
                    "FullName": user[2],
                    "Email": user[3]
                }
            }), 200

        return jsonify({
            "success": False,
            "message": "Sai tài khoản hoặc mật khẩu"
        }), 401

    except Exception as e:
        print(f"[ERROR] LOGIN: {str(e)}")

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500
