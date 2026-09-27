from urllib.parse import quote_plus


class WebSearchToolService:
    @staticmethod
    def search(query: str | None) -> dict[str, str | None]:
        if not query:
            return {"query": None, "url": None, "status": "missing_query"}
        encoded = quote_plus(query)
        return {
            "query": query,
            "url": f"https://www.google.com/search?q={encoded}",
            "status": "ready_for_backend_integration",
        }

    @staticmethod
    def youtube_search(query: str | None) -> dict[str, str | None]:
        if not query:
            return {"query": None, "url": None, "status": "missing_query"}
        encoded = quote_plus(query)
        return {
            "query": query,
            "url": f"https://www.youtube.com/results?search_query={encoded}",
            "status": "ready_for_backend_integration",
        }
