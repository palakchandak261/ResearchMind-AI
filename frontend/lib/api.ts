const API_BASE = "/api";

export interface Author {
  id: string;
  name: string;
  institution?: string;
  h_index?: number;
}

export interface Topic {
  id: string;
  name: string;
  category?: string;
}

export interface Methodology {
  id: string;
  name: string;
  category?: string;
}

export interface Dataset {
  id: string;
  name: string;
  modality?: string;
}

export interface Paper {
  id: string;
  doi?: string;
  title: string;
  abstract?: string;
  publication_year?: number;
  publication_date?: string;
  venue?: string;
  citation_count: number;
  reference_count: number;
  pdf_url?: string;
  open_access: boolean;
  source: string;
  research_domain?: string;
  objective?: string;
  evaluation_metrics?: string[];
  findings?: string[];
  limitations_list?: string[];
  future_work_list?: string[];
  reproducibility_checklist?: Record<string, any>;
  authors?: Author[];
  topics?: Topic[];
  methodologies?: Methodology[];
  datasets?: Dataset[];
  relevance_score?: number;
  relevance_explanation?: string;
  reading_status?: string;
}

export interface SearchResult {
  query: string;
  search_type: string;
  total: number;
  execution_time_ms: number;
  results: Paper[];
  query_expansion: string[];
}

export interface GraphNode {
  id: string;
  label: string;
  type: string;
  properties?: Record<string, any>;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  weight: number;
}

export interface GraphExplorerData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  stats?: Record<string, any>;
}

export interface ResearchGap {
  id: string;
  domain: string;
  title: string;
  description: string;
  problem?: string;
  methodology?: string;
  dataset?: string;
  ewrgs_score: number;
  score_underexploration: number;
  score_trend: number;
  score_diversity_deficit: number;
  score_limitation: number;
  score_conflict: number;
  confidence: number;
  corpus_coverage_warning?: string;
  supporting_papers: Array<{
    paper_id: string;
    paper_title: string;
    evidence_type: string;
    explanation?: string;
    quote?: string;
  }>;
  counterevidence_papers: Array<{
    paper_id: string;
    paper_title: string;
    paper_year?: number;
    evidence_type: string;
    explanation?: string;
    quote?: string;
  }>;
  future_directions: string[];
}

export interface NoveltyResult {
  overall_novelty_risk_score: number;
  problem_overlap_score: number;
  methodology_overlap_score: number;
  dataset_overlap_score: number;
  extracted_concepts: string[];
  extracted_methods: string[];
  extracted_datasets: string[];
  similar_papers: Paper[];
  potentially_distinctive_aspects: string[];
  potentially_unexplored_combinations: string[];
  recommendations: string[];
  disclaimer: string;
}

export interface AssistantResponse {
  answer: string;
  citations: Array<{
    paper_id: string;
    paper_title: string;
    section: string;
    quote: string;
    relevance_score: number;
  }>;
  confidence: number;
  limitations_noted: string[];
  further_reading: Array<{ paper_id: string; title: string; doi: string }>;
}

export interface ReviewResponse {
  title: string;
  citation_style: string;
  abstract: string;
  sections: Array<{ title: string; content: string }>;
  bibliography: string[];
  human_review_notice: string;
}

export interface ComparisonMatrix {
  headers: string[];
  matrix: Array<Record<string, any>>;
  methodology_comparison: Array<{ name: string; papers: string[] }>;
  dataset_comparison: Array<{ name: string; papers: string[] }>;
  conflicting_findings: any[];
  underexplored_combinations: string[];
}

export interface AnalyticsData {
  total_indexed_papers: number;
  total_authors: number;
  total_topics: number;
  top_topics: Array<{
    topic: string;
    growth_rate: number;
    status: string;
    points: Array<{ year: number; paper_count: number; citation_count: number }>;
  }>;
  top_methodologies: Array<{ method: string; count: number }>;
  top_datasets: Array<{ dataset: string; count: number }>;
  publication_year_distribution: Array<{ year: number; count: number }>;
  contradiction_rate: number;
  average_citations_per_paper: number;
}

export const api = {
  // Search
  searchHybrid: async (params: { query: string; limit?: number; filter_year_min?: number; filter_domain?: string }): Promise<SearchResult> => {
    const res = await fetch(`${API_BASE}/search/hybrid`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...params, search_type: "hybrid" }),
    });
    if (!res.ok) throw new Error("Search failed");
    return res.json();
  },

  searchSemantic: async (query: string): Promise<SearchResult> => {
    const res = await fetch(`${API_BASE}/search/semantic`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, search_type: "semantic" }),
    });
    if (!res.ok) throw new Error("Semantic search failed");
    return res.json();
  },

  getAutocomplete: async (q: string): Promise<Array<{ text: string; type: string }>> => {
    if (!q || q.length < 1) return [];
    const res = await fetch(`${API_BASE}/search/autocomplete?q=${encodeURIComponent(q)}`);
    if (!res.ok) return [];
    return res.json();
  },

  // Papers
  getPapers: async (limit: number = 20): Promise<Paper[]> => {
    const res = await fetch(`${API_BASE}/papers?limit=${limit}`);
    if (!res.ok) throw new Error("Failed to load papers");
    return res.json();
  },

  getPaper: async (id: string): Promise<Paper> => {
    const res = await fetch(`${API_BASE}/papers/${id}`);
    if (!res.ok) throw new Error("Paper not found");
    return res.json();
  },

  getRelatedPapers: async (id: string): Promise<Paper[]> => {
    const res = await fetch(`${API_BASE}/papers/${id}/related`);
    if (!res.ok) return [];
    return res.json();
  },

  comparePapers: async (paperIds: string[]): Promise<ComparisonMatrix> => {
    const res = await fetch(`${API_BASE}/papers/compare`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paper_ids: paperIds }),
    });
    if (!res.ok) throw new Error("Comparison failed");
    return res.json();
  },

  // Knowledge Graph
  getGraphData: async (centerId?: string, nodeTypes?: string): Promise<GraphExplorerData> => {
    const params = new URLSearchParams();
    if (centerId) params.append("center_id", centerId);
    if (nodeTypes) params.append("node_types", nodeTypes);
    const res = await fetch(`${API_BASE}/graph/explore?${params.toString()}`);
    if (!res.ok) throw new Error("Failed to fetch graph data");
    return res.json();
  },

  getShortestPath: async (source: string, target: string) => {
    const res = await fetch(`${API_BASE}/graph/path?source=${encodeURIComponent(source)}&target=${encodeURIComponent(target)}`);
    if (!res.ok) throw new Error("Failed to calculate path");
    return res.json();
  },

  // Research Gaps (EWRGS)
  analyzeGaps: async (domain: string = "Artificial Intelligence"): Promise<ResearchGap[]> => {
    const res = await fetch(`${API_BASE}/gaps/analyze?domain=${encodeURIComponent(domain)}`, {
      method: "POST",
    });
    if (!res.ok) throw new Error("Gap analysis failed");
    return res.json();
  },

  // Novelty Auditor
  auditNovelty: async (proposal: { abstract: string; problem?: string; proposed_method?: string; proposed_dataset?: string; expected_contribution?: string }): Promise<NoveltyResult> => {
    const res = await fetch(`${API_BASE}/novelty/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(proposal),
    });
    if (!res.ok) throw new Error("Novelty audit failed");
    return res.json();
  },

  // Assistant / RAG
  askAssistant: async (question: string, paperIds?: string[]): Promise<AssistantResponse> => {
    const res = await fetch(`${API_BASE}/assistant/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, paper_ids: paperIds || [] }),
    });
    if (!res.ok) throw new Error("Assistant failed to respond");
    return res.json();
  },

  // Literature Review
  generateReview: async (paperIds: string[], topic?: string, style: string = "IEEE"): Promise<ReviewResponse> => {
    const res = await fetch(`${API_BASE}/reviews/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paper_ids: paperIds, topic, citation_style: style }),
    });
    if (!res.ok) throw new Error("Review generation failed");
    return res.json();
  },

  // Analytics
  getAnalytics: async (): Promise<AnalyticsData> => {
    const res = await fetch(`${API_BASE}/analytics`);
    if (!res.ok) throw new Error("Failed to fetch analytics");
    return res.json();
  },

  // User Library
  getSavedPapers: async (): Promise<Paper[]> => {
    const res = await fetch(`${API_BASE}/library/saved`);
    if (!res.ok) return [];
    return res.json();
  },

  savePaper: async (paperId: string, status: string = "to_read") => {
    const res = await fetch(`${API_BASE}/library/save?paper_id=${encodeURIComponent(paperId)}&status=${encodeURIComponent(status)}`, {
      method: "POST",
    });
    return res.json();
  },

  getCollections: async () => {
    const res = await fetch(`${API_BASE}/collections`);
    if (!res.ok) return [];
    return res.json();
  },

  createCollection: async (name: string, description?: string) => {
    const res = await fetch(`${API_BASE}/collections`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description }),
    });
    return res.json();
  },
};
