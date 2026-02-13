import os
import asyncio
import json
import base64
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from groq import AsyncGroq
from dotenv import load_dotenv
from services.search_service import perform_search
from utils.router import detect_intent

load_dotenv()

router = APIRouter(prefix="/ws")

# Initialize Groq client
client = AsyncGroq(api_key=os.getenv("GROQ_API_KEY"))

# System prompt for English assistant
SYSTEM_PROMPT = """
You are Apex, a friendly and advanced AI assistant.
You are bilingual and can speak fluently in both English and Hindi (or a mix/Hinglish).
Adapt your response language to match the user's language.
If the user speaks Hindi, reply in Hindi (using Roman script or Devanagari as appropriate for speech synthesis responsiveness).
Keep your responses concise, natural, and conversational.
Do not use markdown.
Current user emotion: {emotion}
"""

@router.websocket("/voice-stream")
async def voice_stream(websocket: WebSocket):
    await websocket.accept()
    print("Voice stream connection established")
    
    # Store session state
    session = {
        "status": "idle",
        "language": "EN",
        "emotion": "Neutral",
        "history": [] # Persistent context for the session
    }
    
    try:
        while True:
            # Wait for message
            data = await websocket.receive_text()
            
            try:
                message = json.loads(data)
                msg_type = message.get("type")

                if msg_type == "start":
                    await websocket.send_json({"type": "info", "message": "Voice session active"})
                
                elif msg_type == "text_input":
                    text = message.get("text")
                    if text:
                        # Add user message to history
                        session["history"].append({"role": "user", "content": text})
                        
                        # Process response
                        await process_text_and_respond(websocket, text, session)
            
            except json.JSONDecodeError:
                print("Invalid JSON received")
                continue

    except WebSocketDisconnect:
        print("Client disconnected")
    except Exception as e:
        print(f"WebSocket Error: {e}")

async def process_text_and_respond(websocket: WebSocket, text: str, session: dict):
    # 1. Detect Intent & Add Context (Smart Voice)
    intent = detect_intent(text)
    print(f"Voice Intent Detected: {intent}")
    
    context = ""
    if intent == "search":
        await websocket.send_json({"type": "status", "status": "thinking"}) # Show thinking while searching
        try:
            # Run blocking search in thread
            search_summary = await asyncio.to_thread(perform_search, text, num_results=3)
            context = f"SEARCH RESULTS:\n{search_summary}\n\n"
        except Exception as e:
            print(f"Voice Search failed: {e}")

    # 2. Prepare Messages
    system_msg = SYSTEM_PROMPT.format(emotion=session["emotion"])
    if context:
        system_msg += f"\n\nCONTEXT:\n{context}\nUse this context to answer efficiently."

    messages = [{"role": "system", "content": system_msg}]
    messages.extend(session["history"][-6:]) # Keep context tight for speed

    # 3. Generate Response
    await websocket.send_json({"type": "status", "status": "speaking"})
    
    try:
        completion = await client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            max_tokens=200, # Keep voice responses concise
            temperature=0.7
        )
        
        response_text = completion.choices[0].message.content
        
        # Add to history
        session["history"].append({"role": "assistant", "content": response_text})
        
        # Send to frontend
        await websocket.send_json({
            "type": "transcript",
            "text": response_text,
            "language": "EN",
            "emotion": "Happy",
            "status": "listening" # Signal frontend to listen again after speaking
        })

    except Exception as e:
        print(f"LLM Error: {e}")
        await websocket.send_json({"type": "error", "message": "Thinking failed."})
