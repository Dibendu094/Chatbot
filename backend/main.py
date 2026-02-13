from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
import json
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from dotenv import load_dotenv
import os
import uvicorn

# Load environment variables
load_dotenv(override=True)

# Build component imports
from services.groq_service import generate_chat_response, generate_streaming_response
from services.search_service import perform_search
from services.wiki_service import get_wiki_summary
from utils.router import detect_intent
from voice.router import router as voice_router

# Initialize FastAPI app
app = FastAPI(title="Apex Chatbot backend", version="1.0.0")

# Include Routers
app.include_router(voice_router)

# Configure CORS
origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request Models
class ChatRequest(BaseModel):
    message: str
    history: List[Dict[str, str]] = [] # List of {"role": "user"|"assistant", "content": "..."}
    stream: bool = False

class SearchRequest(BaseModel):
    query: str

class HealthResponse(BaseModel):
    status: str

# Endpoints
@app.get("/health", response_model=HealthResponse)
async def health_check():
    return {"status": "ok"}

@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    """
    Main chat endpoint.
    Routes the query based on intent:
    - active search (news, price, current events) -> SerpAPI + Groq Summary
    - factual queries -> Wikipedia + Groq Summary
    - coding/general -> Direct Groq LLM
    """
    try:
        user_message = request.message
        history = request.history
        
        # 1. Detect Intent
        intent = detect_intent(user_message)
        print(f"Detected intent: {intent}")

        # 2. Add Context based on Intent
        context = ""
        
        if intent in ["search", "knowledge"]:
            # Combine both for maximum awareness
            print(f"Deep knowledge retrieval started for: {user_message}")
            
            # Fetch Serp (Latest)
            try:
                search_results = perform_search(user_message)
            except:
                search_results = "No search results available."
                
            # Fetch Wiki (Factual)
            try:
                wiki_summary = get_wiki_summary(user_message)
            except:
                wiki_summary = "No Wikipedia info found."
                
            context = (
                f"### LATEST SEARCH RESULTS:\n{search_results}\n\n"
                f"### FACTUAL KNOWLEDGE (WIKIPEDIA):\n{wiki_summary}\n\n"
                "Use the provided context to answer accurately. If there is a contradiction, "
                "prioritize Search Results for current events and Wikipedia for historical/static facts."
            )
        
        # 3. Generate Response
        full_prompt_messages = []
        
        # ChatGPT-Style Elite System Message (Dynamic Style)
        system_prompt = (
            "You are Apex, a world-class AI assistant with a knowledge cutoff of 2022. "
            "For events, information, or data after 2022, you MUST rely on the provided context from search results and Wikipedia. "
            "IMPORTANT: Vary your response style based on the query. "
            "Do not always use the same structure. Switch between:\n"
            "- **Direct & Precise**: For simple questions.\n"
            "- **Structured & Analytical**: Using headers and lists for complex guides.\n"
            "- **Conversational & Prosaic**: For creative or philosophical discussions.\n"
            "- **Step-by-Step Tutorial**: For 'how-to' requests.\n"
            "\n\nSTYLE & PERSONA GUIDELINES:\n"
            "1. **Tone**: Professional, clear, and adaptive.\n"
            "2. **Structure**: Use Markdown. Vary the use of headers (###) and bolding so you don't look repetitive.\n"
            "3. **Reasoning**: Break down thinking when helpful.\n"
            "4. **Formatting**: Correct language tags for code, tables for data.\n"
            "5. **Citations**: Natural integration of sources if provided [1], [2].\n"
            "6. **Conciseness**: Avoid redundant conversational filler.\n"
            "7. **Knowledge Limitation**: If asked about post-2022 events without context, clearly state your knowledge cutoff and suggest the user ask for updated information."
        )
        
        full_prompt_messages.append({"role": "system", "content": system_prompt})
        
        # Add History (last 10 messages)
        api_history = history[-10:] 
        full_prompt_messages.extend(api_history)
        
        # Current Message with Context
        final_user_content = user_message
        if context:
            final_user_content = f"Context Information:\n{context}\n\nUser Question: {user_message}"
            
        full_prompt_messages.append({"role": "user", "content": final_user_content})
        
        # 4. Handle Response (Streaming vs. Blocking)
        if request.stream:
            async def response_generator():
                # Send the detected intent first as metadata
                yield f"data: {json.dumps({'intent': intent})}\n\n"
                
                # Stream the content
                for chunk in generate_streaming_response(full_prompt_messages):
                    if chunk:
                        # Only send content chunks
                        yield f"data: {json.dumps({'content': chunk})}\n\n"
                        
                yield "data: [DONE]\n\n"

            return StreamingResponse(response_generator(), media_type="text/event-stream")
        
        else:
            # Generate blocking
            response_content = generate_chat_response(full_prompt_messages)
            
            return {
                "role": "assistant",
                "content": response_content,
                "intent": intent
            }

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/welcome")
async def welcome_endpoint():
    """Generates a short, creative welcome message."""
    try:
        messages = [
            {"role": "system", "content": "You are a helpful AI assistant. Generate a short, inspiring, unique, single-sentence welcome message for a user starting a new chat. Max 8-10 words. Do not use quotes."},
            {"role": "user", "content": "Give me a welcome message."}
        ]
        message = generate_chat_response(messages)
        return {"message": message}
    except Exception:
        return {"message": "How can I help you today?"}

@app.post("/search")
async def search_endpoint(request: SearchRequest):
    results = perform_search(request.query)
    return {"results": results}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
