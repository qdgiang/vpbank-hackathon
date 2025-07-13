import json
import re
import requests
from bs4 import BeautifulSoup
import logging
from collections import deque
import urllib.parse as up
import os

logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(levelname)s - %(message)s',
                    datefmt='%Y-%m-%d %H:%M:%S',
                    handlers=[logging.StreamHandler()])

logger = logging.getLogger()
logger.setLevel(logging.INFO)

import sys
CUR_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, CUR_DIR)
from utils.helper_func import _clean_title, _norm, _get_html
from utils.s3_upload import upload_text

S3_BUCKET = os.environ.get("S3_BUCKET", "vpb-finserv-web")

# ----------- cấu hình regex -----------
ALLOW = re.compile(
    r"""
    ^https?://            # protocol
    (?:www\.)?vpbank\.com\.vn
    /ca-nhan/
    (?:vay|tiet-kiem|tai-khoan-thanh-toan|bao-hiem|dich-vu-ca-nhan)
    /                      # đúng một dấu slash trước tên trang con
    [^/?#]+               # tên trang con (không chứa /, ?, #)
    $                     # kết thúc chuỗi, không cho trailing slash
    """,
    re.IGNORECASE | re.VERBOSE
)
BLOCK = re.compile(r"\.(png|jpe?g|gif|svg|pdf|js|css)$", re.IGNORECASE)

def crawl_vpbank(base: str = "https://www.vpbank.com.vn/ca-nhan") -> list[str]:
    queue = deque([_norm(base)])
    visited_pg = set()   
    found_urls = set()   

    while queue:
        page_url = queue.popleft()
        if page_url in visited_pg:
            continue
        visited_pg.add(page_url)

        try:
            soup = BeautifulSoup(_get_html(page_url), "html.parser")
        except Exception as e:
            logger.warning(f"Cannot extract from {page_url}: {e}")
            continue

        # duyệt mọi <a>
        for a in soup.find_all("a", href=True):
            raw = up.urljoin(page_url, a["href"])
            url = _norm(raw)

            if BLOCK.search(url):
                continue

            if ALLOW.match(url):
                found_urls.add(url)
                if url not in visited_pg:
                    queue.append(url)
            else:
                if url.startswith("https://www.vpbank.com.vn/ca-nhan") and url not in visited_pg:
                    queue.append(url)

    return sorted(found_urls)

def _parse_details_page(html):
    """Parses the HTML of a detail page to extract the main title and content sections."""
    soup = BeautifulSoup(html, "html.parser")
    
    # Extract the main title from the masthead
    main_title_tag = soup.select_one("h2.masthead__content__title")
    main_title = main_title_tag.get_text(strip=True) if main_title_tag else "Untitled"

    # Extract content sections
    items = soup.select(".card-detail-content__body__item")
    sections = []
    for sec in items:
        if sec.get("id") == "rating":
            continue

        title_tag = sec.select_one(".title a")
        if not title_tag:
            continue
        title = title_tag.get_text(strip=True)

        if sec.get("id") == "faqs":
            faqs = []
            for card in sec.select(".basic-accordion__card"):
                q = card.select_one(".basic-accordion__card__header__text a")
                a = card.select_one(".basic-accordion__card__collapse__content")
                if q and a:
                    question = " ".join(q.get_text(" ", strip=True).split())
                    answer = " ".join(a.get_text(" ", strip=True).split())
                    faqs.append(f"{question}\n{answer}")
            if faqs:
                sections.append((title, "\n\n".join(faqs)))
            continue

        right = sec.select_one(".card-detail-content__body__item__right")
        if not right:
            continue
        
        raw = right.get_text(separator="\n", strip=True)
        content = re.sub(r"\n{2,}", "\n\n", raw)
        sections.append((title, content))

    return main_title, sections

def lambda_handler(event, context):
    """Main Lambda handler to crawl, parse, and return documents."""
    if not event:
        event = {}
    base_url = event.get("base_url", "https://www.vpbank.com.vn/ca-nhan")
    
    logger.info(f"Starting crawl with base URL: {base_url}")
    product_urls = crawl_vpbank(base_url)
    
    if not product_urls:
        logger.info("No matching product URLs found.")
        return {"statusCode": 200, "body": json.dumps([])}

    logger.info(f"Found {len(product_urls)} urls to process.")
    all_documents = []

    for url in product_urls:
        try:
            logger.info(f"Processing: {url}")
            response = requests.get(url, timeout=100)
            response.raise_for_status()
            
            main_title, sections = _parse_details_page(response.content)
            if not sections:
                logger.warning(f"No content sections found for {url}, skipping.")
                continue

            # Combine all sections into a single content string
            full_content = "\n\n".join([f"<SECTION> {title}\n{content}" for title, content in sections if content is not None])
            file_header = f"Source URL for reference: {url}\nTitle: {main_title}\n\n"
            full_content = file_header + full_content
            all_documents.append({"title": main_title, "content": full_content})

        except requests.RequestException as e:
            logger.error(f"Failed to fetch or process {url}: {e}")
        except Exception as e:
            logger.error(f"An unexpected error occurred while processing {url}: {e}")

    logger.info(f"Successfully parsed {len(all_documents)} documents.")
    
    # Upload to s3 bucket
    for doc in all_documents:
        title = doc["title"]
        content = doc["content"]
        key = _clean_title(title)
        upload_text(S3_BUCKET, key, content)
    logger.info(f"Finished uploading {len(all_documents)} documents.")

    return {
        "statusCode": 200,
        "body": json.dumps({"message": f"Uploaded all docs to S3 bucket: {S3_BUCKET}"}, ensure_ascii=False)
    }

# if __name__ == "__main__":
#     event = {
#         "base_url": "https://www.vpbank.com.vn/ca-nhan"
#     }
#     response = lambda_handler(event, None)
#     docs = response["body"]
#     docs = json.loads(docs)

#     OUTPUT_DIR = "./temp_file_store"
#     os.makedirs(OUTPUT_DIR, exist_ok=True)
    
#     for doc in docs:
#         title = doc["title"]
#         content = doc["content"]
#         file_name = _clean_title(title) + ".txt"
#         file_path = os.path.join(OUTPUT_DIR, file_name)
#         with open(file_path, "w", encoding="utf-8") as f:
#             f.write(content)
#         logger.info(f"Saved document: {file_path}")