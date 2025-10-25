from fastapi import FastAPI, File, UploadFile
from pydantic import BaseModel
import whisper
from gtts import gTTS
import tempfile
import shutil
import os
import io

app = FastAPI()

# --- Model Initialization (Do this once!) ---

# 1. Whisper Model (STT)
try:
    # Use a smaller model like 'base' or 'small' for faster inference on CPU/smaller GPU
    stt_model = whisper.load_model("small")
    print("Whisper model loaded.")
except Exception as e:
    print(f"Error loading Whisper model: {e}")
    stt_model = None

# --- STT Endpoint ---
@app.post("/stt")
async def speech_to_text(audio_file: UploadFile = File(...)):
    if stt_model is None:
        return {"error": "STT model failed to load."}

    # Save the uploaded audio file temporarily
    with tempfile.NamedTemporaryFile(delete=False) as tmp:
        shutil.copyfileobj(audio_file.file, tmp)
        tmp_path = tmp.name

    try:
        # Transcribe the audio
        result = stt_model.transcribe(tmp_path)
        return {"text": result["text"]}
    except Exception as e:
        return {"error": str(e)}
    finally:
        os.remove(tmp_path) # Clean up the temporary file


# --- TTS Endpoint ---
class TTSText(BaseModel):
    text: str

@app.post("/tts")
async def text_to_speech(item: TTSText):
    if not item.text:
        return {"error": "Text is empty."}
    
    try:
        # Create the gTTS object
        tts = gTTS(text=item.text, lang='en')
        
        # Save the audio to a BytesIO object (in memory) instead of a file
        # This is more efficient for FastAPI!
        audio_fp = io.BytesIO()
        tts.write_to_fp(audio_fp)
        audio_fp.seek(0) # Rewind the file pointer to the beginning
        
        # Define the generator function to stream the in-memory audio
        def iterfile():
            # Read the entire BytesIO object (the MP3 data)
            yield audio_fp.read()

        # Return the audio stream
        return StreamingResponse(
            iterfile(), 
            media_type="audio/mp3", # IMPORTANT: Change media type to MP3
            headers={"Content-Disposition": "attachment;filename=speech.mp3"} # Change filename to MP3
        )
    
    except Exception as e:
        # gTTS errors will now be caught here
        return {"error": f"Failed to generate audio with gTTS: {e}"}
from fastapi.responses import StreamingResponse