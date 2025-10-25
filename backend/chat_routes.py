import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY not found")

genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-1.5-flash')

SYSTEM_PROMPT = """
***CRUCIAL SAFETY INSTRUCTIONS:***
If the user expresses thoughts of self-harm, suicide, or an immediate crisis, you must IMMEDIATELY and WITHOUT EXCEPTION provide crisis helpline numbers and emergency contact information. Do not attempt to engage further on that topic.
Your response for a crisis should be: "It sounds like you're going through a very difficult time. Please know that help is available immediately. You can reach the ICall Helpline at 9152987821, or contact your college's on-campus emergency services."

You can also help students book a confidential appointment with an on-campus counselor or guide them to the peer support forum. If a student mentions needing to talk to a person, you should offer to help them with the confidential booking system.
"""

chat_router = APIRouter(prefix="/chat", tags=["Chatbot"])

class ChatRequest(BaseModel):
    message:str

@chat_router.post("/")
async def chat(request: ChatRequest):
    user_message = request.message
    if not user_message:
        raise HTTPException(status_code=400, detail="No message provided")
    
    crisis_keywords = ["suicide", "end my life", "kill myself", "self-harm", "harm myself"]
    if any(keyword in user_message.lower() for keyword in crisis_keywords):
        return{
            "text": (
                "It sounds like you're going through a very difficult time."
                "Please know that help is available immediately. You could reach out to"
                "the ICall helpline at 9152987821 or contact on-campus emergency services."
            )
        }
    
    try:
        gemini_response = model.generate_content(SYSTEM_PROMPT + user_message)
        return {"text": gemini_response.text}
    except Exception as e:
        print(f"Error processing chat request: {e}")
        raise HTTPException(status_code=500, detail="Chat processing error")