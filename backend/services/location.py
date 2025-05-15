import os
import sqlite3
import pandas as pd
from backend.config.config import DB_PATH, EXCEL_DIR

def load_excel_to_sqlite():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    os.makedirs(EXCEL_DIR, exist_ok=True)
    
    conn = sqlite3.connect(DB_PATH)

    for file in os.listdir(EXCEL_DIR):
        if file.endswith(".xlsx"):
            file_path = os.path.join(EXCEL_DIR, file)
            table_name = os.path.splitext(file)[0]

            df = pd.read_excel(file_path)
            df.to_sql(table_name, conn, if_exists='replace', index=False)
            print(f"Synced {file} → table `{table_name}`")

    conn.close()