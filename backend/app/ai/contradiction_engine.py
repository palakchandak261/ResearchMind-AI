import re
from typing import List, Dict, Any, Tuple, Optional

class ContradictionDetectionEngine:
    """
    Context-aware Natural Language Inference (NLI) engine for scientific claim contradiction detection.
    Evaluates whether two empirical findings conflict under comparable experimental parameters.
    """
    def __init__(self):
        # Lexical contrast indicators
        self.positive_polarity = {"outperforms", "improves", "increases", "enhances", "superior", "boosts", "achieves state-of-the-art", "higher"}
        self.negative_polarity = {"degrades", "decreases", "fails", "inferior", "worse", "underperforms", "struggles", "lower", "insignificant"}
        
    def evaluate_claim_pair(
        self,
        paper1: Dict[str, Any],
        claim1: Dict[str, Any],
        paper2: Dict[str, Any],
        claim2: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Determines if claim1 and claim2 contradict, support, or are neutral/non-comparable.
        """
        text1 = claim1.get("claim_text", "").lower()
        text2 = claim2.get("claim_text", "").lower()
        
        # Check experimental context comparability: shared datasets or evaluation metrics
        p1_datasets = {(d.get("name", "") if isinstance(d, dict) else str(d)).lower() for d in paper1.get("datasets", [])}
        p2_datasets = {(d.get("name", "") if isinstance(d, dict) else str(d)).lower() for d in paper2.get("datasets", [])}
        shared_datasets = p1_datasets.intersection(p2_datasets)
        
        p1_metrics = {(m.get("name", "") if isinstance(m, dict) else str(m)).lower() for m in paper1.get("evaluation_metrics", [])}
        p2_metrics = {(m.get("name", "") if isinstance(m, dict) else str(m)).lower() for m in paper2.get("evaluation_metrics", [])}
        shared_metrics = p1_metrics.intersection(p2_metrics)
        
        is_comparable = bool(shared_datasets or shared_metrics)
        
        # Detect polarity of outcomes
        p1_pos = any(w in text1 for w in self.positive_polarity)
        p1_neg = any(w in text1 for w in self.negative_polarity)
        
        p2_pos = any(w in text2 for w in self.positive_polarity)
        p2_neg = any(w in text2 for w in self.negative_polarity)
        
        relationship = "NEUTRAL"
        confidence = 0.65
        
        if is_comparable:
            if (p1_pos and p2_neg) or (p1_neg and p2_pos):
                relationship = "CONTRADICTS"
                confidence = 0.88
            elif (p1_pos and p2_pos) or (p1_neg and p2_neg):
                relationship = "SUPPORTS"
                confidence = 0.82
            else:
                relationship = "NEUTRAL"
                confidence = 0.70
        else:
            relationship = "NOT_DIRECTLY_COMPARABLE"
            confidence = 0.50

        return {
            "paper_1_id": paper1["id"],
            "paper_1_title": paper1["title"],
            "paper_1_claim": claim1.get("claim_text", ""),
            "paper_2_id": paper2["id"],
            "paper_2_title": paper2["title"],
            "paper_2_claim": claim2.get("claim_text", ""),
            "nli_relationship": relationship,
            "comparable_context": is_comparable,
            "context_details": {
                "shared_datasets": list(shared_datasets),
                "shared_metrics": list(shared_metrics),
                "domain": paper1.get("research_domain", "AI")
            },
            "confidence": confidence
        }

    def detect_corpus_contradictions(self, papers: List[Dict[str, Any]], max_pairs: int = 15) -> List[Dict[str, Any]]:
        """Scans indexed papers for conflicting empirical claims."""
        findings: List[Dict[str, Any]] = []
        for i in range(len(papers)):
            for j in range(i + 1, len(papers)):
                p1 = papers[i]
                p2 = papers[j]
                
                # Compare claims
                claims1 = p1.get("claims", [])
                claims2 = p2.get("claims", [])
                
                for c1 in claims1:
                    for c2 in claims2:
                        res = self.evaluate_claim_pair(p1, c1, p2, c2)
                        if res["nli_relationship"] == "CONTRADICTS":
                            findings.append(res)
                            if len(findings) >= max_pairs:
                                return findings
        return findings

contradiction_engine = ContradictionDetectionEngine()
