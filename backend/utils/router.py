import re
from datetime import datetime

def detect_intent(message: str) -> str:
    """
    Detect the intent of the user message.
    PRIORITIZE SEARCH FOR ACCURACY.
    Returns: 'search', 'knowledge', 'coding', or 'conversational'.
    """
    message_lower = message.lower()
    
    # 1. CODING (Specific technical queries)
    coding_keywords = [
        "code", "python", "function", "bug", "error", "debug" 
        "java", "script", "html", "css", "api", "json", "sql",
        "react", "node", "param", "variable", "compile", "runtime"
    ]
    if any(keyword in message_lower for keyword in coding_keywords):
        return "coding"

    # 2. EXPLICIT SEARCH TRIGGERS (Strong signals for latest info)
    search_keywords = [
        "latest", "news", "today", "current", "price", 
        "what is happening", "update", "live", "weather",
        "who won", "score", "stock", "recent", "now",
        "this year", "this month", "yesterday", "last week",
        "2023", "2024", "2025", "2026", "new"
    ]
    if any(keyword in message_lower for keyword in search_keywords):
        return "search"

    # 3. KNOWLEDGE / FACTUAL (Broad informational queries)
    # If the user asks ANY question about the world, assume we need external info
    knowledge_starters = [
        "who", "what", "where", "when", "why", "how", 
        "tell me", "explain", "define", "show", "list"
    ]
    
    # Check if message starts with or contains these
    if any(s in message_lower for s in knowledge_starters):
        # We classify this as 'search' to force the system to check the web first
        # relying on the search service to decide if results are good.
        return "search" 

    # 4. CONVERSATIONAL (Greetings, small talk - FAST TRACK)
    # Check these FIRST to avoid unnecessary searching for simple hi/hello
    conversational_keywords = [
        "hi", "hello", "hey", "greetings", "good morning", "good evening",
        "how are you", "who are you", "what's up", "help", "thanks", "thank you",
        "bye", "goodbye", "stop", "exit", "quit"
    ]
    if any(message_lower.strip() == k or message_lower.startswith(k + " ") for k in conversational_keywords):
        return "conversational"

    # 5. CONVERSATIONAL (Fallback)
    return "conversational"
