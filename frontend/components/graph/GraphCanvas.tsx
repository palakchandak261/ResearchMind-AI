'use client';
import { useCallback, useEffect, useState } from 'react';
import ReactFlow, {
  Node, Edge, Controls, Background, MiniMap,
  useNodesState, useEdgesState,
  MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';
import { api, GraphNode, GraphEdge } from '@/lib/api';
import { Search, Info, Network, Users, Tag, Wrench, Database } from 'lucide-react';

const nodeTypeColors: Record<string, string> = {
  paper: '#2563eb', author: '#7c3aed', topic: '#0d9488', methodology: '#ea580c', dataset: '#16a34a',
};
const nodeTypeBg: Record<string, string> = {
  paper: '#dbeafe', author: '#ede9fe', topic: '#ccfbf1', methodology: '#ffedd5', dataset: '#dcfce7',
};
const typeIcons: Record<string, any> = { paper: Network, author: Users, topic: Tag, methodology: Wrench, dataset: Database };

function toReactFlowNodes(gNodes: GraphNode[]): Node[] {
  return gNodes.map((n, i) => ({
    id: n.id,
    type: 'default',
    position: {
      x: 400 + Math.cos((i / gNodes.length) * 2 * Math.PI) * 320,
      y: 300 + Math.sin((i / gNodes.length) * 2 * Math.PI) * 220,
    },
    data: { label: n.label.length > 22 ? n.label.slice(0, 22) + '…' : n.label, fullLabel: n.label, type: n.type, properties: n.properties },
    style: {
      background: nodeTypeBg[n.type] || '#f1f5f9',
      border: `2px solid ${nodeTypeColors[n.type] || '#94a3b8'}`,
      borderRadius: 10,
      padding: '8px 12px',
      fontSize: 11,
      fontWeight: 600,
      color: nodeTypeColors[n.type] || '#475569',
      maxWidth: 160,
    },
  }));
}

function toReactFlowEdges(gEdges: GraphEdge[]): Edge[] {
  return gEdges.map(e => ({
    id: e.id,
    source: e.source,
    target: e.target,
    label: e.type.replace(/_/g, ' ').toLowerCase(),
    type: 'smoothstep',
    animated: e.type === 'CITES',
    style: { stroke: '#94a3b8', strokeWidth: 1.5 },
    labelStyle: { fontSize: 9, fill: '#94a3b8' },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8', width: 14, height: 14 },
  }));
}

export default function GraphCanvas() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [stats, setStats] = useState<any>({});
  const [filterTypes, setFilterTypes] = useState({ paper: true, author: true, topic: true, methodology: true, dataset: true });
  const [centerId, setCenterId] = useState('');

  const loadGraph = useCallback(async (id?: string) => {
    setLoading(true);
    try {
      const data = await api.getGraphData(id || undefined);
      const filtered = data.nodes.filter(n => filterTypes[n.type as keyof typeof filterTypes] !== false);
      const filteredIds = new Set(filtered.map(n => n.id));
      const filteredEdges = data.edges.filter(e => filteredIds.has(e.source) && filteredIds.has(e.target));
      setNodes(toReactFlowNodes(filtered));
      setEdges(toReactFlowEdges(filteredEdges));
      setStats(data.stats || {});
    } catch (err) { console.error(err); }
    setLoading(false);
  }, [filterTypes, setNodes, setEdges]);

  useEffect(() => { loadGraph(); }, []);

  const onNodeClick = (_: any, node: Node) => setSelected(node.data);

  const toggleType = (t: string) => {
    setFilterTypes(prev => ({ ...prev, [t]: !prev[t as keyof typeof filterTypes] }));
  };

  return (
    <div className="flex gap-4 h-full">
      {/* Controls sidebar */}
      <div className="w-56 flex-shrink-0 space-y-4 overflow-y-auto">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="text-xs font-semibold text-slate-700 mb-3 uppercase tracking-wide">Center On Node</h3>
          <div className="flex gap-2">
            <input value={centerId} onChange={e => setCenterId(e.target.value)}
              placeholder="Node ID…"
              className="flex-1 text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500" />
            <button onClick={() => loadGraph(centerId)} className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Search className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="text-xs font-semibold text-slate-700 mb-3 uppercase tracking-wide">Filter Node Types</h3>
          {Object.entries(filterTypes).map(([t, active]) => {
            const Icon = typeIcons[t] || Network;
            return (
              <button key={t} onClick={() => toggleType(t)}
                className={`flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-xs mb-1 transition-colors ${active ? 'bg-blue-50 text-blue-700' : 'text-slate-400 hover:bg-slate-50'}`}>
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: active ? nodeTypeColors[t] : '#cbd5e1' }} />
                <Icon className="w-3.5 h-3.5" />
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            );
          })}
          <button
            onClick={() => loadGraph(centerId)}
            className="mt-2 w-full py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors"
          >
            Apply Filters
          </button>
        </div>

        {stats && (
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <h3 className="text-xs font-semibold text-slate-700 mb-3 uppercase tracking-wide">Graph Stats</h3>
            <div className="space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between"><span>Total nodes</span><span className="font-mono font-semibold">{stats.total_graph_nodes || nodes.length}</span></div>
              <div className="flex justify-between"><span>Total edges</span><span className="font-mono font-semibold">{stats.total_graph_edges || edges.length}</span></div>
              <div className="flex justify-between"><span>Rendered</span><span className="font-mono font-semibold">{stats.rendered_nodes || nodes.length}</span></div>
              <div className="flex justify-between"><span>Communities</span><span className="font-mono font-semibold">{stats.community_count || '—'}</span></div>
            </div>
          </div>
        )}
      </div>

      {/* Graph canvas */}
      <div className="flex-1 bg-slate-900 rounded-2xl border border-slate-700 overflow-hidden relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center z-10 bg-slate-900/80">
            <div className="text-white text-sm flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              Building knowledge graph…
            </div>
          </div>
        )}
        <ReactFlow
          nodes={nodes} edges={edges}
          onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          fitView fitViewOptions={{ padding: 0.1 }}
          className="bg-slate-900"
        >
          <Controls className="bg-white rounded-lg border border-slate-200 shadow-sm" />
          <Background color="#334155" gap={20} size={1} />
          <MiniMap nodeColor={n => nodeTypeColors[(n.data as any)?.type] || '#475569'} className="bg-slate-800 rounded-lg border border-slate-600" />
        </ReactFlow>
      </div>

      {/* Detail panel */}
      {selected && (
        <div className="w-64 flex-shrink-0 bg-white rounded-xl border border-slate-200 p-4 overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2"><Info className="w-4 h-4 text-blue-500" />Node Detail</h3>
            <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600 text-xs">✕</button>
          </div>
          <div className="mb-2">
            <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: nodeTypeBg[selected.type], color: nodeTypeColors[selected.type] }}>
              {selected.type}
            </span>
          </div>
          <div className="text-sm font-semibold text-slate-900 mb-3 leading-snug">{selected.fullLabel || selected.label}</div>
          {selected.properties && Object.entries(selected.properties).filter(([k]) => !['label', 'type'].includes(k)).map(([k, v]) => v ? (
            <div key={k} className="text-xs mb-1.5">
              <span className="text-slate-400 capitalize">{k.replace(/_/g, ' ')}: </span>
              <span className="text-slate-700">{String(v).slice(0, 80)}</span>
            </div>
          ) : null)}
          {selected.type === 'paper' && (
            <a href={`/papers/${selected.properties?.id || ''}`}
              className="mt-3 w-full flex items-center justify-center gap-2 py-2 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors">
              View Paper Details
            </a>
          )}
          <button onClick={() => loadGraph(selected.properties?.id)}
            className="mt-2 w-full py-2 border border-slate-200 text-xs text-slate-600 rounded-lg hover:bg-slate-50 transition-colors">
            Expand Neighborhood
          </button>
        </div>
      )}
    </div>
  );
}
