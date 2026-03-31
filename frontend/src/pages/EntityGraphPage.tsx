import { useEffect, useRef, useState } from 'react';
import { Network } from 'vis-network';
import { DataSet } from 'vis-data';
import { getGraphData, getEntities } from '../api/endpoints';
import type { GraphNode, GraphEdge, EntityItem } from '../types';

const NODE_COLORS: Record<string, string> = {
  person: '#3b82f6', org: '#22c55e', phone: '#f97316', email: '#a855f7',
  upi: '#ef4444', crypto: '#eab308', ip: '#6366f1', domain: '#14b8a6',
  location: '#f472b6', handle: '#64748b',
};

export default function EntityGraphPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedNode, setSelectedNode] = useState<EntityItem | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [minConnections, setMinConnections] = useState(1);

  useEffect(() => {
    const params: Record<string, unknown> = { min_connections: minConnections, limit: 300 };
    if (typeFilter) params.entity_type = typeFilter;

    getGraphData(params).then(({ data }) => {
      if (!containerRef.current) return;

      const nodes = new DataSet(data.nodes.map((n: GraphNode) => ({
        id: n.id,
        label: n.label.length > 20 ? n.label.slice(0, 20) + '...' : n.label,
        color: NODE_COLORS[n.type] || '#64748b',
        size: Math.min(10 + n.mention_count * 0.5, 40),
        font: { color: '#f1f5f9', size: 11 },
        title: `${n.type}: ${n.label}\nRisk: ${(n.risk_score * 100).toFixed(0)}%\nMentions: ${n.mention_count}`,
        shape: 'dot',
        borderWidth: n.risk_score > 0.7 ? 3 : 1,
        borderWidthSelected: 4,
      })));

      const edges = new DataSet(data.edges.map((e: GraphEdge, i: number) => ({
        id: `e-${i}`,
        from: e.from,
        to: e.to,
        color: { color: '#334155', highlight: '#3b82f6' },
        width: Math.max(1, e.weight * 3),
        smooth: { enabled: true, type: 'continuous', roundness: 0.5 },
      })));

      const network = new Network(containerRef.current, { nodes, edges }, {
        physics: { barnesHut: { gravitationalConstant: -3000, springLength: 150 }, stabilization: { iterations: 100 } },
        interaction: { hover: true, tooltipDelay: 200, zoomView: true, dragView: true },
        layout: { improvedLayout: true },
      });

      network.on('click', (event) => {
        if (event.nodes.length > 0) {
          const nodeId = event.nodes[0];
          const node = data.nodes.find((n: GraphNode) => n.id === nodeId);
          if (node) {
            getEntities({ q: node.label, limit: 1 }).then(({ data: entities }) => {
              if (entities.length > 0) setSelectedNode(entities[0]);
            });
          }
        } else {
          setSelectedNode(null);
        }
      });
    });
  }, [typeFilter, minConnections]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Entity Knowledge Graph</h1>
        <div className="flex gap-3">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white"
          >
            <option value="">All Types</option>
            {Object.keys(NODE_COLORS).map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Min connections:</span>
            <input
              type="range" min="1" max="10" value={minConnections}
              onChange={(e) => setMinConnections(+e.target.value)}
              className="w-24"
            />
            <span className="text-xs text-white w-4">{minConnections}</span>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        {Object.entries(NODE_COLORS).map(([type, color]) => (
          <div key={type} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ background: color }} />
            <span className="text-xs text-slate-400 capitalize">{type}</span>
          </div>
        ))}
      </div>

      <div className="flex gap-4">
        {/* Graph Canvas */}
        <div
          ref={containerRef}
          className="flex-1 bg-slate-900 rounded-xl border border-slate-700"
          style={{ height: 'calc(100vh - 220px)' }}
        />

        {/* Detail Panel */}
        {selectedNode && (
          <div className="w-80 bg-slate-900 rounded-xl border border-slate-700 p-5 space-y-4">
            <h3 className="text-lg font-semibold text-white">{selectedNode.display_name || selectedNode.value}</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-400">Type</span><span className="text-white capitalize">{selectedNode.entity_type}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Value</span><span className="text-white text-xs break-all">{selectedNode.value}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Mentions</span><span className="text-white">{selectedNode.mention_count}</span></div>
              <div className="flex justify-between">
                <span className="text-slate-400">Risk Score</span>
                <span className={selectedNode.risk_score > 0.7 ? 'text-red-400' : selectedNode.risk_score > 0.4 ? 'text-yellow-400' : 'text-green-400'}>
                  {(selectedNode.risk_score * 100).toFixed(0)}%
                </span>
              </div>
              <div className="flex justify-between"><span className="text-slate-400">First Seen</span><span className="text-white text-xs">{new Date(selectedNode.first_seen_at).toLocaleDateString()}</span></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
