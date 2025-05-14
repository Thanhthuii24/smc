from TTS.api import TTS

tts = TTS(model_name="tts_models/en/ljspeech/tacotron2-DDC", progress_bar=False)

def speak(text: str, output_path="output.wav"):
    tts.tts_to_file(text=text, file_path=output_path)
    return output_path
#file âm thanh là wav