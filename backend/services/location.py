import os, sqlite3, pandas as pd

EXCEL_DIR = "backend/data/excel"
DB_PATH = "backend/data/location.db"

def load_excel_to_sqlite():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)

    for file in os.listdir(EXCEL_DIR):
        if file.endswith("location.xlsx"):
            df = pd.read_excel(os.path.join(EXCEL_DIR, file))
            df.to_sql("location", conn, if_exists="replace", index=False)
    conn.close()

def find_product_location(product_name: str):
    conn = sqlite3.connect(DB_PATH)
    query = f\"\"\"SELECT * FROM location WHERE LOWER(ProductName) LIKE LOWER('%{product_name}%')\"\"\"
    result = pd.read_sql(query, conn).to_dict(orient='records')
    conn.close()
    return result
