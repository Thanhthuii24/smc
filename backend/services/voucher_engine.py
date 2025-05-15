import sqlite3
import pandas as pd
import os
from backend.config.config import DB_PATH, EXCEL_DIR

def load_voucher_to_sqlite():
    os.makedirs(EXCEL_DIR, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    file_path = os.path.join(EXCEL_DIR, "voucher.xlsx")
    try:
        df = pd.read_excel(file_path)
        df = df.dropna(how='all')
        if not df.empty:
            df.to_sql("voucher", conn, if_exists="replace", index=False)
            print(f"Synced {file_path} → table `voucher`")
        else:
            print(f"Warning: {file_path} is empty, creating empty voucher table.")
            pd.DataFrame(columns=["id", "name", "discount", "min_price", "expired_date", "category"]).to_sql("voucher", conn, if_exists="replace", index=False)
    except FileNotFoundError:
        print(f"Warning: {file_path} not found, creating empty voucher table.")
        pd.DataFrame(columns=["id", "name", "discount", "min_price", "expired_date", "category"]).to_sql("voucher", conn, if_exists="replace", index=False)
    finally:
        conn.close()

def get_all_vouchers():
    conn = sqlite3.connect(DB_PATH)
    try:
        df = pd.read_sql("SELECT * FROM voucher", conn)
        return df.to_dict(orient='records')
    finally:
        conn.close()

def search_vouchers(query: str):
    """
    Search for vouchers by name or category.
    Args:
        query (str): The search term to match against voucher name or category.
    Returns:
        list: A list of dictionaries containing matching vouchers.
    """
    conn = sqlite3.connect(DB_PATH)
    try:
        query = f"%{query}%"
        df = pd.read_sql(
            "SELECT * FROM voucher WHERE name LIKE ? OR category LIKE ?",
            conn,
            params=(query, query)
        )
        return df.to_dict(orient='records')
    finally:
        conn.close()