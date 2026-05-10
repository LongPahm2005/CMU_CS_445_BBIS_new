import pyodbc
from config import get_human_connection

try:
    conn = get_human_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT TOP 1 * FROM Employees")
    columns = [column[0] for column in cursor.description]
    print("Columns in Employees:", columns)
    conn.close()
except Exception as e:
    print("Error:", e)
