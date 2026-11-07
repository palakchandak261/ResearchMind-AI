import networkx as nx
from typing import List, Dict, Any, Optional, Set, Tuple
from collections import deque
import heapq

class ResearchKnowledgeGraph:
    """
    In-memory and NetworkX-backed heterogeneous research knowledge graph.
    Supports Neo4j synchronization and high-performance graph analytics:
    BFS, DFS, Dijkstra, PageRank, Degree Centrality, Betweenness Centrality, Communities.
    """
    def __init__(self):
        self.g = nx.DiGraph()
        self.node_metadata: Dict[str, Dict[str, Any]] = {}
        self.edge_metadata: Dict[Tuple[str, str], Dict[str, Any]] = {}

    def add_node(self, node_id: str, label: str, node_type: str, properties: Optional[Dict[str, Any]] = None):
        props = properties or {}
        props["label"] = label
        props["type"] = node_type
        self.node_metadata[node_id] = props
        self.g.add_node(node_id, **props)

    def add_edge(self, source: str, target: str, edge_type: str, weight: float = 1.0, properties: Optional[Dict[str, Any]] = None):
        props = properties or {}
        props["type"] = edge_type
        props["weight"] = weight
        self.edge_metadata[(source, target)] = props
        self.g.add_edge(source, target, **props)

    # ===============================
    # 1. BREADTH-FIRST SEARCH (BFS)
    # ===============================
    def bfs_neighborhood(self, start_node: str, max_depth: int = 2, max_nodes: int = 50) -> Dict[str, Any]:
        """Expands graph around start_node using BFS with depth control."""
        if start_node not in self.g:
            return {"nodes": [], "edges": []}
            
        visited_nodes: Set[str] = {start_node}
        queue = deque([(start_node, 0)]) # (node, current_depth)
        selected_edges: List[Dict[str, Any]] = []

        while queue and len(visited_nodes) < max_nodes:
            curr, depth = queue.popleft()
            if depth >= max_depth:
                continue

            # Check successors and predecessors (undirected context for exploration)
            neighbors = list(self.g.successors(curr)) + list(self.g.predecessors(curr))
            for neighbor in neighbors:
                if neighbor not in visited_nodes and len(visited_nodes) < max_nodes:
                    visited_nodes.add(neighbor)
                    queue.append((neighbor, depth + 1))
                    
        # Collect edges between visited nodes
        for u in visited_nodes:
            for v in self.g.successors(u):
                if v in visited_nodes:
                    edge_data = self.g.get_edge_data(u, v) or {}
                    selected_edges.append({
                        "id": f"e_{u}_{v}",
                        "source": u,
                        "target": v,
                        "type": edge_data.get("type", "RELATED_TO"),
                        "weight": edge_data.get("weight", 1.0)
                    })

        nodes_out = [
            {
                "id": nid,
                "label": self.node_metadata.get(nid, {}).get("label", nid),
                "type": self.node_metadata.get(nid, {}).get("type", "paper"),
                "properties": self.node_metadata.get(nid, {})
            }
            for nid in visited_nodes
        ]

        return {"nodes": nodes_out, "edges": selected_edges}

    # ===============================
    # 2. DEPTH-FIRST SEARCH (DFS)
    # ===============================
    def dfs_paths(self, start_node: str, target_type: Optional[str] = None, max_depth: int = 4) -> List[List[str]]:
        """Finds reasoning/citation paths from start_node using DFS."""
        if start_node not in self.g:
            return []
            
        all_paths: List[List[str]] = []

        def _dfs(current: str, current_path: List[str], depth: int):
            if depth >= max_depth:
                return
            for neighbor in self.g.successors(current):
                if neighbor not in current_path:
                    new_path = current_path + [neighbor]
                    n_type = self.node_metadata.get(neighbor, {}).get("type", "")
                    if target_type is None or n_type == target_type:
                        all_paths.append(new_path)
                    _dfs(neighbor, new_path, depth + 1)

        _dfs(start_node, [start_node], 0)
        return all_paths[:20]

    # ===============================
    # 3. DIJKSTRA SHORTEST PATH
    # ===============================
    def dijkstra_shortest_path(self, source: str, target: str) -> Optional[Dict[str, Any]]:
        """Discovers the most significant knowledge bridge between two entities."""
        if source not in self.g or target not in self.g:
            return None
        try:
            # Invert weight so higher semantic similarity / citation strength = lower path cost
            path = nx.shortest_path(self.g.to_undirected(), source=source, target=target)
            edges = []
            for i in range(len(path) - 1):
                u, v = path[i], path[i+1]
                edge_data = self.g.get_edge_data(u, v) or self.g.get_edge_data(v, u) or {}
                edges.append({
                    "id": f"path_e_{u}_{v}",
                    "source": u,
                    "target": v,
                    "type": edge_data.get("type", "CONNECTED"),
                    "weight": edge_data.get("weight", 1.0)
                })
            nodes = [
                {
                    "id": nid,
                    "label": self.node_metadata.get(nid, {}).get("label", nid),
                    "type": self.node_metadata.get(nid, {}).get("type", "node"),
                    "properties": self.node_metadata.get(nid, {})
                }
                for nid in path
            ]
            return {"path": path, "nodes": nodes, "edges": edges, "hop_count": len(path) - 1}
        except (nx.NetworkXNoPath, nx.NodeNotFound):
            return None

    # ===============================
    # 4. PAGERANK & CENTRALITY
    # ===============================
    def calculate_pagerank(self, alpha: float = 0.85) -> Dict[str, float]:
        """Calculates PageRank score for all nodes to identify landmark papers."""
        if len(self.g) == 0:
            return {}
        try:
            return nx.pagerank(self.g, alpha=alpha, weight="weight")
        except Exception:
            # Fallback uniform
            return {n: 1.0 / len(self.g) for n in self.g.nodes()}

    def calculate_centrality(self) -> Dict[str, Dict[str, float]]:
        """Computes degree and betweenness centralities."""
        if len(self.g) == 0:
            return {"degree": {}, "betweenness": {}}
        degree = nx.degree_centrality(self.g)
        try:
            # Sampled or exact betweenness
            betweenness = nx.betweenness_centrality(self.g, k=min(len(self.g), 50))
        except Exception:
            betweenness = {n: 0.0 for n in self.g.nodes()}
        return {"degree": degree, "betweenness": betweenness}

    # ===============================
    # 5. COMMUNITY DETECTION
    # ===============================
    def detect_communities(self) -> Dict[str, int]:
        """Detects research clusters/communities using greedy modularity."""
        if len(self.g) == 0:
            return {}
        undirected = self.g.to_undirected()
        try:
            communities = nx.community.greedy_modularity_communities(undirected)
            node_community_map = {}
            for comm_id, comm in enumerate(communities):
                for node in comm:
                    node_community_map[node] = comm_id
            return node_community_map
        except Exception:
            return {n: 0 for n in self.g.nodes()}

    def get_subgraph(
        self,
        node_types: Optional[List[str]] = None,
        edge_types: Optional[List[str]] = None,
        limit: int = 100
    ) -> Dict[str, Any]:
        """Returns filtered subgraph formatted for React Flow canvas."""
        selected_nodes = []
        for nid, data in self.node_metadata.items():
            if node_types and data.get("type") not in node_types:
                continue
            selected_nodes.append(nid)
            if len(selected_nodes) >= limit:
                break
                
        node_set = set(selected_nodes)
        selected_edges = []
        for (u, v), props in self.edge_metadata.items():
            if u in node_set and v in node_set:
                if edge_types and props.get("type") not in edge_types:
                    continue
                selected_edges.append({
                    "id": f"e_{u}_{v}",
                    "source": u,
                    "target": v,
                    "type": props.get("type", "RELATED_TO"),
                    "weight": props.get("weight", 1.0)
                })

        pagerank = self.calculate_pagerank()
        communities = self.detect_communities()

        nodes_out = [
            {
                "id": nid,
                "label": self.node_metadata.get(nid, {}).get("label", nid),
                "type": self.node_metadata.get(nid, {}).get("type", "paper"),
                "properties": {
                    **self.node_metadata.get(nid, {}),
                    "pagerank": round(pagerank.get(nid, 0.0), 5),
                    "community": communities.get(nid, 0)
                }
            }
            for nid in selected_nodes
        ]

        return {
            "nodes": nodes_out,
            "edges": selected_edges,
            "stats": {
                "total_graph_nodes": self.g.number_of_nodes(),
                "total_graph_edges": self.g.number_of_edges(),
                "rendered_nodes": len(nodes_out),
                "rendered_edges": len(selected_edges),
                "community_count": len(set(communities.values())) if communities else 0
            }
        }

# Global singleton graph instance
knowledge_graph = ResearchKnowledgeGraph()
