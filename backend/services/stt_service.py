from faster_whisper import WhisperModel

model = WhisperModel("tiny")

def transcribe_audio(audio_path: str) -> str:
    segments, _ = model.transcribe(audio_path)
    return " ".join([seg.text for seg in segments])