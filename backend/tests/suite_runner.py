"""Comprehensive API test suite for ResearchGraph AI."""
import httpx
import json
import sys

BASE = "http://127.0.0.1:8000/api"
TOKEN = None
RESULTS = []

def test(name, method, url, expected_status=200, json_body=None, headers=None, params=None):
    global TOKEN
    h = headers or {}
    if TOKEN:
        h["Authorization"] = f"Bearer {TOKEN}"
    try:
        if method == "GET":
            r = httpx.get(url, headers=h, params=params, timeout=15)
        elif method == "POST":
            r = httpx.post(url, headers=h, json=json_body, params=params, timeout=15)
        elif method == "DELETE":
            r = httpx.delete(url, headers=h, timeout=15)
        else:
            r = httpx.get(url, headers=h, timeout=15)
        
        status = "PASS" if r.status_code == expected_status else "FAIL"
        detail = r.text[:200] if status == "FAIL" else ""
        RESULTS.append((name, status, r.status_code, expected_status, detail))
        print(f"  {'[PASS]' if status == 'PASS' else '[FAIL]'} {name}: {r.status_code} (expected {expected_status})")
        return r
    except Exception as e:
        RESULTS.append((name, "ERROR", 0, expected_status, str(e)[:200]))
        print(f"  [ERR] {name}: ERROR - {e}")
        return None

print("=" * 70)
print("  RESEARCHGRAPH AI — COMPREHENSIVE ENDPOINT TEST SUITE")
print("=" * 70)

# 1. Health
print("\n[1] Health & Infrastructure")
r = test("Health Check", "GET", f"{BASE}/health")
if r:
    data = r.json()
    print(f"     graph_nodes={data.get('graph_nodes')}, vector_ready={data.get('vector_engine_ready')}")

import uuid
test_username = f"usr_{uuid.uuid4().hex[:6]}"
test_email = f"{test_username}@example.com"

# 2. Auth: Register new user
print("\n[2] Authentication - DB-backed")
r = test("Register new user", "POST", f"{BASE}/auth/register", json_body={
    "email": test_email,
    "username": test_username,
    "password": "SecurePass123!",
    "full_name": "Test Researcher"
})
if r and r.status_code == 200:
    TOKEN = r.json()["access_token"]
    print(f"     Got JWT: {TOKEN[:30]}...")

# Duplicate registration should fail
test("Duplicate email rejected", "POST", f"{BASE}/auth/register", expected_status=400, json_body={
    "email": test_email,
    "username": f"{test_username}_alt",
    "password": "AnotherPass"
})

test("Duplicate username rejected", "POST", f"{BASE}/auth/register", expected_status=400, json_body={
    "email": f"alt_{test_email}",
    "username": test_username,
    "password": "AnotherPass"
})

# Login
r = test("Login with correct credentials", "POST", f"{BASE}/auth/login", json_body={
    "username": test_username,
    "password": "SecurePass123!"
})
if r and r.status_code == 200:
    TOKEN = r.json()["access_token"]

test("Login with wrong password -> 401", "POST", f"{BASE}/auth/login", expected_status=401, json_body={
    "username": test_username,
    "password": "WrongPassword"
})

# Auth/me
test("Get profile (authenticated)", "GET", f"{BASE}/auth/me")

# No-token access to protected endpoints
old_token = TOKEN
TOKEN = None
test("Collections without token -> 401", "GET", f"{BASE}/collections", expected_status=401)
test("Saved papers without token -> 401", "GET", f"{BASE}/library/saved", expected_status=401)
TOKEN = old_token

# 3. Demo user login
print("\n[3] Demo User Login")
r = test("Login as demo user", "POST", f"{BASE}/auth/login", json_body={
    "username": "demo",
    "password": "demo123"
})
if r and r.status_code == 200:
    TOKEN = r.json()["access_token"]

# 4. Papers
print("\n[4] Papers Repository")
test("List papers", "GET", f"{BASE}/papers")
test("Get single paper", "GET", f"{BASE}/papers/paper_vaswani2017")
test("Paper not found -> 404", "GET", f"{BASE}/papers/nonexistent_paper", expected_status=404)
test("Get related papers", "GET", f"{BASE}/papers/paper_devlin2019/related")
test("Get paper citations (graph)", "GET", f"{BASE}/papers/paper_vaswani2017/citations")

# 5. Search
print("\n[5] Search Engine")
r = test("Hybrid search", "POST", f"{BASE}/search/hybrid", json_body={"query": "transformer attention mechanism"})
if r and r.status_code == 200:
    data = r.json()
    print(f"     results={data.get('total')}, time={data.get('execution_time_ms')}ms")

test("Semantic search", "POST", f"{BASE}/search/semantic", json_body={"query": "graph neural networks"})
test("Autocomplete", "GET", f"{BASE}/search/autocomplete", params={"q": "att"})

# 6. Graph
print("\n[6] Knowledge Graph")
r = test("Graph explore", "GET", f"{BASE}/graph/explore")
if r and r.status_code == 200:
    data = r.json()
    print(f"     nodes={len(data.get('nodes', []))}, edges={len(data.get('edges', []))}")

test("Graph path", "GET", f"{BASE}/graph/path", params={"source": "paper_vaswani2017", "target": "paper_devlin2019"})

# 7. Gap Analysis
print("\n[7] Research Gap Analysis (Dynamic EWRGS)")
r = test("Gap analysis — AI", "POST", f"{BASE}/gaps/analyze", params={"domain": "Artificial Intelligence"})
if r and r.status_code == 200:
    gaps = r.json()
    print(f"     gaps found: {len(gaps)}")
    if gaps:
        print(f"     top gap: {gaps[0].get('title', 'N/A')} (score={gaps[0].get('ewrgs_score', 'N/A')})")

# 8. Novelty Auditor
print("\n[8] Novelty Auditor")
r = test("Novelty analysis", "POST", f"{BASE}/novelty/analyze", json_body={
    "abstract": "We propose a novel hybrid attention mechanism for clinical NLP using graph-augmented transformers.",
    "proposed_method": "Graph-Augmented Cross-Attention",
    "proposed_dataset": "MIMIC-III"
})
if r and r.status_code == 200:
    data = r.json()
    print(f"     risk_score={data.get('overall_novelty_risk_score')}")

# 9. AI Assistant
print("\n[9] AI Research Assistant (RAG)")
r = test("Ask assistant", "POST", f"{BASE}/assistant/ask", json_body={
    "question": "What is the main contribution of BERT?",
    "paper_ids": ["paper_devlin2019"]
})

# 10. Literature Review
print("\n[10] Literature Review Generator")
r = test("Generate review", "POST", f"{BASE}/reviews/generate", json_body={
    "paper_ids": ["paper_vaswani2017", "paper_devlin2019", "paper_lewis2020"],
    "citation_style": "IEEE"
})

# 11. Paper Comparison
print("\n[11] Paper Comparison")
r = test("Compare papers", "POST", f"{BASE}/papers/compare", json_body={
    "paper_ids": ["paper_vaswani2017", "paper_devlin2019", "paper_lewis2020"]
})

# 12. Analytics
print("\n[12] Analytics & Trends")
r = test("Analytics dashboard", "GET", f"{BASE}/analytics")
if r and r.status_code == 200:
    data = r.json()
    print(f"     total_papers={data.get('total_indexed_papers')}, total_authors={data.get('total_authors')}")

test("Topic trends", "GET", f"{BASE}/trends/topics")
test("Publication trends", "GET", f"{BASE}/trends/publications")

# 13. Collections (DB-backed)
print("\n[13] Collections — DB-backed, Multi-tenant")
r = test("List collections", "GET", f"{BASE}/collections")
if r and r.status_code == 200:
    print(f"     collections: {len(r.json())}")

r = test("Create collection", "POST", f"{BASE}/collections", json_body={
    "name": "Test Collection",
    "description": "Automated test collection",
    "color": "#ff6600"
})
if r and r.status_code == 200:
    col_id = r.json()["id"]
    test("Add paper to collection", "POST", f"{BASE}/collections/{col_id}/papers", params={"paper_id": "paper_vaswani2017"})

# 14. Library (DB-backed)
print("\n[14] Library — DB-backed, Multi-tenant")
test("List saved papers", "GET", f"{BASE}/library/saved")
test("Save a paper", "POST", f"{BASE}/library/save", params={"paper_id": "paper_kipf2017", "status": "to_read"})
test("Update reading status", "POST", f"{BASE}/library/save", params={"paper_id": "paper_kipf2017", "status": "reading"})

# 15. Notifications (DB-backed)
print("\n[15] Notifications — DB-backed")
r = test("List notifications", "GET", f"{BASE}/notifications")
if r and r.status_code == 200:
    notifs = r.json()
    print(f"     notifications: {len(notifs)}")
    if notifs:
        notif_id = notifs[0]["id"]
        test("Mark notification read", "POST", f"{BASE}/notifications/{notif_id}/read")

test("Mark all notifications read", "POST", f"{BASE}/notifications/read-all")

# 16. Ingestion
print("\n[16] Academic Data Ingestion")
test("Ingestion sync", "POST", f"{BASE}/ingestion/sync", params={"query": "transformer"})

# Summary
print("\n" + "=" * 70)
print("  FINAL RESULTS SUMMARY")
print("=" * 70)
passed = sum(1 for _, s, _, _, _ in RESULTS if s == "PASS")
failed = sum(1 for _, s, _, _, _ in RESULTS if s == "FAIL")
errors = sum(1 for _, s, _, _, _ in RESULTS if s == "ERROR")
print(f"\n  TOTAL: {len(RESULTS)}  |  PASSED: {passed}  |  FAILED: {failed}  |  ERRORS: {errors}")
print()

if failed or errors:
    print("  FAILED TESTS:")
    for name, status, got, exp, detail in RESULTS:
        if status != "PASS":
            print(f"    [FAIL] {name}: got {got}, expected {exp}  {detail}")
    sys.exit(1)
else:
    print("  ALL TESTS PASSED [OK]")
    sys.exit(0)
