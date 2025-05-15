from fastapi import FastAPI
from backend.api.routes import router
from backend.services.location import load_excel_to_sqlite
from backend.services.voucher_engine import load_voucher_to_sqlite

app = FastAPI()

@app.on_event("startup")
def init_services():
    load_excel_to_sqlite()
    load_voucher_to_sqlite()

app.include_router(router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", port=8000, reload=True)
