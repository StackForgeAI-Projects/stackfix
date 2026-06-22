import json
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor

from fastapi import FastAPI
from pydantic import BaseModel, Field

app = FastAPI(title="StackFix Translate", version="1.0.0")


class BatchRequest(BaseModel):
    texts: list[str] = Field(min_length=1, max_length=100)
    target: str = Field(min_length=2, max_length=5)
    source: str = "en"


def _translate_one(text: str, target: str, source: str) -> str:
    if not text.strip():
        return text
    try:
        params = urllib.parse.urlencode(
            {"client": "gtx", "sl": source, "tl": target, "dt": "t", "q": text}
        )
        req = urllib.request.Request(
            f"https://translate.googleapis.com/translate_a/single?{params}",
            headers={"User-Agent": "StackFix-Translate/1.0"},
        )
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode())
        parts = [seg[0] for seg in data[0] if seg and seg[0]]
        return "".join(parts) if parts else text
    except Exception:
        return text


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/batch")
def batch(req: BatchRequest):
    with ThreadPoolExecutor(max_workers=4) as pool:
        results = list(pool.map(lambda t: _translate_one(t, req.target, req.source), req.texts))
    return {"data": results}
