from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import whisper
from gtts import gTTS
import tempfile
import shutil
import os
import io
import logging # Import the logging module

# --- 1. Configure Logging ---
# Set up basic configuration for logging
logging.basicConfig(
    level=logging.INFO, # Set the logging level (INFO, DEBUG, ERROR, etc.)
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__) # Get a logger for this module

app = FastAPI()

logger.info("Starting FastAPI application...")

# Allow cross-origin requests from the frontend during development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Model Initialization (Do this once!) ---
stt_model = None
try:
    logger.info("Loading Whisper model (small)... This may take a moment.")
    stt_model = whisper.load_model("small")
    logger.info("Whisper model loaded successfully.")
except Exception as e:
    logger.error(f"CRITICAL: Error loading Whisper model: {e}", exc_info=True)
    # Note: The app will still run, but /stt and /echo will fail.

# --- STT Endpoint ---
@app.post("/stt")
async def speech_to_text(audio_file: UploadFile = File(...)):
    logger.info("Received request on /stt endpoint.")
    if stt_model is None:
        logger.error("STT model is not loaded. Returning error.")
        raise HTTPException(status_code=500, detail="STT model failed to load.")

    with tempfile.NamedTemporaryFile(delete=False) as tmp:
        shutil.copyfileobj(audio_file.file, tmp)
        tmp_path = tmp.name
        logger.info(f"Saved uploaded file to temporary path: {tmp_path}")

    try:
        logger.info("Starting transcription...")
        result = stt_model.transcribe(tmp_path)
        transcribed_text = result["text"]
        logger.info(f"Transcription successful. Text: {transcribed_text}")
        return {"text": transcribed_text}
    except Exception as e:
        logger.error(f"Error during transcription: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        os.remove(tmp_path)
        logger.info(f"Removed temporary file: {tmp_path}")

# --- TTS Endpoint ---
class TTSText(BaseModel):
    text: str
    lang_code: str = 'en' # Add a default language

@app.post("/tts")
async def text_to_speech(item: TTSText):
    logger.info(f"Received request on /tts endpoint. Text: {item.text[:50]}...")
    if not item.text:
        logger.warning("TTS request received with empty text.")
        raise HTTPException(status_code=400, detail="Text is empty.")
    
    try:
        logger.info("Generating speech with gTTS...")
        tts = gTTS(text=item.text, lang=item.lang_code)
        audio_fp = io.BytesIO()
        tts.write_to_fp(audio_fp)
        audio_fp.seek(0)
        logger.info("Speech generated successfully. Streaming response.")
        
        def iterfile():
            yield audio_fp.read()

        return StreamingResponse(
            iterfile(), 
            media_type="audio/mp3",
            headers={"Content-Disposition": "attachment;filename=speech.mp3"}
        )
    except Exception as e:
        logger.error(f"Failed to generate audio with gTTS: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to generate audio with gTTS: {e}")

# --- NEW: Echo Endpoint (STT -> TTS) ---
@app.post("/echo")
async def speech_to_speech_echo(audio_file: UploadFile = File(...)):
    logger.info("Received request on /echo endpoint.")
    
    if stt_model is None:
        logger.error("/echo: STT model is not loaded. Returning error.")
        raise HTTPException(status_code=500, detail="STT model failed to load.")

    # --- 1. STT (Speech-to-Text) ---
    tmp_path = ""
    try:
        with tempfile.NamedTemporaryFile(delete=False) as tmp:
            shutil.copyfileobj(audio_file.file, tmp)
            tmp_path = tmp.name
        logger.info(f"/echo: Saved uploaded file to temporary path: {tmp_path}")
    except Exception as e:
        logger.error(f"/echo: Failed to save temporary file: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to save audio file.")

    transcribed_text = ""
    try:
        logger.info("/echo: Starting transcription...")
        result = stt_model.transcribe(tmp_path)
        transcribed_text = result["text"]
        
        if not transcribed_text:
             logger.warning("/echo: Transcription result was empty.")
             transcribed_text = "I could not understand what you said."
        else:
             logger.info(f"/echo: Transcription successful. Text: {transcribed_text}")
             
    except Exception as e:
        logger.error(f"/echo: Error during transcription: {e}", exc_info=True)
        transcribed_text = "I encountered an error during transcription."
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)
            logger.info(f"/echo: Removed temporary file: {tmp_path}")

    # --- 2. TTS (Text-to-Speech) ---
    try:
        logger.info(f"/echo: Generating speech with gTTS for text: '{transcribed_text}'")
        # For simplicity, this echo is hardcoded to English ('en')
        tts = gTTS(text=transcribed_text, lang='en') 
        
        audio_fp = io.BytesIO()
        tts.write_to_fp(audio_fp)
        audio_fp.seek(0)
        logger.info("/echo: Speech generated. Streaming response back to client.")
        
        def iterfile():
            yield audio_fp.read()

        # Stream the new audio back
        return StreamingResponse(
            iterfile(), 
            media_type="audio/mp3",
            headers={"Content-Disposition": "attachment;filename=echo.mp3"}
        )
    except Exception as e:
        logger.error(f"/echo: Failed to generate audio with gTTS: {e}", exc_info=True)
        # Return a JSON error this time, as the client handles it
        raise HTTPException(status_code=500, detail=f"Failed to generate audio with gTTS: {e}")


# --- Optional: serve built frontend (production) ---
BASE_DIR = os.path.dirname(__file__)
FRONTEND_DIST = os.path.normpath(os.path.join(BASE_DIR, "..", "frontend", "dist"))

logger.info(f"Checking for frontend build at: {FRONTEND_DIST}")
if os.path.isdir(FRONTEND_DIST):
    logger.info("Serving static frontend from /")
    app.mount("/", StaticFiles(directory=FRONTEND_DIST, html=True), name="frontend")
else:
    logger.warning("Frontend build directory not found. Static file serving is disabled.")
    @app.get("/")
    def read_root():
        return {"message": "FastAPI backend is running. Frontend not found."}