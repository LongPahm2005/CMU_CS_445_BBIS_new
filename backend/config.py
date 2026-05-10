import pyodbc
import mysql.connector


API_PREFIX = "/api"
HOST = "0.0.0.0"
PORT = 5000
DEBUG = True
SECRET_KEY = "bbis-secret-key-2026"


SQL_SERVER_CONFIG = {
    "driver": "ODBC Driver 17 for SQL Server",
    "server": "localhost",
    "uid": "sa",
    "pwd": "123456"
}


MYSQL_CONFIG = {
    "host": "localhost",
    "user": "root",
    "password": "123456",
    "database": "PAYROLL",
    "autocommit": False
}


def get_sqlserver_connection(database):
    """
    Kết nối SQL Server theo database truyền vào
    """
    try:
        conn_str = (
            f"DRIVER={{{SQL_SERVER_CONFIG['driver']}}};"
            f"SERVER={SQL_SERVER_CONFIG['server']};"
            f"DATABASE={database};"
            f"UID={SQL_SERVER_CONFIG['uid']};"
            f"PWD={SQL_SERVER_CONFIG['pwd']};"
            "TrustServerCertificate=yes;"
        )

        conn = pyodbc.connect(conn_str)
        return conn

    except Exception as e:
        print(f"Lỗi kết nối SQL Server ({database}):", str(e))
        raise


def get_human_connection():
    return get_sqlserver_connection("HUMAN")


def get_access_connection():
    return get_sqlserver_connection("ACCESS_CONTROL")


def get_mysql_connection():
    """
    Kết nối MySQL
    """
    try:
        conn = mysql.connector.connect(**MYSQL_CONFIG)
        return conn

    except Exception as e:
        print("Lỗi kết nối MySQL:", str(e))
        raise
