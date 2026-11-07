# RESEARCHGRAPH AI: TEST RESULTS & VERIFICATION LOG

**Test Execution Date**: November 7, 2026  
**Execution Environment**: Windows 11 · Python 3.13.2 · Next.js 14.2.35 · SQLite (aiosqlite)  
**Overall Result**: 100% TESTS PASSED  

---

## 1. BACKEND PYTEST SUITE (`pytest tests/test_api.py -v`)

```text
============================= test session starts =============================
platform win32 -- Python 3.13.2, pytest-9.2.0, pluggy-1.7.0 -- C:\Users\Palak\.gemini\antigravity\scratch\researchgraph-ai\backend\venv\Scripts\python.exe
cachedir: .pytest_cache
rootdir: C:\Users\Palak\.gemini\antigravity\scratch\researchgraph-ai\backend
plugins: anyio-4.16.0
collecting ... collected 18 items

tests/test_api.py::test_health_check PASSED                              [  5%]
tests/test_api.py::test_auth_register PASSED                             [ 11%]
tests/test_api.py::test_auth_login PASSED                                [ 16%]
tests/test_api.py::test_list_papers PASSED                               [ 22%]
tests/test_api.py::test_get_paper_by_id PASSED                           [ 27%]
tests/test_api.py::test_hybrid_search PASSED                             [ 33%]
tests/test_api.py::test_semantic_search PASSED                           [ 38%]
tests/test_api.py::test_search_autocomplete PASSED                       [ 44%]
tests/test_api.py::test_graph_explore PASSED                             [ 50%]
tests/test_api.py::test_gap_analysis PASSED                              [ 55%]
tests/test_api.py::test_novelty_auditor PASSED                           [ 61%]
tests/test_api.py::test_ai_assistant_ask PASSED                          [ 66%]
tests/test_api.py::test_literature_review_generator PASSED               [ 72%]
tests/test_api.py::test_paper_comparison PASSED                          [ 77%]
tests/test_api.py::test_analytics_and_trends PASSED                      [ 83%]
tests/test_api.py::test_collections_and_saved_papers PASSED              [ 88%]
tests/test_api.py::test_notifications_system PASSED                      [ 94%]
tests/test_api.py::test_external_ingestion_sync PASSED                   [100%]

============================= 18 passed in 5.69s ==============================
```

---

## 2. COMPREHENSIVE ENDPOINT VERIFICATION (`tests/suite_runner.py`)

```text
======================================================================
  RESEARCHGRAPH AI - COMPREHENSIVE ENDPOINT TEST SUITE
======================================================================

[1] Health & Infrastructure
  [PASS] Health Check: 200 (expected 200)
     graph_nodes=136, vector_ready=True

[2] Authentication - DB-backed
  [PASS] Register new user: 200 (expected 200)
     Got JWT: eyJhbGciOiJIUzI1NiIsInR5cCI6Ik...
  [PASS] Duplicate email rejected: 400 (expected 400)
  [PASS] Duplicate username rejected: 400 (expected 400)
  [PASS] Login with correct credentials: 200 (expected 200)
  [PASS] Login with wrong password -> 401: 401 (expected 401)
  [PASS] Get profile (authenticated): 200 (expected 200)
  [PASS] Collections without token -> 401: 401 (expected 401)
  [PASS] Saved papers without token -> 401: 401 (expected 401)

[3] Demo User Login
  [PASS] Login as demo user: 200 (expected 200)

[4] Papers Repository
  [PASS] List papers: 200 (expected 200)
  [PASS] Get single paper: 200 (expected 200)
  [PASS] Paper not found -> 404: 404 (expected 404)
  [PASS] Get related papers: 200 (expected 200)
  [PASS] Get paper citations (graph): 200 (expected 200)

[5] Search Engine
  [PASS] Hybrid search: 200 (expected 200)
     results=18, time=14.48ms
  [PASS] Semantic search: 200 (expected 200)
  [PASS] Autocomplete: 200 (expected 200)

[6] Knowledge Graph
  [PASS] Graph explore: 200 (expected 200)
     nodes=80, edges=78
  [PASS] Graph path (Dijkstra): 200 (expected 200)

[7] Research Gap Analysis (Dynamic EWRGS)
  [PASS] Gap analysis - AI: 200 (expected 200)
     gaps found: 10
     top gap: Application of Multi-Head Attention to GLUE Benchmark (score=0.3574)

[8] Novelty Auditor
  [PASS] Novelty analysis: 200 (expected 200)
     risk_score=0.276

[9] AI Research Assistant (RAG)
  [PASS] Ask assistant: 200 (expected 200)

[10] Literature Review Generator
  [PASS] Generate review: 200 (expected 200)

[11] Paper Comparison
  [PASS] Compare papers: 200 (expected 200)

[12] Analytics & Trends
  [PASS] Analytics dashboard: 200 (expected 200)
     total_papers=18, total_authors=49
  [PASS] Topic trends: 200 (expected 200)
  [PASS] Publication trends: 200 (expected 200)

[13] Collections - DB-backed, Multi-tenant
  [PASS] List collections: 200 (expected 200)
     collections: 3
  [PASS] Create collection: 200 (expected 200)
  [PASS] Add paper to collection: 200 (expected 200)

[14] Library - DB-backed, Multi-tenant
  [PASS] List saved papers: 200 (expected 200)
  [PASS] Save a paper: 200 (expected 200)
  [PASS] Update reading status: 200 (expected 200)

[15] Notifications - DB-backed
  [PASS] List notifications: 200 (expected 200)
     notifications: 3
  [PASS] Mark notification read: 200 (expected 200)
  [PASS] Mark all notifications read: 200 (expected 200)

[16] Academic Data Ingestion
  [PASS] Ingestion sync: 200 (expected 200)

======================================================================
  FINAL RESULTS SUMMARY
======================================================================

  TOTAL: 38  |  PASSED: 38  |  FAILED: 0  |  ERRORS: 0

  ALL TESTS PASSED [OK]
```

---

## 3. FRONTEND NEXT.JS ROUTE AUDIT

All 13 core Next.js App Router routes tested and responding with HTTP 200:
1. `/` -> 200 OK
2. `/dashboard` -> 200 OK
3. `/search` -> 200 OK
4. `/graph` -> 200 OK
5. `/gaps` -> 200 OK
6. `/novelty` -> 200 OK
7. `/assistant` -> 200 OK
8. `/review` -> 200 OK
9. `/analytics` -> 200 OK
10. `/library` -> 200 OK
11. `/compare` -> 200 OK
12. `/login` -> 200 OK
13. `/register` -> 200 OK

---

## 4. DATABASE RELATIONAL INVENTORY (`scripts/db_inventory.py`)

```text
Total relational tables: 20
---------------------------------------------
  authors                   :    39 rows
  collection_papers         :     6 rows
  collections               :     5 rows
  datasets                  :    21 rows
  extracted_claims          :     8 rows
  gap_evidence              :     0 rows
  limitations               :    16 rows
  methodologies             :    24 rows
  notifications             :     8 rows
  paper_authors             :    39 rows
  paper_datasets            :    22 rows
  paper_methods             :    24 rows
  paper_topics              :    32 rows
  papers                    :    28 rows
  research_gaps             :     0 rows
  saved_papers              :     4 rows
  search_history            :     0 rows
  topics                    :    32 rows
  user_notes                :     0 rows
  users                     :     6 rows
---------------------------------------------
Total persisted database records: 314
```
