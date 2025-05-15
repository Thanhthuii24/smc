from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware 
from backend.api.routes import router
from backend.services.location import load_excel_to_sqlite
from backend.services.voucher_engine import load_voucher_to_sqlite

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  
    allow_credentials=True,
    allow_methods=["*"], 
    allow_headers=["*"],  
)

@app.on_event("startup")
def init_services():
    load_excel_to_sqlite()
    load_voucher_to_sqlite()

app.include_router(router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)
