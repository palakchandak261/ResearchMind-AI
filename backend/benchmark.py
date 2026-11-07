import time
import requests

endpoints = [
    ("GET", "/api/health", None),
    ("GET", "/api/papers", None),
    ("GET", "/api/papers/paper_vaswani2017", None),
    ("POST", "/api/search/hybrid", {"query": "transformer attention", "limit": 10}),
    ("POST", "/api/search/semantic", {"query": "deep learning representations", "limit": 10}),
    ("GET", "/api/graph/explore?limit=50", None),
    ("POST", "/api/gaps/analyze?domain=Artificial+Intelligence", None),
    ("POST", "/api/novelty/analyze", {"abstract": "We explore low-rank adaptations in vision transformers.", "proposed_method": "LoRA"}),
    ("POST", "/api/assistant/ask", {"question": "How does self-attention work?", "paper_ids": ["paper_vaswani2017"]}),
    ("POST", "/api/reviews/generate", {"paper_ids": ["paper_vaswani2017", "paper_devlin2019"], "citation_style": "IEEE"}),
    ("POST", "/api/papers/compare", {"paper_ids": ["paper_vaswani2017", "paper_devlin2019"]}),
    ("GET", "/api/analytics", None),
]

base = "http://127.0.0.1:8000"
print(f"{'METHOD':<6} {'ENDPOINT':<45} {'STATUS':<6} {'LATENCY':<10}")
print("-" * 72)
for method, ep, payload in endpoints:
    t0 = time.perf_counter()
    if method == "GET":
        r = requests.get(base + ep)
    else:
        r = requests.post(base + ep, json=payload if payload else {})
    lat = (time.perf_counter() - t0) * 1000
    print(f"{method:<6} {ep:<45} {r.status_code:<6} {lat:8.2f} ms")
