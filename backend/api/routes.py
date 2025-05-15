from fastapi import FastAPI, APIRouter, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import os
import uuid
import shutil
from backend.services import location, voucher_engine, rag_service, recommender, stt_service, tts_service
from backend.api.schemas import QueryRequest, QueryResponse
from backend.services import (
    location,
    voucher_engine,
    rag_service,
    recommender,
    stt_service,
    tts_service
)

router = APIRouter()

# Define the target directory where .wav files are saved
TARGET_DIRECTORY = "smc/backend/voice"
os.makedirs(TARGET_DIRECTORY, exist_ok=True)

@router.get("/location/{product}")
def get_location(product: str):
    return location.find_product_location(product)

@router.get("/vouchers")
def get_vouchers():
    return voucher_engine.get_all_vouchers()

@router.get("/suggest/{product}")
def suggest(product: str):
    """
    Generate product suggestions for each word in the input string.
    """
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

@router.get("/ask/")
def ask_llm(q: str):
    """
    Query LLM using the new context-aware RAG service.
    """
    return {"answer": rag_service.query_with_context(q)}

@router.get("/vouchers/search")
async def search_vouchers_endpoint(query: str):
    """
    Search vouchers by name or category.
    """
    try:
        vouchers = voucher_engine.search_vouchers(query)
        if not vouchers:
            return {"message": "No vouchers found", "vouchers": []}
        return vouchers
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error searching vouchers: {str(e)}")

@router.post("/voice_search/")
async def voice_search(audio: UploadFile = File(...)):
    """
    Process a .wav audio file through STT -> LLM -> TTS.
    """
    if not audio.filename or not audio.filename.lower().endswith('.wav'):
        raise HTTPException(status_code=400, detail="Only .wav files are supported")

    audio_path = f"temp_{uuid.uuid4()}.wav"
    output_uuid = uuid.uuid4()
    output_audio_path = f"output_{output_uuid}.wav"

    try:
        with open(audio_path, "wb") as f:
            f.write(await audio.read())
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving audio file: {str(e)}")

    try:
        text = stt_service.transcribe_audio(audio_path)
        if not text:
            raise HTTPException(status_code=400, detail="Không thể nhận diện giọng nói")

        # Sử dụng hàm RAG mới
        llm_response = rag_service.query_with_context(f"Tìm kiếm: {text}")
        if not llm_response:
            raise HTTPException(status_code=500, detail="Không nhận được phản hồi từ LLM")

        try:
            tts_service.speak(llm_response, output_audio_path)
            if not os.path.exists(output_audio_path):
                raise HTTPException(status_code=500, detail="Failed to generate output audio")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error generating audio: {str(e)}")

        destination_path = os.path.join(TARGET_DIRECTORY, f"output_{output_uuid}.wav")
        try:
            shutil.move(output_audio_path, destination_path)
            print(f"File moved to {destination_path}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error moving file: {str(e)}")

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

@router.get("/audio/{filename}")
async def get_audio(filename: str):
    file_path = os.path.join(TARGET_DIRECTORY, f"output_{filename}.wav")
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Audio file not found")

    try:
        return FileResponse(file_path, media_type="audio/wav", filename=f"output_{filename}.wav")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error serving audio file: {str(e)}")

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


@router.post("/voice_search/", response_model=QueryResponse)
async def voice_search(audio: UploadFile = File(...)):
    if not audio.filename or not audio.filename.lower().endswith('.wav'):
        raise HTTPException(status_code=400, detail="Only .wav files are supported")

    audio_path = f"temp_{uuid.uuid4()}.wav"
    output_uuid = uuid.uuid4()
    output_audio_path = f"output_{output_uuid}.wav"
    try:
        with open(audio_path, "wb") as f:
            f.write(await audio.read())

        text = stt_service.transcribe_audio(audio_path)
        if not text:
            raise HTTPException(status_code=400, detail="Không thể nhận diện giọng nói")

        llm_response = rag_service.query_with_context(text)
        if not llm_response:
            raise HTTPException(status_code=500, detail="Không nhận được phản hồi từ LLM")

        tts_service.speak(llm_response, output_audio_path)
        shutil.move(output_audio_path, os.path.join(TARGET_DIRECTORY, f"output_{output_uuid}.wav"))

        return {
            "transcribed_text": text,
            "llm_response": llm_response,
            "audio_response": str(output_uuid)
        }

    finally:
        if os.path.exists(audio_path):
            os.remove(audio_path)
