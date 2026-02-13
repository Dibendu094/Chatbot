import wikipedia

def get_wiki_summary(query: str, sentences: int = 3) -> str:
    """
    Retrieve a summary from Wikipedia for the given query.
    """
    try:
        # Set language to English
        wikipedia.set_lang("en")
        
        # Search for the page first to avoid disambiguation errors if possible or act on search results
        search_results = wikipedia.search(query)
        
        if not search_results:
            return "No Wikipedia page found for this topic."
            
        # Get the summary of the first result
        page = wikipedia.page(search_results[0], auto_suggest=False)
        return page.summary[:1000] + "..." # Limit length
        
    except wikipedia.exceptions.DisambiguationError as e:
        options = e.options[:5]
        return f"Please be more specific. Your query '{query}' could refer to: {', '.join(options)}"
    except wikipedia.exceptions.PageError:
        return "Page not found on Wikipedia."
    except Exception as e:
        return f"Error accessing Wikipedia: {str(e)}"
