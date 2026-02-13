import os
from typing import List, Dict, Generator
from groq import Groq
from dotenv import load_dotenv

load_dotenv(override=True)

api_key = os.getenv("GROQ_API_KEY")
print(f"DEBUG: Loaded API Key: {api_key[:10] if api_key else 'None'}...")
client = Groq(api_key=api_key)

def generate_chat_response(messages: List[Dict[str, str]], model: str = "llama-3.3-70b-versatile") -> str:
    """
    Generate a complete chat response using Groq API.
    """
    try:
        completion = client.chat.completions.create(
            messages=messages,
            model=model,
        )
        return completion.choices[0].message.content
    except Exception as e:
        error_msg = str(e)
        print(f"Error calling Groq API: {error_msg}")
        if "401" in error_msg:
            return "❌ **Error: Invalid API Key.**\n\nPlease check your `GROQ_API_KEY` in `backend/.env`. It seems correct but Groq is rejecting it (401 Unauthorized)."
        if "400" in error_msg and "model" in error_msg.lower():
             return f"⚠️ **Model Error**: The selected AI model `{model}` might be decommissioned or unavailable. Please update `groq_service.py` with a valid model."
        return f"⚠️ **API Error**: {error_msg}"

def generate_streaming_response(messages: List[Dict[str, str]], model: str = "llama-3.3-70b-versatile") -> Generator:
    """
    Generate a streaming chat response using Groq API.
    """
    stream = client.chat.completions.create(
        messages=messages,
        model=model,
        stream=True,
    )
    for chunk in stream:
        delta = chunk.choices[0].delta.content
        if delta:
            yield delta
