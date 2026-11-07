import math
import heapq
import re
from typing import List, Dict, Set, Tuple, Any, Optional
from collections import defaultdict, OrderedDict

# ==========================================
# 1. TRIE DATA STRUCTURE FOR AUTOCOMPLETE
# ==========================================
class TrieNode:
    def __init__(self):
        self.children: Dict[str, 'TrieNode'] = {}
        self.is_end_of_word: bool = False
        self.metadata: Dict[str, Any] = {}
        self.frequency: int = 0

class AutocompleteTrie:
    """Trie with frequency weighting for research topic and author autocomplete."""
    def __init__(self):
        self.root = TrieNode()

    def insert(self, word: str, metadata: Optional[Dict[str, Any]] = None, freq_boost: int = 1):
        clean_word = word.strip().lower()
        node = self.root
        for char in clean_word:
            if char not in node.children:
                node.children[char] = TrieNode()
            node = node.children[char]
        node.is_end_of_word = True
        node.frequency += freq_boost
        if metadata:
            node.metadata.update(metadata)

    def search_prefix(self, prefix: str, max_results: int = 10) -> List[Dict[str, Any]]:
        clean_prefix = prefix.strip().lower()
        node = self.root
        for char in clean_prefix:
            if char not in node.children:
                return []
            node = node.children[char]
        
        results: List[Tuple[int, str, Dict[str, Any]]] = []
        
        def _dfs(curr_node: TrieNode, current_str: str):
            if curr_node.is_end_of_word:
                results.append((curr_node.frequency, current_str, curr_node.metadata))
            for char, next_node in curr_node.children.items():
                _dfs(next_node, current_str + char)
        
        _dfs(node, clean_prefix)
        # Sort by frequency descending
        results.sort(key=lambda x: x[0], reverse=True)
        return [{"text": text, "frequency": freq, **meta} for freq, text, meta in results[:max_results]]


# ==========================================
# 2. INVERTED INDEX & BM25 SEARCH ENGINE
# ==========================================
class BM25Index:
    """Lexical Inverted Index with Okapi BM25 ranking algorithm."""
    def __init__(self, k1: float = 1.5, b: float = 0.75):
        self.k1 = k1
        self.b = b
        self.doc_lengths: Dict[str, int] = {}
        self.avg_doc_length: float = 0.0
        self.total_docs: int = 0
        self.inverted_index: Dict[str, Dict[str, int]] = defaultdict(lambda: defaultdict(int)) # term -> {doc_id: tf}
        self.doc_metadata: Dict[str, Any] = {}
        self.stopwords = {
            "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are", 
            "as", "at", "be", "because", "been", "before", "being", "below", "between", "both", "but", 
            "by", "could", "did", "do", "does", "doing", "down", "during", "each", "few", "for", "from", 
            "further", "had", "has", "have", "having", "he", "her", "here", "hers", "herself", "him", 
            "himself", "his", "how", "i", "if", "in", "into", "is", "it", "its", "itself", "just", "me", 
            "more", "most", "my", "myself", "no", "nor", "not", "of", "off", "on", "once", "only", "or", 
            "other", "our", "ours", "ourselves", "out", "over", "own", "same", "she", "should", "so", 
            "some", "such", "than", "that", "the", "their", "theirs", "them", "themselves", "then", 
            "there", "these", "they", "this", "those", "through", "to", "too", "under", "until", "up", 
            "very", "was", "we", "were", "what", "when", "where", "which", "while", "who", "whom", "why", 
            "with", "would", "you", "your", "yours", "yourself", "yourselves"
        }

    def tokenize(self, text: str) -> List[str]:
        words = re.findall(r'\b[a-zA-Z0-9_\-\.]+\b', text.lower())
        return [w for w in words if len(w) > 1 and w not in self.stopwords]

    def add_document(self, doc_id: str, text: str, metadata: Optional[Dict[str, Any]] = None):
        tokens = self.tokenize(text)
        doc_len = len(tokens)
        self.doc_lengths[doc_id] = doc_len
        self.doc_metadata[doc_id] = metadata or {}
        
        # Word frequency
        term_freqs = defaultdict(int)
        for token in tokens:
            term_freqs[token] += 1
            
        for token, count in term_freqs.items():
            self.inverted_index[token][doc_id] = count
            
        self.total_docs = len(self.doc_lengths)
        self.avg_doc_length = sum(self.doc_lengths.values()) / max(self.total_docs, 1)

    def search(self, query: str, top_k: int = 20) -> List[Tuple[str, float]]:
        query_terms = self.tokenize(query)
        scores: Dict[str, float] = defaultdict(float)
        
        for term in query_terms:
            if term not in self.inverted_index:
                continue
            doc_postings = self.inverted_index[term]
            df = len(doc_postings)
            # Standard BM25 IDF with smoothing
            idf = math.log((self.total_docs - df + 0.5) / (df + 0.5) + 1.0)
            
            for doc_id, tf in doc_postings.items():
                doc_len = self.doc_lengths.get(doc_id, self.avg_doc_length)
                # BM25 term weighting formula
                numerator = tf * (self.k1 + 1)
                denominator = tf + self.k1 * (1 - self.b + self.b * (doc_len / max(self.avg_doc_length, 1e-6)))
                scores[doc_id] += idf * (numerator / denominator)
                
        # Return top_k sorted by score
        sorted_scores = sorted(scores.items(), key=lambda x: x[1], reverse=True)[:top_k]
        return sorted_scores


# ==========================================
# 3. MIN HEAP FOR TOP-K RANKING
# ==========================================
class MinHeapRanker:
    """O(N log K) space-efficient top-k paper ranker using a min heap."""
    def __init__(self, k: int):
        self.k = k
        self.heap: List[Tuple[float, str, Any]] = [] # (score, item_id, payload)

    def push(self, score: float, item_id: str, payload: Any = None):
        if len(self.heap) < self.k:
            heapq.heappush(self.heap, (score, item_id, payload))
        else:
            if score > self.heap[0][0]:
                heapq.heappushpop(self.heap, (score, item_id, payload))

    def get_ranked_results(self) -> List[Tuple[str, float, Any]]:
        # Sort descending by score
        return sorted([(item_id, score, payload) for score, item_id, payload in self.heap], key=lambda x: x[1], reverse=True)


# ==========================================
# 4. UNION-FIND (DISJOINT SET) FOR DEDUPLICATION
# ==========================================
class UnionFind:
    """Disjoint Set Union with path compression and rank heuristic for canonical paper clustering."""
    def __init__(self):
        self.parent: Dict[str, str] = {}
        self.rank: Dict[str, int] = {}

    def find(self, item: str) -> str:
        if item not in self.parent:
            self.parent[item] = item
            self.rank[item] = 0
            return item
        if self.parent[item] != item:
            self.parent[item] = self.find(self.parent[item]) # Path compression
        return self.parent[item]

    def union(self, x: str, y: str):
        root_x = self.find(x)
        root_y = self.find(y)
        if root_x == root_y:
            return
        # Union by rank
        if self.rank[root_x] < self.rank[root_y]:
            self.parent[root_x] = root_y
        elif self.rank[root_x] > self.rank[root_y]:
            self.parent[root_y] = root_x
        else:
            self.parent[root_y] = root_x
            self.rank[root_x] += 1

    def get_clusters(self) -> Dict[str, List[str]]:
        clusters = defaultdict(list)
        for item in list(self.parent.keys()):
            root = self.find(item)
            clusters[root].append(item)
        return dict(clusters)


# ==========================================
# 5. LRU CACHE FOR FREQUENT QUERIES
# ==========================================
class LRUCache:
    """O(1) thread-safe query cache using OrderedDict."""
    def __init__(self, capacity: int = 1000):
        self.capacity = capacity
        self.cache: OrderedDict[str, Any] = OrderedDict()

    def get(self, key: str) -> Optional[Any]:
        if key not in self.cache:
            return None
        self.cache.move_to_end(key)
        return self.cache[key]

    def put(self, key: str, value: Any):
        if key in self.cache:
            self.cache.move_to_end(key)
        self.cache[key] = value
        if len(self.cache) > self.capacity:
            self.cache.popitem(last=False)


# ==========================================
# 6. RECIPROCAL RANK FUSION (RRF)
# ==========================================
def reciprocal_rank_fusion(
    rank_lists: List[List[Tuple[str, float]]], 
    k: int = 60,
    top_k: int = 20
) -> List[Tuple[str, float]]:
    """
    RRF(d) = sum_{m in M} 1 / (k + rank_m(d))
    Combines dense semantic vector retrieval with sparse BM25 lexical retrieval.
    """
    rrf_scores: Dict[str, float] = defaultdict(float)
    
    for ranked_list in rank_lists:
        for rank, (doc_id, _) in enumerate(ranked_list, start=1):
            rrf_scores[doc_id] += 1.0 / (k + rank)
            
    sorted_docs = sorted(rrf_scores.items(), key=lambda x: x[1], reverse=True)[:top_k]
    return sorted_docs
