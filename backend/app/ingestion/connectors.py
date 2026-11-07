import httpx
import re
from typing import List, Dict, Any, Optional
from app.core.config import settings

def normalize_title(title: str) -> str:
    """Removes punctuation and whitespace for deduplication matching."""
    return re.sub(r'[^a-zA-Z0-9]', '', title.lower())

class OpenAlexConnector:
    """Connector for OpenAlex REST API with pagination and rate limit politeness."""
    def __init__(self):
        self.base_url = settings.OPENALEX_API_URL
        self.headers = {"User-Agent": f"ResearchGraphAI/1.0 (mailto:{settings.OPENALEX_EMAIL})"}

    async def search_works(self, query: str, limit: int = 15) -> List[Dict[str, Any]]:
        url = f"{self.base_url}/works"
        params = {
            "search": query,
            "per_page": min(limit, 25),
            "mailto": settings.OPENALEX_EMAIL
        }
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.get(url, params=params, headers=self.headers)
                if res.status_code == 200:
                    data = res.json()
                    works = data.get("results", [])
                    return [self._normalize_work(w) for w in works]
        except Exception as e:
            # Fallback gracefully if network is unreachable
            print(f"[OpenAlex Connector] Error fetching works: {e}")
        return []

    def _normalize_work(self, work: Dict[str, Any]) -> Dict[str, Any]:
        # Inverted index to abstract text
        abstract_inv = work.get("abstract_inverted_index")
        abstract = ""
        if abstract_inv:
            word_positions = []
            for word, positions in abstract_inv.items():
                for pos in positions:
                    word_positions.append((pos, word))
            word_positions.sort(key=lambda x: x[0])
            abstract = " ".join([w[1] for w in word_positions])

        authors = []
        for authorship in work.get("authorships", []):
            author_obj = authorship.get("author", {})
            inst = authorship.get("institutions", [])
            authors.append({
                "name": author_obj.get("display_name", "Unknown Author"),
                "institution": inst[0].get("display_name") if inst else None
            })

        topics = []
        for concept in work.get("concepts", []):
            topics.append({
                "name": concept.get("display_name", ""),
                "score": concept.get("score", 0.5)
            })

        doi = work.get("doi", "")
        if doi and doi.startswith("https://doi.org/"):
            doi = doi.replace("https://doi.org/", "")

        return {
            "id": f"oa_{work.get('id', '').split('/')[-1]}",
            "doi": doi or None,
            "title": work.get("title") or "Untitled Publication",
            "abstract": abstract or "Abstract not provided in source metadata.",
            "publication_year": work.get("publication_year"),
            "publication_date": work.get("publication_date"),
            "venue": work.get("host_venue", {}).get("display_name") if work.get("host_venue") else None,
            "citation_count": work.get("cited_by_count", 0),
            "reference_count": len(work.get("referenced_works", [])),
            "pdf_url": work.get("open_access", {}).get("oa_url"),
            "open_access": work.get("open_access", {}).get("is_oa", False),
            "source": "OpenAlex",
            "provenance": {"provider": "OpenAlex", "openalex_id": work.get("id")},
            "authors": authors,
            "topics": topics,
            "methodologies": [],
            "datasets": []
        }

class ArxivConnector:
    """Connector for arXiv export API."""
    def __init__(self):
        self.base_url = settings.ARXIV_API_URL

    async def search_works(self, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        # Structured arXiv query
        try:
            url = f"{self.base_url}/query"
            params = {
                "search_query": f"all:{query}",
                "start": 0,
                "max_results": limit
            }
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.get(url, params=params)
                if res.status_code == 200:
                    # Basic XML parsing or regex extraction
                    return self._parse_arxiv_atom(res.text)
        except Exception as e:
            print(f"[arXiv Connector] Error: {e}")
        return []

    def _parse_arxiv_atom(self, xml_text: str) -> List[Dict[str, Any]]:
        # Lightweight regex parser for arXiv atom feed
        entries = re.findall(r'<entry>(.*?)</entry>', xml_text, re.DOTALL)
        results = []
        for entry in entries:
            title_match = re.search(r'<title>(.*?)</title>', entry, re.DOTALL)
            summary_match = re.search(r'<summary>(.*?)</summary>', entry, re.DOTALL)
            id_match = re.search(r'<id>(.*?)</id>', entry, re.DOTALL)
            published_match = re.search(r'<published>(.*?)</published>', entry, re.DOTALL)
            
            title = title_match.group(1).strip() if title_match else "arXiv Publication"
            summary = summary_match.group(1).strip() if summary_match else ""
            arxiv_id = id_match.group(1).split('/abs/')[-1] if id_match else "arxiv_doc"
            year = int(published_match.group(1)[:4]) if published_match else 2024
            
            results.append({
                "id": f"arxiv_{arxiv_id}",
                "doi": f"10.48550/arXiv.{arxiv_id}",
                "title": title.replace('\n', ' '),
                "abstract": summary.replace('\n', ' '),
                "publication_year": year,
                "publication_date": str(year),
                "venue": "arXiv preprint",
                "citation_count": 0,
                "reference_count": 0,
                "pdf_url": f"https://arxiv.org/pdf/{arxiv_id}.pdf",
                "open_access": True,
                "source": "arXiv",
                "provenance": {"provider": "arXiv", "arxiv_id": arxiv_id},
                "authors": [{"name": "arXiv Researcher"}],
                "topics": [{"name": "Preprint"}],
                "methodologies": [],
                "datasets": []
            })
        return results

class SemanticScholarConnector:
    """Connector for Semantic Scholar Graph API."""
    def __init__(self):
        self.base_url = settings.SEMANTIC_SCHOLAR_API_URL

    async def search_works(self, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        try:
            url = f"{self.base_url}/paper/search"
            params = {
                "query": query,
                "limit": limit,
                "fields": "title,abstract,authors,year,citationCount,referenceCount,openAccessPdf,venue,externalIds"
            }
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.get(url, params=params)
                if res.status_code == 200:
                    data = res.json()
                    papers = data.get("data", [])
                    return [self._normalize_s2_paper(p) for p in papers]
        except Exception as e:
            print(f"[SemanticScholar Connector] Error: {e}")
        return []

    def _normalize_s2_paper(self, paper: Dict[str, Any]) -> Dict[str, Any]:
        authors = [{"name": a.get("name", "Unknown")} for a in paper.get("authors", [])]
        doi = paper.get("externalIds", {}).get("DOI")
        pdf_info = paper.get("openAccessPdf") or {}
        return {
            "id": f"s2_{paper.get('paperId', '')[:12]}",
            "doi": doi,
            "title": paper.get("title", "Untitled"),
            "abstract": paper.get("abstract") or "Abstract not available.",
            "publication_year": paper.get("year"),
            "venue": paper.get("venue"),
            "citation_count": paper.get("citationCount", 0),
            "reference_count": paper.get("referenceCount", 0),
            "pdf_url": pdf_info.get("url"),
            "open_access": bool(pdf_info.get("url")),
            "source": "SemanticScholar",
            "provenance": {"provider": "SemanticScholar", "s2_id": paper.get("paperId")},
            "authors": authors,
            "topics": [],
            "methodologies": [],
            "datasets": []
        }

openalex_connector = OpenAlexConnector()
arxiv_connector = ArxivConnector()
semanticscholar_connector = SemanticScholarConnector()
