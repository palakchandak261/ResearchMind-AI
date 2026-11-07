from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

class AuthorOut(BaseModel):
    id: Optional[str] = None
    name: str
    institution: Optional[str] = None
    h_index: Optional[int] = 0

class TopicOut(BaseModel):
    id: Optional[str] = None
    name: str
    category: Optional[str] = None

class MethodOut(BaseModel):
    id: Optional[str] = None
    name: str
    category: Optional[str] = None

class DatasetOut(BaseModel):
    id: Optional[str] = None
    name: str
    modality: Optional[str] = None

class ExtractedClaimOut(BaseModel):
    id: Optional[str] = None
    claim_text: str
    section: Optional[str] = "Results"
    confidence: Optional[float] = 0.85
    metric_measured: Optional[str] = None
    effect_direction: Optional[str] = None

class LimitationOut(BaseModel):
    id: Optional[str] = None
    description: str
    limitation_type: Optional[str] = "Methodological"

class PaperOut(BaseModel):
    id: str
    doi: Optional[str] = None
    title: str
    abstract: Optional[str] = None
    publication_year: Optional[int] = None
    publication_date: Optional[str] = None
    venue: Optional[str] = None
    citation_count: int = 0
    reference_count: int = 0
    pdf_url: Optional[str] = None
    open_access: bool = False
    source: str = "OpenAlex"
    research_domain: Optional[str] = "Computer Science"
    objective: Optional[str] = None
    evaluation_metrics: List[str] = []
    findings: List[str] = []
    limitations_list: List[str] = []
    future_work_list: List[str] = []
    reproducibility_checklist: Dict[str, Any] = {}
    
    authors: List[AuthorOut] = []
    topics: List[TopicOut] = []
    methodologies: List[MethodOut] = []
    datasets: List[DatasetOut] = []
    claims: List[ExtractedClaimOut] = []
    limitations: List[LimitationOut] = []
    
    relevance_score: Optional[float] = None
    relevance_explanation: Optional[str] = None

class SearchQueryRequest(BaseModel):
    query: str
    search_type: str = "hybrid" # semantic, hybrid, keyword
    limit: int = 15
    offset: int = 0
    filter_year_min: Optional[int] = None
    filter_year_max: Optional[int] = None
    filter_domain: Optional[str] = None
    filter_open_access: Optional[bool] = None
    sort_by: str = "relevance" # relevance, citations, recent

class SearchResultOut(BaseModel):
    query: str
    search_type: str
    total: int
    execution_time_ms: float
    results: List[PaperOut]
    query_expansion: List[str] = []

class GraphNode(BaseModel):
    id: str
    label: str
    type: str # paper, author, topic, method, dataset
    properties: Dict[str, Any] = {}

class GraphEdge(BaseModel):
    id: str
    source: str
    target: str
    type: str # cites, authored_by, uses_method, uses_dataset, belongs_to_topic, extends
    weight: float = 1.0

class GraphExplorerOut(BaseModel):
    nodes: List[GraphNode]
    edges: List[GraphEdge]
    stats: Dict[str, Any] = {}

class GapEvidenceOut(BaseModel):
    paper_id: str
    paper_title: str
    paper_year: Optional[int] = None
    evidence_type: str # support, counterexample, limitation_citation
    explanation: Optional[str] = None
    quote: Optional[str] = None

class ResearchGapOut(BaseModel):
    id: str
    domain: str
    title: str
    description: str
    problem: Optional[str] = None
    methodology: Optional[str] = None
    dataset: Optional[str] = None
    application: Optional[str] = None
    
    ewrgs_score: float
    score_underexploration: float
    score_trend: float
    score_diversity_deficit: float
    score_limitation: float
    score_conflict: float
    confidence: float
    corpus_coverage_warning: Optional[str] = None
    
    supporting_papers: List[GapEvidenceOut] = []
    counterevidence_papers: List[GapEvidenceOut] = []
    future_directions: List[str] = []

class NoveltyAuditorRequest(BaseModel):
    abstract: str
    problem: Optional[str] = ""
    proposed_method: Optional[str] = ""
    proposed_dataset: Optional[str] = ""
    expected_contribution: Optional[str] = ""

class NoveltyAuditorResult(BaseModel):
    overall_novelty_risk_score: float # 0 to 1 (0 = highly explored/duplicate risk, 1 = distinctive)
    problem_overlap_score: float
    methodology_overlap_score: float
    dataset_overlap_score: float
    extracted_concepts: List[str] = []
    extracted_methods: List[str] = []
    extracted_datasets: List[str] = []
    similar_papers: List[PaperOut] = []
    potentially_distinctive_aspects: List[str] = []
    potentially_unexplored_combinations: List[str] = []
    recommendations: List[str] = []
    disclaimer: str = "Never claim that the system proves originality, patentability or scientific novelty. Scores indicate overlap against indexed publications."

class AssistantChatRequest(BaseModel):
    question: str
    paper_ids: Optional[List[str]] = []
    conversation_history: Optional[List[Dict[str, str]]] = []

class AssistantCitation(BaseModel):
    paper_id: str
    paper_title: str
    section: str
    quote: str
    relevance_score: float

class AssistantChatResponse(BaseModel):
    answer: str
    citations: List[AssistantCitation]
    confidence: float
    limitations_noted: List[str] = []
    further_reading: List[Dict[str, str]] = []

class ReviewGenerationRequest(BaseModel):
    paper_ids: List[str]
    topic: Optional[str] = None
    citation_style: str = "IEEE" # IEEE, APA, BibTeX

class ReviewGenerationOut(BaseModel):
    title: str
    citation_style: str
    abstract: str
    sections: List[Dict[str, str]] # Introduction, Existing Approaches, Comparative Findings, Conflicting Evidence, Limitations, Gaps, Future Directions
    bibliography: List[str]
    human_review_notice: str = "DRAFT GENERATION NOTICE: This literature review draft is synthesized from indexed scientific evidence and must be critically reviewed and validated by human domain experts before scholarly publication."

class ComparisonRequest(BaseModel):
    paper_ids: List[str]

class ComparisonMatrixOut(BaseModel):
    headers: List[str]
    matrix: List[Dict[str, Any]]
    methodology_comparison: List[Dict[str, Any]]
    dataset_comparison: List[Dict[str, Any]]
    conflicting_findings: List[Dict[str, Any]]
    underexplored_combinations: List[str]

class ContradictionPairOut(BaseModel):
    paper_1_id: str
    paper_1_title: str
    paper_1_claim: str
    paper_2_id: str
    paper_2_title: str
    paper_2_claim: str
    nli_relationship: str # CONTRADICTS, SUPPORTS, NEUTRAL
    comparable_context: bool
    context_details: Dict[str, Any]
    confidence: float

class TopicTrendPoint(BaseModel):
    year: int
    paper_count: int
    citation_count: int

class TopicTrendOut(BaseModel):
    topic: str
    growth_rate: float
    status: str # "emerging", "steady", "declining", "peaking"
    points: List[TopicTrendPoint]

class AnalyticsTrendsOut(BaseModel):
    total_indexed_papers: int
    total_authors: int
    total_topics: int
    top_topics: List[TopicTrendOut]
    top_methodologies: List[Dict[str, Any]]
    top_datasets: List[Dict[str, Any]]
    publication_year_distribution: List[Dict[str, Any]]
    contradiction_rate: float
    average_citations_per_paper: float

class UserRegister(BaseModel):
    email: str
    username: str
    password: str
    full_name: Optional[str] = None

class UserLogin(BaseModel):
    username: str
    password: str

class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]

class CollectionCreate(BaseModel):
    name: str
    description: Optional[str] = None
    color: Optional[str] = "#0c8ee9"

class UserNoteCreate(BaseModel):
    paper_id: str
    content: str

class NotificationOut(BaseModel):
    id: str
    title: str
    message: str
    notification_type: str = "system"
    is_read: bool = False
    link: Optional[str] = None
    created_at: Optional[datetime] = None

class CollectionOut(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    color: Optional[str] = "#0c8ee9"
    paper_count: int = 0

class PaperUploadResult(BaseModel):
    filename: str
    extracted_title: Optional[str] = None
    extracted_abstract: Optional[str] = None
    extracted_problem: Optional[str] = None
    extracted_methods: List[str] = []
    extracted_datasets: List[str] = []
    page_count: int = 1
