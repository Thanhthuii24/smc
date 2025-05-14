import os
import sqlite3
import pandas as pd

# Định nghĩa đường dẫn tuyệt đối
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
EXCEL_DIR = os.path.abspath(os.path.join(BASE_DIR, '..', 'data', 'excel'))
DB_PATH = os.path.abspath(os.path.join(BASE_DIR, '..', 'data', 'location.db'))

def load_excel_to_sqlite():
    # Tạo thư mục chứa DB nếu chưa có
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    
    # Kết nối SQLite
    conn = sqlite3.connect(DB_PATH)

    # Load từng file Excel trong thư mục
    for file in os.listdir(EXCEL_DIR):
        if file.endswith(".xlsx"):
            file_path = os.path.join(EXCEL_DIR, file)
            table_name = os.path.splitext(file)[0]

            df = pd.read_excel(file_path)
            df.to_sql(table_name, conn, if_exists='replace', index=False)
            print(f"Synced {file} → table `{table_name}`")

    conn.close()
