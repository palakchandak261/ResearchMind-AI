import pytest
import httpx

BASE_URL = "http://127.0.0.1:8000"

@pytest.fixture(scope="module")
def client():
    with httpx.Client(base_url=BASE_URL, timeout=30.0) as client:
        yield client

def test_health_check(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["graph_nodes"] > 0
    assert data["vector_engine_ready"] is True

import uuid

def test_auth_register(client):
    uid = uuid.uuid4().hex[:6]
    payload = {
        "email": f"researcher_{uid}@example.com",
        "username": f"user_{uid}",
        "password": "secure_password_123",
        "full_name": "Test Researcher"
    }
    response = client.post("/api/auth/register", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["username"] == f"user_{uid}"

    # Verify duplicate registration is rejected with 400
    dup_resp = client.post("/api/auth/register", json=payload)
    assert dup_resp.status_code == 400

def test_auth_login(client):
    # Test demo user login
    payload = {
        "username": "demo",
        "password": "demo123"
    }
    response = client.post("/api/auth/login", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

    # Test invalid password rejection
    bad_resp = client.post("/api/auth/login", json={"username": "demo", "password": "wrongpassword"})
    assert bad_resp.status_code == 401

def test_list_papers(client):
    response = client.get("/api/papers?limit=10")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    first_paper = data[0]
    assert "id" in first_paper
    assert "title" in first_paper
    assert "citation_count" in first_paper

def test_get_paper_by_id(client):
    # Test landmark Vaswani paper
    response = client.get("/api/papers/paper_vaswani2017")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == "paper_vaswani2017"
    assert "Attention Is All You Need" in data["title"]
    assert len(data["authors"]) > 0

def test_hybrid_search(client):
    payload = {
        "query": "transformer attention mechanism",
        "limit": 5,
        "search_type": "hybrid"
    }
    response = client.post("/api/search/hybrid", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "results" in data
    assert len(data["results"]) > 0
    assert data["total"] > 0
    assert "query_expansion" in data

def test_semantic_search(client):
    payload = {
        "query": "pre-trained language representations bidirectional encoder",
        "limit": 5,
        "search_type": "semantic"
    }
    response = client.post("/api/search/semantic", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "results" in data
    assert len(data["results"]) > 0

def test_search_autocomplete(client):
    response = client.get("/api/search/autocomplete?q=att")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)

def test_graph_explore(client):
    response = client.get("/api/graph/explore?limit=40")
    assert response.status_code == 200
    data = response.json()
    assert "nodes" in data
    assert "edges" in data
    assert len(data["nodes"]) > 0
    assert len(data["edges"]) > 0

def test_gap_analysis(client):
    response = client.post("/api/gaps/analyze?domain=Artificial+Intelligence")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    first_gap = data[0]
    assert "ewrgs_score" in first_gap
    assert "supporting_papers" in first_gap
    assert "future_directions" in first_gap

def test_novelty_auditor(client):
    payload = {
        "abstract": "We explore parameter-efficient fine-tuning with low rank adaptation for multimodal biomedical reasoning.",
        "proposed_method": "Low-Rank Adaptation with sparse cross-attention",
        "proposed_dataset": "MIMIC-III and PubMedQA",
        "expected_contribution": "Drastically reduced memory footprints during domain adaptation."
    }
    response = client.post("/api/novelty/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "overall_novelty_risk_score" in data
    assert "problem_overlap_score" in data
    assert "methodology_overlap_score" in data
    assert "similar_papers" in data
    assert "disclaimer" in data

def test_ai_assistant_ask(client):
    payload = {
        "question": "What is the Transformer architecture and how does self-attention work?",
        "paper_ids": ["paper_vaswani2017"]
    }
    response = client.post("/api/assistant/ask", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "answer" in data
    assert len(data["answer"]) > 0
    assert "citations" in data
    assert "confidence" in data

def test_literature_review_generator(client):
    payload = {
        "paper_ids": ["paper_vaswani2017", "paper_devlin2019"],
        "topic": "Transformers and Pre-trained Representations",
        "citation_style": "IEEE"
    }
    response = client.post("/api/reviews/generate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "title" in data
    assert "abstract" in data
    assert "sections" in data
    assert len(data["sections"]) > 0
    assert "bibliography" in data
    assert "human_review_notice" in data

def test_paper_comparison(client):
    payload = {
        "paper_ids": ["paper_vaswani2017", "paper_devlin2019", "paper_lewis2020"]
    }
    response = client.post("/api/papers/compare", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "headers" in data
    assert "matrix" in data
    assert len(data["headers"]) == 4 # Dimension + 3 papers
    assert "methodology_comparison" in data
    assert "dataset_comparison" in data

def test_analytics_and_trends(client):
    response = client.get("/api/analytics")
    assert response.status_code == 200
    data = response.json()
    assert data["total_indexed_papers"] > 0
    assert data["total_authors"] > 0
    assert "top_topics" in data
    assert "top_methodologies" in data
    assert "publication_year_distribution" in data

def test_collections_and_saved_papers(client):
    # 1. Verify unauthenticated access returns 401
    unauth_resp = client.get("/api/collections")
    assert unauth_resp.status_code == 401

    # 2. Login as demo user
    login_resp = client.post("/api/auth/login", json={"username": "demo", "password": "demo123"})
    assert login_resp.status_code == 200
    token = login_resp.json()["access_token"]
    auth_headers = {"Authorization": f"Bearer {token}"}

    # 3. Authenticated collections list
    response = client.get("/api/collections", headers=auth_headers)
    assert response.status_code == 200
    collections = response.json()
    assert isinstance(collections, list)
    assert len(collections) > 0

    # 4. Authenticated saved papers list
    saved_resp = client.get("/api/library/saved", headers=auth_headers)
    assert saved_resp.status_code == 200
    saved = saved_resp.json()
    assert isinstance(saved, list)

def test_notifications_system(client):
    login_resp = client.post("/api/auth/login", json={"username": "demo", "password": "demo123"})
    token = login_resp.json()["access_token"]
    auth_headers = {"Authorization": f"Bearer {token}"}

    notif_resp = client.get("/api/notifications", headers=auth_headers)
    assert notif_resp.status_code == 200
    notifs = notif_resp.json()
    assert isinstance(notifs, list)
    assert len(notifs) > 0

    read_all = client.post("/api/notifications/read-all", headers=auth_headers)
    assert read_all.status_code == 200

def test_external_ingestion_sync(client):
    resp = client.post("/api/ingestion/sync", params={"query": "neural network"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] in ["synced", "no_results"]

