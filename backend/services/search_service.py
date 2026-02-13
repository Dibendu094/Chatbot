import os
from dotenv import load_dotenv

try:
    from serpapi import GoogleSearch
except ImportError:
    GoogleSearch = None

try:
    from duckduckgo_search import DDGS
except ImportError:
    DDGS = None

load_dotenv()

serp_api_key = os.getenv("SERPAPI_API_KEY")

def perform_search(query: str, num_results: int = 5) -> str:
    """
    Perform a web search using SerpAPI (Google) or fallback to DuckDuckGo.
    Returns a formatted summary string.
    """
    
    # 1. Try SerpAPI if Key Exists
    if serp_api_key and GoogleSearch:
        try:
            print(f"Searching via SerpAPI: {query}")
            params = {
                "engine": "google",
                "q": query,
                "api_key": serp_api_key,
                "num": num_results
            }
            search = GoogleSearch(params)
            results = search.get_dict()
            organic_results = results.get("organic_results", [])

            if organic_results:
                summary = ""
                for i, result in enumerate(organic_results):
                    title = result.get("title", "No Title")
                    link = result.get("link", "#")
                    snippet = result.get("snippet", "No description available.")
                    summary += f"{i+1}. **{title}**\n   - {snippet}\n   - [Link]({link})\n\n"
                return summary
        except Exception as e:
            print(f"SerpAPI failed: {e}. Falling back...")

    # 2. Fallback to DuckDuckGo (Free, No Key)
    if DDGS:
        try:
            print(f"Searching via DuckDuckGo: {query}")
            with DDGS() as ddgs:
                results = list(ddgs.text(query, max_results=num_results))
                
            if results:
                summary = ""
                for i, result in enumerate(results):
                    title = result.get("title", "No Title")
                    link = result.get("href", "#")
                    snippet = result.get("body", "No description available.")
                    summary += f"{i+1}. **{title}**\n   - {snippet}\n   - [Link]({link})\n\n"
                return summary
            else:
                return "No relevant search results found via DuckDuckGo."
                
        except Exception as e:
            print(f"DuckDuckGo search failed: {e}")
            return f"Search failed: {str(e)}"

    return "Search functionality unavailable. Please install 'duckduckgo-search' or configure SERPAPI_API_KEY."
