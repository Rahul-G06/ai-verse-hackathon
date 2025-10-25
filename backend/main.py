from fastapi import FastAPI
from chat_routes import chat_router  # Imports the router from your file

app = FastAPI(title="Chatbot API")

# Include the router you created in chat_routes.py
app.include_router(chat_router)

@app.get("/")
def read_root():
    return {"message": "Chatbot API is running. Go to /docs to test."}