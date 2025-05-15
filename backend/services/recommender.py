def recommend_products(product_name: str):
    suggestions = {
        "sữa": ["bánh quy", "socola", "bơ"],
        "trứng": ["mì", "dầu ăn"],
        "bàn phím": ["chuột máy tính", "tai nghe"],
        "chuột": ["bàn phím", "ổ USB"]
    }
    for key in suggestions:
        if key in product_name.lower():
            return suggestions[key]
    return []
