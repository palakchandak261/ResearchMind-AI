import datetime
import uuid
from sqlalchemy import (
    Column, String, Integer, Float, Text, Boolean, DateTime, ForeignKey, Table, JSON
)
from sqlalchemy.orm import relationship
from app.core.database import Base

def gen_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, default=gen_uuid)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    role = Column(String, default="researcher")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    saved_papers = relationship("SavedPaper", back_populates="user", cascade="all, delete-orphan")
    collections = relationship("Collection", back_populates="user", cascade="all, delete-orphan")
    notes = relationship("UserNote", back_populates="user", cascade="all, delete-orphan")
    searches = relationship("SearchHistoryRecord", back_populates="user", cascade="all, delete-orphan")

class PaperAuthor(Base):
    __tablename__ = "paper_authors"
    paper_id = Column(String, ForeignKey("papers.id", ondelete="CASCADE"), primary_key=True)
    author_id = Column(String, ForeignKey("authors.id", ondelete="CASCADE"), primary_key=True)
    author_order = Column(Integer, default=0)

class PaperTopic(Base):
    __tablename__ = "paper_topics"
    paper_id = Column(String, ForeignKey("papers.id", ondelete="CASCADE"), primary_key=True)
    topic_id = Column(String, ForeignKey("topics.id", ondelete="CASCADE"), primary_key=True)
    score = Column(Float, default=1.0)

class PaperMethod(Base):
    __tablename__ = "paper_methods"
    paper_id = Column(String, ForeignKey("papers.id", ondelete="CASCADE"), primary_key=True)
    method_id = Column(String, ForeignKey("methodologies.id", ondelete="CASCADE"), primary_key=True)

class PaperDataset(Base):
    __tablename__ = "paper_datasets"
    paper_id = Column(String, ForeignKey("papers.id", ondelete="CASCADE"), primary_key=True)
    dataset_id = Column(String, ForeignKey("datasets.id", ondelete="CASCADE"), primary_key=True)

class Paper(Base):
    __tablename__ = "papers"
    id = Column(String, primary_key=True, default=gen_uuid)
    doi = Column(String, unique=True, index=True, nullable=True)
    title = Column(String, nullable=False, index=True)
    abstract = Column(Text, nullable=True)
    publication_year = Column(Integer, index=True, nullable=True)
    publication_date = Column(String, nullable=True)
    venue = Column(String, nullable=True)
    citation_count = Column(Integer, default=0, index=True)
    reference_count = Column(Integer, default=0)
    pdf_url = Column(String, nullable=True)
    open_access = Column(Boolean, default=False)
    source = Column(String, default="OpenAlex") # OpenAlex, arXiv, SemanticScholar, Crossref
    provenance = Column(JSON, default=dict) # raw metadata
    
    # NLP Extracted Fields
    research_domain = Column(String, default="Computer Science", index=True)
    objective = Column(Text, nullable=True)
    evaluation_metrics = Column(JSON, default=list) # ["Accuracy", "F1", "BLEU"]
    findings = Column(JSON, default=list)
    limitations_list = Column(JSON, default=list)
    future_work_list = Column(JSON, default=list)
    reproducibility_checklist = Column(JSON, default=dict)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    authors = relationship("Author", secondary="paper_authors", back_populates="papers")
    topics = relationship("Topic", secondary="paper_topics", back_populates="papers")
    methodologies = relationship("Methodology", secondary="paper_methods", back_populates="papers")
    datasets = relationship("Dataset", secondary="paper_datasets", back_populates="papers")
    claims = relationship("ExtractedClaim", back_populates="paper", cascade="all, delete-orphan")
    limitations = relationship("Limitation", back_populates="paper", cascade="all, delete-orphan")

class Author(Base):
    __tablename__ = "authors"
    id = Column(String, primary_key=True, default=gen_uuid)
    name = Column(String, nullable=False, index=True)
    institution = Column(String, nullable=True)
    h_index = Column(Integer, default=0)
    papers = relationship("Paper", secondary="paper_authors", back_populates="authors")

class Topic(Base):
    __tablename__ = "topics"
    id = Column(String, primary_key=True, default=gen_uuid)
    name = Column(String, unique=True, nullable=False, index=True)
    category = Column(String, nullable=True)
    papers = relationship("Paper", secondary="paper_topics", back_populates="topics")

class Methodology(Base):
    __tablename__ = "methodologies"
    id = Column(String, primary_key=True, default=gen_uuid)
    name = Column(String, unique=True, nullable=False, index=True)
    category = Column(String, nullable=True) # "Deep Learning", "Optimization", etc.
    papers = relationship("Paper", secondary="paper_methods", back_populates="methodologies")

class Dataset(Base):
    __tablename__ = "datasets"
    id = Column(String, primary_key=True, default=gen_uuid)
    name = Column(String, unique=True, nullable=False, index=True)
    modality = Column(String, nullable=True) # "Text", "Vision", "Tabular", "Graph"
    papers = relationship("Paper", secondary="paper_datasets", back_populates="datasets")

class ExtractedClaim(Base):
    __tablename__ = "extracted_claims"
    id = Column(String, primary_key=True, default=gen_uuid)
    paper_id = Column(String, ForeignKey("papers.id", ondelete="CASCADE"), nullable=False, index=True)
    claim_text = Column(Text, nullable=False)
    section = Column(String, default="Results")
    confidence = Column(Float, default=0.85)
    metric_measured = Column(String, nullable=True)
    effect_direction = Column(String, nullable=True) # "positive", "negative", "neutral"
    paper = relationship("Paper", back_populates="claims")

class Limitation(Base):
    __tablename__ = "limitations"
    id = Column(String, primary_key=True, default=gen_uuid)
    paper_id = Column(String, ForeignKey("papers.id", ondelete="CASCADE"), nullable=False, index=True)
    description = Column(Text, nullable=False)
    limitation_type = Column(String, default="Methodological") # "Data", "Scalability", "Hardware"
    paper = relationship("Paper", back_populates="limitations")

class ResearchGap(Base):
    __tablename__ = "research_gaps"
    id = Column(String, primary_key=True, default=gen_uuid)
    domain = Column(String, nullable=False, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    
    # Candidate tuple components
    problem = Column(String, nullable=True)
    methodology = Column(String, nullable=True)
    dataset = Column(String, nullable=True)
    application = Column(String, nullable=True)
    
    # EWRGS score components
    ewrgs_score = Column(Float, default=0.0, index=True)
    score_underexploration = Column(Float, default=0.0)
    score_trend = Column(Float, default=0.0)
    score_diversity_deficit = Column(Float, default=0.0)
    score_limitation = Column(Float, default=0.0)
    score_conflict = Column(Float, default=0.0)
    
    confidence = Column(Float, default=0.75)
    corpus_coverage_warning = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    evidence = relationship("GapEvidence", back_populates="gap", cascade="all, delete-orphan")

class GapEvidence(Base):
    __tablename__ = "gap_evidence"
    id = Column(String, primary_key=True, default=gen_uuid)
    gap_id = Column(String, ForeignKey("research_gaps.id", ondelete="CASCADE"), nullable=False, index=True)
    paper_id = Column(String, ForeignKey("papers.id", ondelete="CASCADE"), nullable=False)
    evidence_type = Column(String, default="support") # "support", "counterexample", "limitation_citation"
    explanation = Column(Text, nullable=True)
    quote = Column(Text, nullable=True)
    
    gap = relationship("ResearchGap", back_populates="evidence")
    paper = relationship("Paper")

class Collection(Base):
    __tablename__ = "collections"
    id = Column(String, primary_key=True, default=gen_uuid)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    color = Column(String, default="#0c8ee9")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    user = relationship("User", back_populates="collections")
    papers = relationship("CollectionPaper", back_populates="collection", cascade="all, delete-orphan")

class CollectionPaper(Base):
    __tablename__ = "collection_papers"
    collection_id = Column(String, ForeignKey("collections.id", ondelete="CASCADE"), primary_key=True)
    paper_id = Column(String, ForeignKey("papers.id", ondelete="CASCADE"), primary_key=True)
    added_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    collection = relationship("Collection", back_populates="papers")
    paper = relationship("Paper")

class SavedPaper(Base):
    __tablename__ = "saved_papers"
    id = Column(String, primary_key=True, default=gen_uuid)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    paper_id = Column(String, ForeignKey("papers.id", ondelete="CASCADE"), nullable=False)
    reading_status = Column(String, default="to_read") # "to_read", "reading", "completed"
    saved_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    user = relationship("User", back_populates="saved_papers")
    paper = relationship("Paper")

class UserNote(Base):
    __tablename__ = "user_notes"
    id = Column(String, primary_key=True, default=gen_uuid)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    paper_id = Column(String, ForeignKey("papers.id", ondelete="CASCADE"), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    user = relationship("User", back_populates="notes")
    paper = relationship("Paper")

class SearchHistoryRecord(Base):
    __tablename__ = "search_history"
    id = Column(String, primary_key=True, default=gen_uuid)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    query = Column(String, nullable=False)
    search_type = Column(String, default="hybrid") # semantic, hybrid, keyword
    results_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    user = relationship("User", back_populates="searches")

class Notification(Base):
    __tablename__ = "notifications"
    id = Column(String, primary_key=True, default=gen_uuid)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    notification_type = Column(String, default="system") # system, ingestion, gap_alert, review_ready
    is_read = Column(Boolean, default=False)
    link = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    user = relationship("User", backref="notifications")
