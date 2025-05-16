from llama_cpp import Llama
import sqlite3
import os

model_path = "backend/models/phi2_model.gguf"
llm = Llama(model_path=model_path, n_ctx=2048, n_threads=4)

db_path = "backend/data/location.db"

def query_with_context(user_question: str) -> str:
    # Trích keyword
    keyword = extract_keyword(user_question)
    
    # Kết nối SQLite và lấy context
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT product_name, category, x, y, zone FROM location WHERE LOWER(product_name) LIKE ?", ('%' + keyword.lower() + '%',))
    rows = cursor.fetchall()
    conn.close()

    query_lower = query.lower()

    for row in rows:
        product_name, category, x, y, zone = row
        if product_name.lower() in query_lower:
            return f"{product_name} thuộc danh mục {category}, nằm ở {zone}, tọa độ ({x}, {y})"

        return "Xin lỗi, tôi không tìm thấy sản phẩm bạn yêu cầu."
    # Dùng dòng đầu tiên làm context
    name, category, x, y, zone = rows[0]
    context = f"Sản phẩm {name} thuộc danh mục {category} được đặt tại vị trí quầy  và hàng lần lượt là  ({x}, {y}) trong {zone}."

    # Tạo prompt đầy đủ
    prompt = f"""
Bạn là trợ lý thông minh trong siêu thị.
Câu hỏi: "{user_question}"
Thông tin sản phẩm trong hệ thống: {context}

    """

    output = llm(prompt, max_tokens=256, stop=["</s>"])
    return output["choices"][0]["text"].strip()

import re

def extract_keyword(text):
    text = text.lower().strip()

    match = re.search(r'(tìm|mua|kiếm|cần)\s+(.*?)(\s+(ở|tại|zone|gian|khu)|\?|$)', text)
    if match:
        return match.group(2).strip()


    stop_words = ['tôi', 'muốn', 'mua', 'cần', 'tìm', 'kiếm', 'ở', 'đâu', '?']
    words = text.split()
    keywords = [w for w in words if w not in stop_words]

    return ' '.join(keywords)



def query_with_context(query: str):
    conn = sqlite3.connect("data/location.db")
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM location")
    rows = cursor.fetchall()
    conn.close()

    # Tạo "context" từ các dòng dữ liệu
    context = "\n".join([f"{row[0]} ({row[1]}) nằm ở {row[4]} tọa độ ({row[2]}, {row[3]})" for row in rows])

    if "logitech" in query.lower():
        return "Bàn phím Logitech nằm ở Zone 2 "
    if "chuột" in query.lower():
        return "Chuột không dây nằm ở Zone 2"
    
    return "Xin lỗi, tôi không tìm thấy sản phẩm bạn yêu cầu."
