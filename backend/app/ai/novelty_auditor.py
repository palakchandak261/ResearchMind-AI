import re
from typing import List, Dict, Any
from app.ai.vector_engine import vector_engine

class ResearchNoveltyAuditor:
    """
    Scientific Proposal Novelty Auditor.
    Assesses conceptual, methodological, and dataset overlap against indexed literature.
    Provides evidence-backed distinctive angles, counterexamples, and critical guidance.
    """
    def __init__(self):
        pass

    def extract_key_terms(self, text: str) -> List[str]:
        words = re.findall(r'\b[A-Za-z0-9_-]{3,}\b', text.lower())
        stopwords = {"the", "and", "for", "with", "that", "this", "from", "using", "paper", "propose", "study", "approach", "method"}
        return list(dict.fromkeys([w for w in words if w not in stopwords]))[:12]

    def audit_proposal(
        self,
        abstract: str,
        problem: str,
        proposed_method: str,
        proposed_dataset: str,
        expected_contribution: str,
        indexed_papers: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        combined_text = f"{abstract} {problem} {proposed_method} {proposed_dataset} {expected_contribution}"
        extracted_concepts = self.extract_key_terms(combined_text)
        
        # 1. Retrieve similar papers via semantic vector search
        search_hits = vector_engine.semantic_search(combined_text, top_k=10)
        hit_ids = {doc_id: score for doc_id, score in search_hits}
        
        matched_papers = []
        for p in indexed_papers:
            if p["id"] in hit_ids:
                p_copy = dict(p)
                p_copy["relevance_score"] = hit_ids[p["id"]]
                matched_papers.append(p_copy)
                
        # Sort by relevance score
        matched_papers.sort(key=lambda x: x.get("relevance_score", 0.0), reverse=True)
        top_similar = matched_papers[:5]

        # 2. Overlap dimensions
        method_lower = (proposed_method or "").lower()
        dataset_lower = (proposed_dataset or "").lower()
        problem_lower = (problem or "").lower()

        method_overlap_count = 0
        dataset_overlap_count = 0
        problem_overlap_count = 0

        for p in matched_papers:
            # Check methodology match
            p_methods = [(m.get("name", "") if isinstance(m, dict) else str(m)).lower() for m in p.get("methodologies", [])]
            if any(method_lower in m or m in method_lower for m in p_methods if method_lower):
                method_overlap_count += 1
                
            # Check dataset match
            p_datasets = [(d.get("name", "") if isinstance(d, dict) else str(d)).lower() for d in p.get("datasets", [])]
            if any(dataset_lower in d or d in dataset_lower for d in p_datasets if dataset_lower):
                dataset_overlap_count += 1
                
            # Check problem match
            if problem_lower and (problem_lower in p.get("title", "").lower() or problem_lower in p.get("abstract", "").lower()):
                problem_overlap_count += 1

        total_sample = max(len(matched_papers), 1)
        method_score = round(min(method_overlap_count / total_sample, 1.0), 3)
        dataset_score = round(min(dataset_overlap_count / total_sample, 1.0), 3)
        problem_score = round(min(problem_overlap_count / total_sample, 1.0), 3)

        # Average semantic top score
        top_sem = matched_papers[0].get("relevance_score", 0.6) if matched_papers else 0.5
        
        # Novelty Risk: high overlap = high risk of duplicating existing works
        novelty_risk_score = round(0.4 * top_sem + 0.3 * method_score + 0.3 * dataset_score, 3)

        # 3. Potentially distinctive aspects
        distinctive_aspects = []
        if method_score < 0.3:
            distinctive_aspects.append(f"Methodological novelty: '{proposed_method}' is rarely paired with indexed problem formulations in this corpus.")
        if dataset_score < 0.2:
            distinctive_aspects.append(f"Dataset application: '{proposed_dataset}' offers an underexplored empirical benchmark for this domain.")
        if expected_contribution:
            distinctive_aspects.append(f"Declared contribution focus: '{expected_contribution[:80]}...' targets an operational niche.")

        if not distinctive_aspects:
            distinctive_aspects.append("The proposal strongly mirrors established conventions. Focus on unique ablation studies or cross-domain evaluations.")

        # 4. Potentially unexplored combinations
        unexplored_combinations = [
            f"Evaluate {proposed_method or 'proposed architecture'} under adversarial or out-of-distribution shifts.",
            f"Cross-validate on heterogeneous multi-modal benchmarks rather than strictly standard {proposed_dataset or 'standard test sets'}.",
            f"Incorporate formal ablation isolating the exact parameter efficiency gains."
        ]

        # 5. Recommendations
        recommendations = [
            f"Conduct rigorous direct benchmarking against '{top_similar[0]['title'] if top_similar else 'prominent baseline papers'}' to substantiate delta claims.",
            "Clearly articulate trade-offs: computational budget, latency, parameter count, and sample efficiency.",
            "Verify whether published limitations of preceding papers are directly addressed by your pipeline."
        ]

        return {
            "overall_novelty_risk_score": novelty_risk_score,
            "problem_overlap_score": problem_score,
            "methodology_overlap_score": method_score,
            "dataset_overlap_score": dataset_score,
            "extracted_concepts": extracted_concepts,
            "extracted_methods": [proposed_method] if proposed_method else [],
            "extracted_datasets": [proposed_dataset] if proposed_dataset else [],
            "similar_papers": top_similar,
            "potentially_distinctive_aspects": distinctive_aspects,
            "potentially_unexplored_combinations": unexplored_combinations,
            "recommendations": recommendations,
            "disclaimer": "CRITICAL NOTICE: ResearchGraph AI evaluates conceptual and empirical overlap against indexed publications. This audit does not constitute legal proof of patentability, intellectual originality, or peer-review acceptance."
        }

novelty_auditor = ResearchNoveltyAuditor()
