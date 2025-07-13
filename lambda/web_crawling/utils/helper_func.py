import requests
import urllib.parse as up

def _clean_title(title: str) -> str:
    return title.replace(" ", "_").replace("/", "_").replace("|", "").replace("$", "").replace("?", "").replace("*", "").replace("\\", "").replace("%", "")

def _norm(url: str) -> str:
    """Bỏ query, fragment, chuẩn hóa https / trailing slash"""
    p = up.urlparse(url)
    scheme = "https"
    path = p.path.rstrip("/") + ("/" if p.path.count("/") > 2 and not p.path.endswith("/") else "")
    return up.urlunparse((scheme, p.netloc, path, "", "", ""))

def _get_html(url: str) -> str:
    return requests.get(url, timeout=60).text