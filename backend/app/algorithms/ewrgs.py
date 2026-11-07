import math
from typing import List, Dict, Any, Optional, Tuple
from collections import defaultdict
from app.core.config import settings

class EWRGSEngine:
    """
    Evidence-Weighted Research Gap Score (EWRGS) Engine.
    
    Formula:
    EWRGS(g) = w1 * U + w2 * T + w3 * D + w4 * L + w5 * C
    
    Where:
    U = Underexploration Score (low co-occurrence relative to domain marginals)
    T = Emerging Trend Score (growth velocity of problem/topic over time)
    D = Diversity Deficit (concentration/dominance of single methodology or dataset)
    L = Limitation Evidence Density (frequency of explicit limitations reported in related literature)
    C = Conflicting/Unresolved Claims (presence of contradictory empirical claims in NLI audit)
    """
    def __init__(
        self,
        w1: float = settings.EWRGS_WEIGHT_U,
        w2: float = settings.EWRGS_WEIGHT_T,
        w3: float = settings.EWRGS_WEIGHT_D,
        w4: float = settings.EWRGS_WEIGHT_L,
        w5: float = settings.EWRGS_WEIGHT_C
    ):
        self.w1 = w1
        self.w2 = w2
        self.w3 = w3
        self.w4 = w4
        self.w5 = w5

    def compute_underexploration(
        self,
        co_occurrence_count: int,
        method_count: int,
        dataset_count: int,
        domain_total_papers: int
    ) -> float:
        """
        Calculates U in [0, 1].
        If a method and dataset are heavily established separately, but rarely or never together,
        the underexploration opportunity is high.
        """
        if domain_total_papers == 0:
            return 0.5
        expected_joint = (method_count * dataset_count) / max(domain_total_papers, 1)
        if expected_joint == 0:
            return 0.8 # Promising unexplored combination
        ratio = co_occurrence_count / max(expected_joint, 0.1)
        # Low ratio -> high underexploration score
        score = 1.0 / (1.0 + math.exp(3.0 * (ratio - 0.5)))
        return round(float(min(max(score, 0.05), 0.98)), 4)

    def compute_trend_velocity(self, recent_years_papers: int, older_years_papers: int) -> float:
        """
        Calculates T in [0, 1].
        Measures if the problem area has accelerating publication growth over recent years.
        """
        total = recent_years_papers + older_years_papers
        if total == 0:
            return 0.5
        growth_rate = recent_years_papers / max(total, 1)
        # Normalized sigmoid around 0.5
        score = 1.0 / (1.0 + math.exp(-6.0 * (growth_rate - 0.5)))
        return round(float(min(max(score, 0.1), 0.95)), 4)

    def compute_diversity_deficit(self, method_frequencies: List[int]) -> float:
        """
        Calculates D in [0, 1].
        High Gini / Herfindahl-Hirschman concentration index implies diversity deficit (reliance on one method).
        """
        if not method_frequencies or sum(method_frequencies) == 0:
            return 0.5
        total = sum(method_frequencies)
        proportions = [f / total for f in method_frequencies]
        # Herfindahl index HHI = sum(p_i^2)
        hhi = sum(p ** 2 for p in proportions)
        # HHI close to 1 means extreme monopoly/low diversity => high deficit score
        return round(float(min(max(hhi, 0.1), 0.95)), 4)

    def compute_limitation_density(self, limitation_mentions: int, paper_count: int) -> float:
        """
        Calculates L in [0, 1].
        Fraction of papers explicitly reporting bottlenecks or unresolved challenges.
        """
        if paper_count == 0:
            return 0.2
        ratio = limitation_mentions / max(paper_count, 1)
        score = min(ratio * 0.85 + 0.15, 0.95)
        return round(float(score), 4)

    def compute_conflict_score(self, contradiction_count: int, claim_pairs_count: int) -> float:
        """
        Calculates C in [0, 1].
        Divergence between published experimental claims.
        """
        if claim_pairs_count == 0:
            return 0.2
        conflict_ratio = contradiction_count / max(claim_pairs_count, 1)
        score = min(conflict_ratio * 1.5 + 0.1, 0.95)
        return round(float(score), 4)

    def evaluate_candidate_gap(
        self,
        domain: str,
        problem: str,
        methodology: str,
        dataset: str,
        domain_papers: List[Dict[str, Any]],
        contradictions: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Generates full EWRGS evaluation with supporting evidence, counterexamples,
        breakdown, and corpus coverage caveats.
        """
        total_domain_papers = len(domain_papers)
        
        # 1. Gather occurrences
        method_papers = [p for p in domain_papers if methodology.lower() in [(m.get("name") if isinstance(m, dict) else str(m)).lower() for m in p.get("methodologies", [])]]
        dataset_papers = [p for p in domain_papers if dataset.lower() in [(d.get("name") if isinstance(d, dict) else str(d)).lower() for d in p.get("datasets", [])]]
        joint_papers = [p for p in method_papers if p["id"] in {dp["id"] for dp in dataset_papers}]
        
        # 2. Trend analysis (split 2024+ vs earlier)
        recent_papers = [p for p in domain_papers if (p.get("publication_year") or 2020) >= 2023]
        older_papers = [p for p in domain_papers if (p.get("publication_year") or 2020) < 2023]
        
        # 3. Method distribution in this domain
        method_counts = defaultdict(int)
        for p in domain_papers:
            for m in p.get("methodologies", []):
                m_name = m.get("name") if isinstance(m, dict) else str(m)
                method_counts[m_name] += 1
                
        # 4. Limitations cited
        limitation_hits = []
        for p in domain_papers:
            for lim in p.get("limitations_list", []):
                if any(kw in lim.lower() for kw in [methodology.lower(), dataset.lower(), problem.lower(), "scalab", "robust", "generaliz", "bias", "cost", "latency"]):
                    limitation_hits.append({"paper_id": p["id"], "paper_title": p["title"], "quote": lim})

        # 5. Contradictions relevant
        relevant_conflicts = [
            c for c in contradictions 
            if (methodology.lower() in str(c).lower() or dataset.lower() in str(c).lower())
        ]

        # Calculate normalized scores
        score_u = self.compute_underexploration(len(joint_papers), len(method_papers), len(dataset_papers), total_domain_papers)
        score_t = self.compute_trend_velocity(len(recent_papers), len(older_papers))
        score_d = self.compute_diversity_deficit(list(method_counts.values()))
        score_l = self.compute_limitation_density(len(limitation_hits), total_domain_papers)
        score_c = self.compute_conflict_score(len(relevant_conflicts), max(len(domain_papers), 1))

        # Weighted EWRGS
        ewrgs = (
            self.w1 * score_u +
            self.w2 * score_t +
            self.w3 * score_d +
            self.w4 * score_l +
            self.w5 * score_c
        )
        ewrgs = round(float(ewrgs), 4)

        # Confidence based on sample support size
        confidence = round(min(0.5 + (total_domain_papers / 50.0) * 0.4, 0.95), 2)

        # Supporting papers: papers that report limitations or call for this combination
        supporting_papers = []
        for lim in limitation_hits[:4]:
            supporting_papers.append({
                "paper_id": lim["paper_id"],
                "paper_title": lim["paper_title"],
                "evidence_type": "limitation_citation",
                "explanation": f"Paper explicitly documented limitations in existing approaches: \"{lim['quote']}\"",
                "quote": lim["quote"]
            })
            
        # Counterevidence: existing papers that DID explore this exact method/dataset combination
        counterevidence_papers = []
        for p in joint_papers[:3]:
            counterevidence_papers.append({
                "paper_id": p["id"],
                "paper_title": p["title"],
                "paper_year": p.get("publication_year"),
                "evidence_type": "counterexample",
                "explanation": f"Already investigated '{methodology}' on '{dataset}' ({p.get('publication_year')}). Check if problem formulation differs.",
                "quote": p.get("abstract", "")[:180] + "..."
            })

        # Corpus coverage warning
        coverage_warning = (
            f"Based on {total_domain_papers} indexed publications in '{domain}'. "
            f"High score ({ewrgs}) indicates that '{methodology}' + '{dataset}' is rarely integrated relative to its individual prominence, "
            f"with {len(limitation_hits)} reported bottlenecks. This warrants scientific investigation but does not prove global novelty."
        )

        future_directions = [
            f"Benchmark {methodology} against baseline architectures specifically on {dataset} to quantify robustness gaps.",
            f"Investigate cross-domain transfer learning to mitigate reported limitations: {limitation_hits[0]['quote'] if limitation_hits else 'computational overhead and sample complexity'}.",
            f"Evaluate standardized evaluation metrics to resolve empirical discrepancies observed across recent literature."
        ]

        title = f"Application of {methodology} to {dataset} for {problem}"
        description = (
            f"While {methodology} is widely adopted across {domain} ({len(method_papers)} indexed papers) "
            f"and {dataset} represents a benchmark evaluation dataset ({len(dataset_papers)} indexed papers), "
            f"their joint application has only {len(joint_papers)} prior investigations. "
            f"Reported literature notes significant performance and reproducibility bottlenecks in standard configurations."
        )

        return {
            "title": title,
            "domain": domain,
            "problem": problem,
            "methodology": methodology,
            "dataset": dataset,
            "description": description,
            "ewrgs_score": ewrgs,
            "score_underexploration": score_u,
            "score_trend": score_t,
            "score_diversity_deficit": score_d,
            "score_limitation": score_l,
            "score_conflict": score_c,
            "confidence": confidence,
            "corpus_coverage_warning": coverage_warning,
            "supporting_papers": supporting_papers,
            "counterevidence_papers": counterevidence_papers,
            "future_directions": future_directions
        }

ewrgs_engine = EWRGSEngine()
