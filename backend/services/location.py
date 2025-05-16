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

            df = pd.read_excel(file_path, engine="openpyxl")
            df.to_sql(table_name, conn, if_exists='replace', index=False)
            print(f"Synced {file} → table `{table_name}`")

    conn.close()


def find_product_location(product_name: str):
    conn = sqlite3.connect("data/location.db")
    cursor = conn.cursor()
    query = "SELECT * FROM location WHERE product_name LIKE ?"
    cursor.execute(query, ('%' + product_name + '%',))
    result = cursor.fetchone()
    conn.close()
    if result:
        return {
            "product_name": result[0],
            "category": result[1],
            "x": result[2],
            "y": result[3],
            "zone": result[4]
        }
    return None
