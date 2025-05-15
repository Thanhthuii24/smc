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

    if not rows:
        return "Xin lỗi, tôi không tìm thấy sản phẩm phù hợp."

    # Dùng dòng đầu tiên làm context
    name, category, x, y, zone = rows[0]
    context = f"Sản phẩm {name} thuộc danh mục {category} được đặt tại vị trí tọa độ ({x}, {y}) trong {zone}."

    # Tạo prompt đầy đủ
    prompt = f"""
Bạn là trợ lý thông minh trong siêu thị.
Câu hỏi: "{user_question}"
Thông tin sản phẩm trong hệ thống: {context}
Trả lời một cách ngắn gọn, rõ ràng với tên sản phẩm và zone cụ thể.
    """

    output = llm(prompt, max_tokens=256, stop=["</s>"])
    return output["choices"][0]["text"].strip()

def extract_keyword(text):
    # Đơn giản hóa: lấy từ sau "tìm"
    import re
    match = re.search(r'tìm\s+(.*?)\s+(ở|tại|zone|gian|khu)?', text.lower())
    return match.group(1) if match else text
