import os
from dotenv import load_dotenv
import google.generativeai as ai
import logging

# Set up logger
logger = logging.getLogger(__name__)

load_dotenv()

API_KEY = os.getenv("GEMINI_API_KEY")
if not API_KEY:
    logger.critical("GEMINI_API_KEY not found in .env file. The application will fail.")
    raise ValueError("GEMINI_API_KEY not found")

try:
    ai.configure(api_key=API_KEY)
    logger.info("Google Generative AI configured successfully.")
except Exception as e:
    logger.critical(f"Failed to configure Google Generative AI: {e}", exc_info=True)
    raise

MODEL_NAME = "gemini-2.5-flash"

SYSTEM_PROMPT = """
***CRUCIAL SAFETY INSTRUCTIONS:***
If the user expresses thoughts of self-harm, suicide, or an immediate crisis, you must IMMEDIATELY and WITHOUT EXCEPTION provide crisis helpline numbers and emergency contact information.
Your response for a crisis should be:
"It sounds like you're going through a very difficult time. Please know that help is available immediately. You can reach the ICall Helpline at 9152987821, or contact your college's on-campus emergency services."
"""

CRISIS_RESPONSE = (
    "It sounds like you're going through a very difficult time. "
    "Please know that help is available immediately. "
    "You can reach the ICall Helpline at 9152987821, "
    "or contact your college's on-campus emergency services."
)

CRISIS_KEYWORDS = ["suicide", "end my life", "kill myself", "self-harm", "harm myself"]

# This is the reusable logic function
async def get_llm_response(user_message: str) -> str:
    """
    Sends a user message to the LLM and returns the text response.
    Handles crisis keywords and errors.
    """
    user_message = user_message.strip()
    if not user_message:
        logger.warning("get_llm_response received empty message.")
        return "I'm sorry, I didn't catch that. Could you please repeat yourself?"

    # Check for crisis keywords
    if any(keyword in user_message.lower() for keyword in CRISIS_KEYWORDS):
        logger.warning(f"Crisis keyword detected in message: '{user_message[:50]}...'")
        return CRISIS_RESPONSE

    # Call the LLM
    try:
        logger.info("Sending request to GenerativeModel...")
        model = ai.GenerativeModel(MODEL_NAME)
        # Pass system prompt and user message as a list
        response = model.generate_content([SYSTEM_PROMPT, user_message])
        logger.info("Received response from GenerativeModel.")
        return response.text
    except Exception as e:
        logger.error(f"Error processing LLM request: {e}", exc_info=True)
        # Don't raise an exception, just return a user-friendly error
        return "I'm sorry, I'm having trouble connecting to my brain right now. Please try again in a moment."
