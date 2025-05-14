from fastapi import APIRouter
from backend.services import location, voucher_engine, rag_service, recommender

router = APIRouter()

@router.get("/location/{product}")
def get_location(product: str):
    return location.find_product_location(product)

@router.get("/vouchers")
def get_vouchers():
    return voucher_engine.get_all_vouchers()

@router.get("/suggest/{product}")
def suggest(product: str):
    return recommender.recommend_products(product)

@router.get("/ask/")
def ask_llm(q: str):
    return {"answer": rag_service.query_phi2(q)}
