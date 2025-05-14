def recommend_products(product_name: str):
    # (Tạm thời hardcode, có thể dùng vector RAG để cải thiện sau)
    suggestions = {
        "sữa": ["bánh quy", "socola"],
        "trứng": ["mì", "dầu ăn"]
    }
    for key in suggestions:
        if key in product_name.lower():
            return suggestions[key]
    return []
