from urllib.parse import urlparse


class BrowserToolService:
    ALLOWED_HOSTS = {
        "www.google.com",
        "google.com",
        "www.youtube.com",
        "youtube.com",
        "www.wikipedia.org",
        "wikipedia.org",
    }

    @staticmethod
    def validate_url(url: str | None) -> dict[str, object]:
        if not url:
            return {"allowed": False, "reason": "A URL is required.", "url": None}

        parsed = urlparse(url)
        if parsed.scheme not in {"http", "https"}:
            return {"allowed": False, "reason": "Only http/https URLs are allowed.", "url": url}

        hostname = (parsed.netloc or parsed.path).lower()
        if hostname.startswith("www."):
            hostname = hostname[4:]

        is_allowed = hostname in BrowserToolService.ALLOWED_HOSTS
        return {
            "allowed": is_allowed,
            "reason": "Allowed hosts are restricted to a small whitelist." if is_allowed else "URL host is not in the backend allowlist.",
            "url": url,
            "host": hostname,
        }
