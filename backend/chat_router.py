from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import logging
from llm_logic import get_llm_response  # Import the reusable logic

# Set up logger
logger = logging.getLogger(__name__)

chat_router = APIRouter(prefix="/chat", tags=["Text Chat"])

class ChatRequest(BaseModel):
    message: str

@chat_router.post("/")
async def chat(request: ChatRequest):
    """
    Endpoint for text-based chat. Receives JSON with "message"
    and returns JSON with "text".
    """
    user_message = request.message
    if not user_message:
        logger.warning("/chat received empty message.")
        raise HTTPException(status_code=400, detail="No message provided")
    
    logger.info(f"/chat received text message: '{user_message[:50]}...'")
    
    # Call the reusable logic
    response_text = await get_llm_response(user_message)
    
    # The logic function handles crisis response and errors internally
    logger.info(f"/chat sending response: '{response_text[:50]}...'")
    return {"text": response_text}
