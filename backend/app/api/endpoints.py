import datetime
import re
import io
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from typing import List, Optional, Dict, Any

from app.core.database import get_db
from app.core.security import (
    get_current_user, get_current_user_optional,
    verify_password, get_password_hash, create_access_token
)
from app.models.models import (
    User, Paper, Collection, CollectionPaper, SavedPaper, Notification
)
from app.services.paper_service import paper_service
from app.algorithms.graph_engine import knowledge_graph
from app.ai.vector_engine import vector_engine
from app.ai.novelty_auditor import novelty_auditor
from app.ai.rag_assistant import rag_assistant
from app.ai.review_generator import review_generator
from app.ingestion.connectors import openalex_connector
from app.schemas.schemas import (
    SearchQueryRequest, SearchResultOut, PaperOut, GraphExplorerOut,
    ResearchGapOut, NoveltyAuditorRequest, NoveltyAuditorResult,
    AssistantChatRequest, AssistantChatResponse, ReviewGenerationRequest,
    ReviewGenerationOut, ComparisonRequest, ComparisonMatrixOut,
    AnalyticsTrendsOut, UserRegister, UserLogin, TokenOut, CollectionCreate,
    NotificationOut, CollectionOut, PaperUploadResult
)

router = APIRouter()

# ===============================
# AUTHENTICATION (DB-backed)
# ===============================
@router.post("/auth/register", response_model=TokenOut)
async def register_user(user_in: UserRegister, db: AsyncSession = Depends(get_db)):
    # Check duplicate email
    existing_email = await db.execute(select(User).where(User.email == user_in.email))
    if existing_email.scalars().first():
        raise HTTPException(status_code=400, detail="Email already registered")

    # Check duplicate username
    existing_username = await db.execute(select(User).where(User.username == user_in.username))
    if existing_username.scalars().first():
        raise HTTPException(status_code=400, detail="Username already taken")

    user_id = f"usr_{user_in.username}"
    new_user = User(
        id=user_id,
        email=user_in.email,
        username=user_in.username,
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name or user_in.username,
        role="researcher"
    )
    db.add(new_user)

    # Seed welcome notification
    db.add(Notification(
        user_id=user_id,
        title="Welcome to ResearchGraph AI",
        message="Start exploring semantic search, knowledge graphs, and gap analysis.",
        notification_type="system",
        link="/dashboard"
    ))
    await db.commit()

    token = create_access_token({"sub": new_user.username, "id": new_user.id, "role": new_user.role})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": new_user.id,
            "email": new_user.email,
            "username": new_user.username,
            "full_name": new_user.full_name,
            "role": new_user.role
        }
    }

@router.post("/auth/login", response_model=TokenOut)
async def login_user(login_in: UserLogin, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.username == login_in.username))
    user = result.scalars().first()
    if not user or not verify_password(login_in.password, user.hashed_password):
        raise HTTPException(
            status_code=401,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"}
        )
    token = create_access_token({"sub": user.username, "id": user.id, "role": user.role})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "username": user.username,
            "full_name": user.full_name,
            "role": user.role
        }
    }

@router.get("/auth/me")
async def get_current_user_profile(user: dict = Depends(get_current_user)):
    return user

# ===============================
# SEARCH & RETRIEVAL
# ===============================
@router.post("/search/hybrid", response_model=SearchResultOut)
async def search_hybrid(query_req: SearchQueryRequest, db: AsyncSession = Depends(get_db)):
    return await paper_service.search_papers(
        db=db,
        query=query_req.query,
        search_type="hybrid",
        limit=query_req.limit,
        offset=query_req.offset,
        filter_year_min=query_req.filter_year_min,
        filter_year_max=query_req.filter_year_max,
        filter_domain=query_req.filter_domain,
        filter_open_access=query_req.filter_open_access,
        sort_by=query_req.sort_by
    )

@router.post("/search/semantic", response_model=SearchResultOut)
async def search_semantic(query_req: SearchQueryRequest, db: AsyncSession = Depends(get_db)):
    return await paper_service.search_papers(
        db=db,
        query=query_req.query,
        search_type="semantic",
        limit=query_req.limit,
        offset=query_req.offset,
        filter_year_min=query_req.filter_year_min,
        filter_year_max=query_req.filter_year_max,
        filter_domain=query_req.filter_domain,
        filter_open_access=query_req.filter_open_access,
        sort_by=query_req.sort_by
    )

@router.get("/search/autocomplete")
async def autocomplete(q: str = Query(..., min_length=1), limit: int = 8):
    return paper_service.trie.search_prefix(q, max_results=limit)

# ===============================
# PAPERS REPOSITORY
# ===============================
@router.get("/papers", response_model=List[PaperOut])
async def list_papers(limit: int = 25, offset: int = 0, db: AsyncSession = Depends(get_db)):
    all_papers = await paper_service.get_all_papers_as_dict(db)
    return all_papers[offset : offset + limit]

@router.get("/papers/{paper_id}", response_model=PaperOut)
async def get_paper(paper_id: str, db: AsyncSession = Depends(get_db)):
    all_papers = await paper_service.get_all_papers_as_dict(db)
    for p in all_papers:
        if p["id"] == paper_id:
            return p
    raise HTTPException(status_code=404, detail="Paper not found in indexed corpus")

@router.get("/papers/{paper_id}/related")
async def get_related_papers(paper_id: str, limit: int = 5, db: AsyncSession = Depends(get_db)):
    target_paper = await get_paper(paper_id, db)
    search_res = await paper_service.search_papers(
        db=db,
        query=f"{target_paper.get('title', '')} {target_paper.get('abstract', '')[:150]}",
        search_type="semantic",
        limit=limit + 1
    )
    related = [p for p in search_res["results"] if p["id"] != paper_id][:limit]
    return related

@router.get("/papers/{paper_id}/citations")
async def get_paper_citations(paper_id: str):
    bfs = knowledge_graph.bfs_neighborhood(paper_id, max_depth=1)
    return bfs

@router.post("/papers/compare", response_model=ComparisonMatrixOut)
async def compare_papers(comp_req: ComparisonRequest, db: AsyncSession = Depends(get_db)):
    return await paper_service.compare_papers(db, comp_req.paper_ids)

# ===============================
# PDF UPLOAD & EXTRACTION
# ===============================
@router.post("/papers/upload", response_model=PaperUploadResult)
async def upload_paper_pdf(file: UploadFile = File(...)):
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted")
    if file.content_type and file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Invalid MIME type; expected application/pdf")

    contents = await file.read()
    if len(contents) > 50 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File exceeds 50 MB limit")

    try:
        from pypdf import PdfReader
        reader = PdfReader(io.BytesIO(contents))
        page_count = len(reader.pages)
        full_text = ""
        for page in reader.pages:
            page_text = page.extract_text() or ""
            full_text += page_text + "\n"
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Failed to parse PDF: {str(e)}")

    # Heuristic extraction
    lines = full_text.split("\n")
    title = lines[0].strip() if lines else file.filename
    if len(title) < 5 or len(title) > 300:
        title = file.filename

    abstract = ""
    problem = ""
    methods_found = []
    datasets_found = []

    abstract_started = False
    for line in lines:
        low = line.strip().lower()
        if low.startswith("abstract"):
            abstract_started = True
            abstract = line.strip()[len("abstract"):].strip().lstrip(".:- ")
            continue
        if abstract_started:
            if low.startswith("introduction") or low.startswith("1.") or low.startswith("keywords"):
                abstract_started = False
                continue
            abstract += " " + line.strip()
        # Methodology extraction
        if "method" in low or "approach" in low or "technique" in low:
            for token in re.findall(r'[A-Z][a-zA-Z\-]+(?:\s+[A-Z][a-zA-Z\-]+)*', line):
                if len(token) > 3 and token not in methods_found:
                    methods_found.append(token)
        # Dataset extraction
        if "dataset" in low or "corpus" in low or "benchmark" in low:
            for token in re.findall(r'[A-Z][a-zA-Z0-9\-]+(?:\s+[A-Z][a-zA-Z0-9\-]+)*', line):
                if len(token) > 2 and token not in datasets_found:
                    datasets_found.append(token)
        # Problem extraction
        if ("problem" in low or "objective" in low or "goal" in low) and not problem:
            problem = line.strip()

    return PaperUploadResult(
        filename=file.filename or "upload.pdf",
        extracted_title=title[:200] if title else None,
        extracted_abstract=abstract[:2000].strip() if abstract else None,
        extracted_problem=problem[:500] if problem else None,
        extracted_methods=methods_found[:10],
        extracted_datasets=datasets_found[:10],
        page_count=page_count
    )

# ===============================
# RESEARCH KNOWLEDGE GRAPH
# ===============================
@router.get("/graph/explore", response_model=GraphExplorerOut)
async def explore_graph(
    center_id: Optional[str] = None,
    node_types: Optional[str] = None,
    limit: int = 80
):
    selected_types = [t.strip() for t in node_types.split(",")] if node_types else None
    if center_id:
        bfs_data = knowledge_graph.bfs_neighborhood(center_id, max_depth=2, max_nodes=limit)
        return {
            "nodes": bfs_data["nodes"],
            "edges": bfs_data["edges"],
            "stats": {"rendered_nodes": len(bfs_data["nodes"]), "rendered_edges": len(bfs_data["edges"])}
        }
    return knowledge_graph.get_subgraph(node_types=selected_types, limit=limit)

@router.get("/graph/path")
async def find_graph_path(source: str, target: str):
    path_res = knowledge_graph.dijkstra_shortest_path(source, target)
    if not path_res:
        raise HTTPException(status_code=404, detail="No connective reasoning path found between entities")
    return path_res

# ===============================
# RESEARCH GAP DISCOVERY (EWRGS)
# ===============================
@router.post("/gaps/analyze", response_model=List[ResearchGapOut])
async def analyze_research_gaps(domain: str = Query("Artificial Intelligence"), db: AsyncSession = Depends(get_db)):
    return await paper_service.analyze_gaps(db, domain=domain)

@router.get("/gaps", response_model=List[ResearchGapOut])
async def list_gaps(domain: str = Query("Artificial Intelligence"), db: AsyncSession = Depends(get_db)):
    return await paper_service.analyze_gaps(db, domain=domain)

# ===============================
# RESEARCH NOVELTY AUDITOR
# ===============================
@router.post("/novelty/analyze", response_model=NoveltyAuditorResult)
async def analyze_novelty(proposal: NoveltyAuditorRequest, db: AsyncSession = Depends(get_db)):
    papers = await paper_service.get_all_papers_as_dict(db)
    return novelty_auditor.audit_proposal(
        abstract=proposal.abstract,
        problem=proposal.problem or "",
        proposed_method=proposal.proposed_method or "",
        proposed_dataset=proposal.proposed_dataset or "",
        expected_contribution=proposal.expected_contribution or "",
        indexed_papers=papers
    )

# ===============================
# AI RESEARCH ASSISTANT / RAG
# ===============================
@router.post("/assistant/ask", response_model=AssistantChatResponse)
async def ask_assistant(req: AssistantChatRequest, db: AsyncSession = Depends(get_db)):
    all_papers = await paper_service.get_all_papers_as_dict(db)
    if req.paper_ids:
        target_papers = [p for p in all_papers if p["id"] in req.paper_ids]
    else:
        search_hits = await paper_service.search_papers(db, req.question, limit=4)
        target_papers = search_hits["results"]
    return rag_assistant.answer_question(req.question, target_papers)

# ===============================
# LITERATURE REVIEW GENERATOR
# ===============================
@router.post("/reviews/generate", response_model=ReviewGenerationOut)
async def generate_literature_review(req: ReviewGenerationRequest, db: AsyncSession = Depends(get_db)):
    all_papers = await paper_service.get_all_papers_as_dict(db)
    selected = [p for p in all_papers if p["id"] in req.paper_ids]
    if not selected:
        selected = all_papers[:5]
    return review_generator.generate_review(
        papers=selected,
        topic=req.topic or "Modern Deep Learning and NLP Paradigms",
        style=req.citation_style
    )

# ===============================
# ANALYTICS & TRENDS
# ===============================
@router.get("/analytics", response_model=AnalyticsTrendsOut)
async def get_analytics(db: AsyncSession = Depends(get_db)):
    return await paper_service.get_analytics_trends(db)

@router.get("/trends/topics")
async def get_topic_trends(db: AsyncSession = Depends(get_db)):
    analytics = await paper_service.get_analytics_trends(db)
    return analytics["top_topics"]

@router.get("/trends/publications")
async def get_publication_trends(db: AsyncSession = Depends(get_db)):
    analytics = await paper_service.get_analytics_trends(db)
    return analytics["publication_year_distribution"]

# ===============================
# USER COLLECTIONS (DB-backed, multi-tenant)
# ===============================
@router.get("/collections", response_model=List[CollectionOut])
async def list_collections(db: AsyncSession = Depends(get_db), user: dict = Depends(get_current_user)):
    result = await db.execute(select(Collection).where(Collection.user_id == user["id"]))
    cols = result.scalars().all()
    out = []
    for c in cols:
        # Count papers in this collection
        count_res = await db.execute(
            select(func.count()).select_from(CollectionPaper).where(CollectionPaper.collection_id == c.id)
        )
        paper_count = count_res.scalar() or 0
        out.append(CollectionOut(
            id=c.id, name=c.name, description=c.description,
            color=c.color, paper_count=paper_count
        ))
    return out

@router.post("/collections", response_model=CollectionOut)
async def create_collection(col_in: CollectionCreate, db: AsyncSession = Depends(get_db), user: dict = Depends(get_current_user)):
    new_col = Collection(
        id=str(uuid.uuid4()),
        user_id=user["id"],
        name=col_in.name,
        description=col_in.description or "",
        color=col_in.color or "#0c8ee9"
    )
    db.add(new_col)
    await db.commit()
    return CollectionOut(
        id=new_col.id, name=new_col.name, description=new_col.description,
        color=new_col.color, paper_count=0
    )

@router.post("/collections/{collection_id}/papers")
async def add_paper_to_collection(collection_id: str, paper_id: str = Query(...), db: AsyncSession = Depends(get_db), user: dict = Depends(get_current_user)):
    # Verify ownership
    col_res = await db.execute(select(Collection).where(Collection.id == collection_id, Collection.user_id == user["id"]))
    col = col_res.scalars().first()
    if not col:
        raise HTTPException(status_code=404, detail="Collection not found")
    # Check duplicate
    existing = await db.execute(
        select(CollectionPaper).where(CollectionPaper.collection_id == collection_id, CollectionPaper.paper_id == paper_id)
    )
    if existing.scalars().first():
        return {"status": "already_exists", "collection_id": collection_id, "paper_id": paper_id}
    db.add(CollectionPaper(collection_id=collection_id, paper_id=paper_id))
    await db.commit()
    return {"status": "added", "collection_id": collection_id, "paper_id": paper_id}

# ===============================
# USER LIBRARY / SAVED PAPERS (DB-backed, multi-tenant)
# ===============================
@router.get("/library/saved")
async def get_saved_papers(db: AsyncSession = Depends(get_db), user: dict = Depends(get_current_user)):
    result = await db.execute(select(SavedPaper).where(SavedPaper.user_id == user["id"]))
    saved = result.scalars().all()
    all_papers = await paper_service.get_all_papers_as_dict(db)
    paper_map = {p["id"]: p for p in all_papers}
    results = []
    for s in saved:
        if s.paper_id in paper_map:
            p_data = dict(paper_map[s.paper_id])
            p_data["reading_status"] = s.reading_status
            results.append(p_data)
    return results

@router.post("/library/save")
async def save_paper(paper_id: str = Query(...), status: str = Query("to_read"), db: AsyncSession = Depends(get_db), user: dict = Depends(get_current_user)):
    # Upsert
    result = await db.execute(
        select(SavedPaper).where(SavedPaper.user_id == user["id"], SavedPaper.paper_id == paper_id)
    )
    existing = result.scalars().first()
    if existing:
        existing.reading_status = status
        await db.commit()
        return {"status": "updated", "paper_id": paper_id, "reading_status": status}
    db.add(SavedPaper(user_id=user["id"], paper_id=paper_id, reading_status=status))
    await db.commit()
    return {"status": "saved", "paper_id": paper_id, "reading_status": status}

@router.delete("/library/saved/{paper_id}")
async def remove_saved_paper(paper_id: str, db: AsyncSession = Depends(get_db), user: dict = Depends(get_current_user)):
    result = await db.execute(
        select(SavedPaper).where(SavedPaper.user_id == user["id"], SavedPaper.paper_id == paper_id)
    )
    sp = result.scalars().first()
    if not sp:
        raise HTTPException(status_code=404, detail="Paper not in your library")
    await db.delete(sp)
    await db.commit()
    return {"status": "removed", "paper_id": paper_id}

# ===============================
# NOTIFICATIONS (DB-backed, multi-tenant)
# ===============================
@router.get("/notifications", response_model=List[NotificationOut])
async def get_notifications(db: AsyncSession = Depends(get_db), user: dict = Depends(get_current_user)):
    result = await db.execute(
        select(Notification).where(Notification.user_id == user["id"]).order_by(Notification.created_at.desc())
    )
    return [NotificationOut(
        id=n.id, title=n.title, message=n.message,
        notification_type=n.notification_type, is_read=n.is_read,
        link=n.link, created_at=n.created_at
    ) for n in result.scalars().all()]

@router.post("/notifications/{notif_id}/read")
async def mark_notification_read(notif_id: str, db: AsyncSession = Depends(get_db), user: dict = Depends(get_current_user)):
    result = await db.execute(
        select(Notification).where(Notification.id == notif_id, Notification.user_id == user["id"])
    )
    notif = result.scalars().first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    notif.is_read = True
    await db.commit()
    return {"status": "marked_read"}

@router.post("/notifications/read-all")
async def mark_all_notifications_read(db: AsyncSession = Depends(get_db), user: dict = Depends(get_current_user)):
    result = await db.execute(
        select(Notification).where(Notification.user_id == user["id"], Notification.is_read == False)
    )
    unread = result.scalars().all()
    for n in unread:
        n.is_read = True
    await db.commit()
    return {"status": "all_marked_read", "count": len(unread)}

# ===============================
# ACADEMIC DATA INGESTION
# ===============================
@router.post("/ingestion/sync")
async def sync_external_papers(query: str = Query(..., min_length=2), db: AsyncSession = Depends(get_db)):
    """Fetch and index external papers from OpenAlex for a given query."""
    try:
        external_papers = await openalex_connector.search_works(query, limit=10)
        if external_papers:
            added = await paper_service.ingest_new_papers(db, external_papers)
            return {"status": "synced", "query": query, "papers_fetched": len(external_papers), "papers_added": added}
        return {"status": "no_results", "query": query, "papers_fetched": 0, "papers_added": 0}
    except Exception as e:
        return {"status": "error", "query": query, "detail": str(e)}

# ===============================
# HEALTH & SEEDING
# ===============================
@router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "ResearchGraph AI Backend Engine",
        "version": "1.0.0",
        "graph_nodes": knowledge_graph.g.number_of_nodes(),
        "graph_edges": knowledge_graph.g.number_of_edges(),
        "vector_engine_ready": vector_engine.is_fitted
    }

@router.post("/seed")
async def trigger_seed(db: AsyncSession = Depends(get_db)):
    await paper_service.ensure_seeded(db)
    return {"message": "Corpus successfully indexed and graph synced", "total_papers": len(await paper_service.get_all_papers_as_dict(db))}
