from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
import os
import uuid
import shutil
from backend.services.location import find_product_location


from backend.services import (
    location,
    voucher_engine,
    rag_service,
    recommender,
    stt_service,
    tts_service
)
from backend.api.schemas import QueryRequest, QueryResponse
from backend.services import location, voucher_engine, rag_service, recommender, stt_service, tts_service
from backend.api.schemas import QueryRequest, QueryResponse

router = APIRouter()

# Đường dẫn lưu file âm thanh đầu ra
TARGET_DIRECTORY = "smc/backend/voice"
# Define the target directory where .wav files are saved
TARGET_DIRECTORY = "/home/konabi/Documents/demo/smc/backend/voice"
os.makedirs(TARGET_DIRECTORY, exist_ok=True)

# ========== 1. LOCATION ==========
@router.get("/location/{product}")
def get_location(product: str):
    return location.find_product_location(product)

# ========== 2. VOUCHER ==========
@router.get("/vouchers")
def get_vouchers():
    return voucher_engine.get_all_vouchers()

@router.get("/vouchers/search")
def search_vouchers(query: str):
    try:
        vouchers = voucher_engine.search_vouchers(query)
        if not vouchers:
            return {"message": "No vouchers found", "vouchers": []}
        return vouchers
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error searching vouchers: {str(e)}")

# ========== 3. PRODUCT SUGGESTION ==========
@router.get("/suggest/{product}")
def suggest(product: str):
    words = [word.strip().lower() for word in product.split() if word.strip()]
    suggestions = {}

    for word in words:
        try:
            products = recommender.recommend_products(word)
            if products:
                suggestions[word] = list(set(products))
        except Exception as e:
            print(f"Warning: Failed to get suggestions for '{word}': {str(e)}")
            suggestions[word] = []
    return suggestions

# ========== 4. LLM QUERY ==========
@router.post("/ask/", response_model=QueryResponse)
def ask_llm(request: QueryRequest):
    try:
        answer = rag_service.query_with_context(request.question)
        return {"answer": answer}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM error: {str(e)}")

# ========== 5. VOICE SEARCH ==========
@router.post("/voice_search/", response_model=QueryResponse)
async def voice_search(audio: UploadFile = File(...)):
    if not audio.filename or not audio.filename.lower().endswith('.wav'):
        raise HTTPException(status_code=400, detail="Only .wav files are supported")

    audio_path = f"temp_{uuid.uuid4()}.wav"
    output_uuid = uuid.uuid4()
    output_audio_path = f"output_{output_uuid}.wav"
    final_output_path = os.path.join(TARGET_DIRECTORY, f"output_{output_uuid}.wav")

    try:
        with open(audio_path, "wb") as f:
            f.write(await audio.read())

        text = stt_service.transcribe_audio(audio_path)
        if not text:
            raise HTTPException(status_code=400, detail="Could not recognize speech")

        llm_response = rag_service.query_with_context(text)
        # Use the new RAG function
        llm_response = rag_service.query_with_context(f"Search: {text}")
        if not llm_response:
            raise HTTPException(status_code=500, detail="No response received from LLM")

        tts_service.speak(llm_response, output_audio_path)

        if not os.path.exists(output_audio_path):
            raise HTTPException(status_code=500, detail="TTS không tạo ra file âm thanh")

        shutil.move(output_audio_path, final_output_path)

        return {
            "transcribed_text": text,
            "llm_response": llm_response,
            "audio_response": str(output_uuid)
        }

    finally:
        if os.path.exists(audio_path):
            try:
                os.remove(audio_path)
            except Exception as e:
                print(f"Warning: Failed to delete temporary file {audio_path}: {str(e)}")

# ========== 6. AUDIO GET & DELETE ==========
@router.get("/audio/{filename}")
async def get_audio(filename: str):
    file_path = os.path.join(TARGET_DIRECTORY, f"output_{filename}.wav")
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Audio file not found")
    return FileResponse(file_path, media_type="audio/wav", filename=f"output_{filename}.wav")

@router.delete("/audio/{filename}")
async def delete_audio(filename: str):
    file_path = os.path.join(TARGET_DIRECTORY, f"output_{filename}.wav")
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Audio file not found")

    try:
        os.remove(file_path)
        print(f"Deleted file: {file_path}")
        return {"message": f"Audio file output_{filename}.wav deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting audio file: {str(e)}")


@router.post("/ask/", response_model=QueryResponse)
def ask_llm(request: QueryRequest):
    try:
        answer = rag_service.query_with_context(request.question)
        return {"answer": answer}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM error: {str(e)}")