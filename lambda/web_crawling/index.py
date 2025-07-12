import json
import re
import requests
from bs4 import BeautifulSoup

def extract_passages(html):
    soup = BeautifulSoup(html, "html.parser")
    items = soup.select(".card-detail-content__body__item")
    result = []

    for sec in items:
        # skip rating section
        if sec.get("id") == "rating":
            continue

        # section title
        title_tag = sec.select_one(".title a")
        if not title_tag:
            continue
        title = title_tag.get_text(strip=True)

        # handle FAQs specially
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
                result.append((title, "\n\n".join(faqs)))
            continue

        right = sec.select_one(".card-detail-content__body__item__right")
        if not right:
            continue
        
        raw = right.get_text(separator="\n", strip=True)
        content = re.sub(r"\n{2,}", "\n\n", raw)
        result.append((title, content))

    return result

def lambda_handler(event, context):
    url = event.get("url")
    if not url:
        return {"statusCode": 400, "body": "Missing 'url' in event"}

    try:
        resp = requests.get(url, timeout=10)
        resp.raise_for_status()
    except Exception as e:
        return {
            "statusCode": 502,
            "body": f"Error fetching {url}: {e}"
        }

    soup = BeautifulSoup(resp.text, "html.parser")
    if not soup.select_one("section.card-detail-content"):
        return {"statusCode": 204, "body": ""}

    passages = extract_passages(resp.text)

    # add source URL for reference
    final_page_content = f"Source URL: {url}\n\n"

    for title, content in passages:
        final_page_content += f"{title}:\n{content}\n\n"

    return {
        "statusCode": 200,
        "body": final_page_content.strip()
    }

# if __name__ == "__main__":
#     test_event = {
#         "url": "https://www.vpbank.com.vn/ca-nhan/vay/tin-chap-giao-vien"
#     }
#     response = lambda_handler(test_event, None)
#     print(json.dumps(response, indent=2, ensure_ascii=False))
