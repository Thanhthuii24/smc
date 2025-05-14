def load_voucher_to_sqlite():
    conn = sqlite3.connect(DB_PATH)
    file_path = os.path.join(EXCEL_DIR, "voucher.xlsx")
    df = pd.read_excel(file_path)
    df.to_sql("voucher", conn, if_exists="replace", index=False)
    conn.close()

def get_all_vouchers():
    conn = sqlite3.connect(DB_PATH)
    df = pd.read_sql("SELECT * FROM voucher", conn)
    conn.close()
    return df.to_dict(orient='records')
