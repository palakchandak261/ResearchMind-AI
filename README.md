# ResearchGraph AI

> **AI-Powered Research Discovery, Intelligence and Research Gap Identification Platform**  
> *Discover Connections. Understand Research. Find What's Missing.*

---

## 🔬 System Overview & Architecture

ResearchGraph AI is an enterprise-grade academic research intelligence platform designed for researchers, faculty, research institutes, and students. Unlike traditional bibliographic keyword searches, ResearchGraph AI structures scholarly literature into an interactive, multi-relational knowledge network with algorithmic gap identification, proposal novelty auditing, and passage-grounded question answering.

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                             NEXT.JS 14 FRONTEND                             │
│  React 18 · TypeScript · Tailwind CSS · React Flow · Recharts · Lucide UI   │
│                                                                             │
│  [ Landing ] ── [ Dashboard ] ── [ Search ] ── [ Graph Explorer ]          │
│  [ Gap Analysis (EWRGS) ] ── [ Novelty Auditor ] ── [ AI Assistant ]        │
│  [ Literature Review ] ── [ Paper Comparison ] ── [ Analytics ] ── [ Library]│
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ REST / JSON (Next.js Rewrites)
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          FASTAPI BACKEND ENGINE                             │
│  Python 3.13 · SQLAlchemy (Async) · NetworkX · Scikit-Learn · NumPy · SciPy │
├──────────────────────────────────────┬──────────────────────────────────────┤
│ CORE KNOWLEDGE ALGORITHMS            │ AI & EMPIRICAL AUDITING ENGINES      │
│ • Okapi BM25 Lexical Index           │ • Semantic Vector Engine (TF-IDF/RP) │
│ • Autocomplete Prefix Trie           │ • Contradiction Detector (NLI)       │
│ • Knowledge Graph (BFS/Dijkstra/PR)  │ • Multi-Dimensional Novelty Auditor  │
│ • EWRGS Gap Discovery Engine         │ • Source-Grounded RAG Assistant      │
│ • Min-Heap Relevance Ranker          │ • Literature Review Synthesizer      │
├──────────────────────────────────────┴──────────────────────────────────────┤
│ PERSISTENT DATA LAYER                                                       │
│ • SQLite (Async via aiosqlite for zero-dependency standalone local dev)     │
│ • Optional Production Connectors: PostgreSQL · Qdrant · Neo4j · Redis       │
│ • Ingestion Connectors: OpenAlex API · arXiv · Semantic Scholar             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🌟 Key Features

| Module | Description | Implementation Highlight |
|---|---|---|
| **Semantic & Hybrid Search** | Natural language, boolean, and hybrid retrieval with query expansion. | Reciprocal Rank Fusion (RRF) combining Okapi BM25 and cosine vector similarity. |
| **Interactive Graph Explorer** | Visualizes papers, authors, methodologies, datasets, and citation networks. | Interactive React Flow canvas with BFS neighborhood expansion and Dijkstra shortest path reasoning. |
| **EWRGS Gap Analysis** | Discovers underexplored intersections across problems, methods, and datasets. | Multi-factor mathematical scoring: Underexploration, Trend, Diversity Deficit, Limitations, and Contradictions. |
| **Novelty Auditor** | Evaluates proposed abstracts or methodology combinations against indexed works. | Overlap radar across problem, method, and dataset dimensions with actionable research recommendations. |
| **AI Research Assistant** | Answers specific scientific questions grounded in paper passages. | BM25 passage chunking, inline citations, section traceability, and anti-hallucination guardrails. |
| **Literature Review Generator** | Synthesizes comparative literature reviews across multiple selected papers. | Structured synthesis across 6 sections with IEEE, APA, and BibTeX citation formatting. |
| **Paper Comparison Matrix** | Multi-paper structured side-by-side comparison (2–10 papers). | Dimension extraction: objectives, algorithms, benchmarks, metrics, conflicting findings, and code availability. |
| **Analytics & Trends** | Interactive charts tracking topic velocity and research momentum. | Recharts line and bar graphs visualizing publication trends, top methods, and emerging topics. |
| **Personal Library** | Manages reading lists and custom research collections. | Reading status tracking (`to_read`, `reading`, `completed`) with custom collections. |

---

## 📐 Mathematical Formulation: EWRGS

The **Evidence-Weighted Research Gap Score (EWRGS)** is formulated to objectively measure the viability and promise of an unexplored intersection:

$$\text{EWRGS} = w_1 \cdot U + w_2 \cdot T + w_3 \cdot D + w_4 \cdot L + w_5 \cdot C$$

Where:
- **$U$ (Normalized Underexploration)**: $1 - \frac{|\mathcal{P}_{\text{joint}}|}{\min(|\mathcal{P}_{\text{method}}|, |\mathcal{P}_{\text{dataset}}|) + 1}$
- **$T$ (Topic Growth Trend Velocity)**: $\frac{|\mathcal{P}_{\text{recent}}| - |\mathcal{P}_{\text{historical}}|}{|\mathcal{P}_{\text{recent}}| + |\mathcal{P}_{\text{historical}}| + 1}$
- **$D$ (Methodological Diversity Deficit)**: Normalized Simpson Diversity Deficit $1 - \sum p_i^2$
- **$L$ (Reported Limitation Density)**: Empirical concentration of limitations citing the target domain
- **$C$ (Empirical Conflict Level)**: Proportion of conflicting findings detected via context-aware NLI
- **Default Weights**: $w_1 = 0.30, w_2 = 0.20, w_3 = 0.20, w_4 = 0.15, w_5 = 0.15$

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **UI / Styling**: React 18, Tailwind CSS, Lucide React Icons
- **Network Visualizations**: React Flow (`reactflow`), D3.js
- **Charts & Metrics**: Recharts
- **State & Data Fetching**: TanStack Query (`@tanstack/react-query`)

### Backend
- **Framework**: FastAPI (Python 3.13)
- **Database Engine**: SQLAlchemy 2.0 (Async) + `aiosqlite`
- **Algorithmic Graph Engine**: NetworkX
- **Scientific Computing & Vector Search**: Scikit-Learn, NumPy, SciPy
- **Authentication**: JWT (python-jose) + bcrypt password hashing

---

## 🚀 Quickstart Guide

### Option 1: Standalone Local Setup (Recommended for Development)

Both frontend and backend are configured for zero-dependency execution out of the box using SQLite and in-memory algorithmic indices.

#### 1. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start backend server (starts at http://127.0.0.1:8000)
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

#### 2. Frontend Setup
```bash
# In a new terminal, navigate to frontend directory
cd frontend

# Install dependencies (if not already installed)
npm install

# Start Next.js development server
npm run dev
```

Visit **`http://localhost:3000`** in your browser.

---

### Option 2: Docker Compose Setup

Run the full stack containerized with a single command:

```bash
docker compose up --build
```

- **Frontend**: `http://localhost:3000`
- **Backend API**: `http://localhost:8000`
- **Interactive Swagger Docs**: `http://localhost:8000/docs`

---

## 🧪 Testing & Verification

The test suite validates all API routes, algorithms, and models:

```bash
# Run backend pytest suite (16 tests)
cd backend
.\venv\Scripts\python -m pytest tests/ -v
```

Expected output:
```text
tests/test_api.py::test_health_check PASSED                              [  6%]
tests/test_api.py::test_auth_register PASSED                             [ 12%]
tests/test_api.py::test_auth_login PASSED                                [ 18%]
tests/test_api.py::test_list_papers PASSED                               [ 25%]
tests/test_api.py::test_get_paper_by_id PASSED                           [ 31%]
tests/test_api.py::test_hybrid_search PASSED                             [ 37%]
tests/test_api.py::test_semantic_search PASSED                           [ 43%]
tests/test_api.py::test_search_autocomplete PASSED                       [ 50%]
tests/test_api.py::test_graph_explore PASSED                             [ 56%]
tests/test_api.py::test_gap_analysis PASSED                              [ 62%]
tests/test_api.py::test_novelty_auditor PASSED                           [ 68%]
tests/test_api.py::test_ai_assistant_ask PASSED                          [ 75%]
tests/test_api.py::test_literature_review_generator PASSED               [ 81%]
tests/test_api.py::test_paper_comparison PASSED                          [ 87%]
tests/test_api.py::test_analytics_and_trends PASSED                      [ 93%]
tests/test_api.py::test_collections_and_saved_papers PASSED              [100%]
============================= 16 passed in 0.76s ==============================
```

To verify the Next.js production build:
```bash
cd frontend
npm run build
```

---

## 📚 API Endpoints Summary

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | System health, graph size, and vector engine status |
| `POST` | `/api/auth/register` | Register a new user |
| `POST` | `/api/auth/login` | Login and receive bearer token |
| `GET` | `/api/papers` | Paginated listing of indexed papers |
| `GET` | `/api/papers/{id}` | Comprehensive details, citations, extractions |
| `POST` | `/api/search/hybrid` | Combined lexical (BM25) and semantic vector search |
| `POST` | `/api/search/semantic` | Pure dense semantic vector retrieval |
| `GET` | `/api/search/autocomplete` | Prefix-trie search autocomplete |
| `GET` | `/api/graph/explore` | Subgraph retrieval with node/edge filtering |
| `POST` | `/api/gaps/analyze` | EWRGS candidate gap scoring and evidence discovery |
| `POST` | `/api/novelty/analyze` | Novelty audit with overlap breakdown |
| `POST` | `/api/assistant/ask` | Source-grounded RAG assistant with citations |
| `POST` | `/api/reviews/generate` | Synthesizes full literature review draft |
| `POST` | `/api/papers/compare` | Multi-paper comparison matrix generator |
| `GET` | `/api/analytics` | Statistical aggregates, topic growth, and distributions |
| `GET` | `/api/library/saved` | User's saved papers and reading status |
| `GET` | `/api/collections` | User's research collections |

---

## 🔒 Disclaimers & Ethics

1. **Novelty Auditor Disclaimer**: The ResearchGraph AI Novelty Auditor evaluates semantic and categorical overlap strictly against the indexed literature corpus. It **never claims to prove originality, patentability, or legal priority**.
2. **AI Synthesized Literature Reviews**: Generated reviews are exploratory research drafts compiled from extracted literature claims. They must be critically verified by domain experts prior to academic publication.

---

## 📄 License

Distributed under the Apache 2.0 License. See `LICENSE` for details.
