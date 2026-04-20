import { useEffect, useRef, useState } from 'react';
import { Network } from 'vis-network';
import { DataSet } from 'vis-data';
import { Network as NetworkIcon, Sliders, RefreshCw, Filter, Zap } from 'lucide-react';
import { getGraphData, getEntities } from '../api/endpoints';
import type { GraphNode, GraphEdge, EntityItem } from '../types';

const NODE_COLORS: Record<string, string> = {
  person:   '#3b82f6',
  org:      '#22c55e',
  phone:    '#00ff88',
  email:    '#a855f7',
  upi:      '#ffaa00',
  crypto:   '#eab308',
  ip:       '#6366f1',
  domain:   '#ff6b00',
  location: '#bf5fff',
  handle:   '#00f0ff',
};

const PRESET = {
  all_hi_risk: { label: 'All — High Risk', type: '',         minConn: 3, riskMin: 0.6 },
  upi_fraud:   { label: 'UPI Fraud Net',   type: 'upi',      minConn: 2, riskMin: 0.5 },
  phishing:    { label: 'Phishing / Domain', type: 'domain', minConn: 2, riskMin: 0.5 },
  crypto_ring: { label: 'Crypto Ring',     type: 'crypto',   minConn: 2, riskMin: 0.3 },
  persons:     { label: 'Person Network',  type: 'person',   minConn: 3, riskMin: 0.3 },
  full:        { label: 'Full Graph',      type: '',         minConn: 1, riskMin: 0.0 },
};

export default function EntityGraphPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedNode, setSelectedNode] = useState<EntityItem | null>(null);
  const [preset, setPreset] = useState<keyof typeof PRESET>('all_hi_risk');
  const [counts, setCounts] = useState<{ nodes: number; edges: number; total: number } | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isEmpty, setIsEmpty] = useState(false);

  useEffect(() => {
    const { type, minConn, riskMin } = PRESET[preset];
    const params: Record<string, unknown> = { min_connections: minConn, limit: 300 };
    if (type) params.entity_type = type;

    getGraphData(params).then(({ data }) => {
      // Client-side filter by risk
      const filteredNodes = data.nodes.filter((n: GraphNode) => n.risk_score >= riskMin);
      const keepIds = new Set(filteredNodes.map((n: GraphNode) => n.id));
      const filteredEdges = data.edges.filter((e: GraphEdge) => keepIds.has(e.from) && keepIds.has(e.to));

      setCounts({ nodes: filteredNodes.length, edges: filteredEdges.length, total: data.nodes.length });

      if (filteredNodes.length === 0) {
        setIsEmpty(true);
        return;
      }
      setIsEmpty(false);

      if (!containerRef.current) return;

      const nodes = new DataSet(filteredNodes.map((n: GraphNode) => ({
        id: n.id,
        label: n.label.length > 16 ? n.label.slice(0, 16) + '…' : n.label,
        color: {
          background: NODE_COLORS[n.type] || '#64748b',
          border: n.risk_score > 0.7 ? '#ff3355' : NODE_COLORS[n.type] || '#64748b',
          highlight: { background: NODE_COLORS[n.type] || '#64748b', border: '#ffffff' },
        },
        size: Math.min(12 + n.mention_count * 0.3 + n.risk_score * 14, 38),
        font: { color: '#f1f5f9', size: 10, face: 'monospace' },
        title: `${n.type.toUpperCase()}: ${n.label}\nRisk: ${(n.risk_score * 100).toFixed(0)}%\nMentions: ${n.mention_count}`,
        shape: 'dot',
        borderWidth: n.risk_score > 0.7 ? 3 : 1.5,
        borderWidthSelected: 4,
        shadow: n.risk_score > 0.7 ? { enabled: true, color: 'rgba(255,51,85,0.6)', size: 12, x: 0, y: 0 } : false,
      })));

      const edges = new DataSet(filteredEdges.map((e: GraphEdge, i: number) => ({
        id: `e-${i}`,
        from: e.from,
        to: e.to,
        color: { color: 'rgba(100,116,139,0.35)', highlight: '#00f0ff', hover: '#00f0ff' },
        width: Math.max(0.8, e.weight * 2.5),
        smooth: { enabled: true, type: 'continuous', roundness: 0.5 },
      })));

      const network = new Network(containerRef.current, { nodes, edges }, {
        physics: {
          enabled: true,
          solver: 'barnesHut',
          barnesHut: {
            gravitationalConstant: -6000,
            centralGravity: 0.1,
            springLength: 260,
            springConstant: 0.02,
            avoidOverlap: 0.8,
          },
          stabilization: { iterations: 280, fit: true },
        },
        interaction: { hover: true, tooltipDelay: 200, zoomView: true, dragView: true },
        layout: { improvedLayout: true },
      });

      network.on('click', (event) => {
        if (event.nodes.length > 0) {
          const nodeId = event.nodes[0];
          const node = filteredNodes.find((n: GraphNode) => n.id === nodeId);
          if (node) {
            getEntities({ q: node.label, limit: 1 }).then(({ data: entities }) => {
              if (entities.length > 0) setSelectedNode(entities[0]);
            });
          }
        } else {
          setSelectedNode(null);
        }
      });

      // Auto-focus on high-risk node
      setTimeout(() => {
        const topRisk = filteredNodes.sort((a: GraphNode, b: GraphNode) => b.risk_score - a.risk_score)[0];
        if (topRisk) network.focus(topRisk.id, { scale: 1.0, animation: { duration: 800, easingFunction: 'easeInOutQuad' } });
      }, 1200);
    });
  }, [preset, refreshKey]);

  const currentPreset = PRESET[preset];

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 96px)' }}>
      {/* Header */}
      <div className="space-y-3 flex-none mb-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-0.5">
              <NetworkIcon className="w-5 h-5 text-cyan-400" style={{ filter: 'drop-shadow(0 0 6px rgba(0,240,255,0.7))' }} />
              <h1 className="text-2xl font-bold tracking-tight">
                <span className="text-cyan-400 text-glow-cyan">KNOWLEDGE</span>{' '}
                <span className="text-white">GRAPH</span>
              </h1>
            </div>
            <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-cyan-500/60 ml-7">
              Entity relations · community detection · risk-filtered view
            </p>
          </div>
          <div className="flex items-center gap-2">
            {counts && (
              <div className="flex gap-4 text-[10px] font-mono">
                <div><span className="text-cyan-500/50 uppercase tracking-wider">Entities:</span> <span className="text-white font-bold ml-1">{counts.nodes}</span> <span className="text-cyan-500/40 ml-1">/ {counts.total}</span></div>
                <div><span className="text-cyan-500/50 uppercase tracking-wider">Relations:</span> <span className="text-white font-bold ml-1">{counts.edges}</span></div>
              </div>
            )}
            <button
              onClick={() => setRefreshKey(k => k + 1)}
              className="p-2 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/25 text-cyan-400 transition-all"
              title="Refresh graph"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Preset chips */}
        <div className="cyber-card rounded-lg p-2.5 flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 mr-2">
            <Filter className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[10px] font-mono text-cyan-400/70 uppercase tracking-widest">Cluster View:</span>
          </div>
          {(Object.entries(PRESET) as Array<[keyof typeof PRESET, typeof PRESET[keyof typeof PRESET]]>).map(([k, v]) => {
            const active = k === preset;
            return (
              <button key={k}
                onClick={() => setPreset(k)}
                className="px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-widest transition-all"
                style={{
                  background: active ? 'rgba(0,240,255,0.15)' : 'rgba(0,240,255,0.03)',
                  border: `1px solid ${active ? 'rgba(0,240,255,0.5)' : 'rgba(0,240,255,0.15)'}`,
                  color: active ? '#00f0ff' : 'rgba(255,255,255,0.5)',
                  boxShadow: active ? '0 0 8px rgba(0,240,255,0.25)' : 'none',
                }}>
                {v.label}
              </button>
            );
          })}
          <div className="ml-auto flex items-center gap-2 text-[10px] font-mono text-cyan-500/50">
            <Sliders className="w-3 h-3" />
            <span>type:</span>
            <span className="text-white/70">{currentPreset.type || 'all'}</span>
            <span className="text-cyan-500/30">·</span>
            <span>min-conn:</span>
            <span className="text-white/70">{currentPreset.minConn}</span>
            <span className="text-cyan-500/30">·</span>
            <span>risk ≥</span>
            <span className="text-amber-400 font-bold">{currentPreset.riskMin.toFixed(1)}</span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 items-center">
          <span className="text-[9px] font-mono text-cyan-400/60 uppercase tracking-widest">Entity types:</span>
          {Object.entries(NODE_COLORS).map(([type, color]) => (
            <div key={type} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: color, boxShadow: `0 0 4px ${color}` }} />
              <span className="text-[10px] font-mono text-white/70 capitalize">{type}</span>
            </div>
          ))}
          <div className="flex items-center gap-1.5 ml-4">
            <div className="w-2.5 h-2.5 rounded-full border-2" style={{ borderColor: '#ff3355' }} />
            <span className="text-[10px] font-mono text-red-400">risk &gt; 70%</span>
          </div>
        </div>
      </div>

      <div className="flex gap-4 flex-1 min-h-0">
        {/* Graph Canvas or Empty State */}
        {isEmpty ? (
          <div className="flex-1 bg-slate-900 rounded-xl border border-slate-700 flex items-center justify-center">
            <div className="text-center space-y-2">
              <p className="text-slate-400 text-sm">No entities match the current filter.</p>
              <p className="text-slate-500 text-xs">Try a different cluster view or lower the risk threshold.</p>
            </div>
          </div>
        ) : (
          <div
            ref={containerRef}
            className="flex-1 cyber-card rounded-xl"
            style={{ background: '#03030a' }}
          />
        )}

        {/* Detail Panel */}
        {selectedNode && (
          <div className="w-72 cyber-card rounded-xl p-4 space-y-3 overflow-y-auto">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <h3 className="text-[10px] font-mono text-amber-400/80 uppercase tracking-widest">Entity Detail</h3>
            </div>
            <h3 className="text-base font-bold text-white">{selectedNode.display_name || selectedNode.value}</h3>
            <div className="space-y-1 text-[11px] font-mono">
              <div className="flex justify-between">
                <span className="text-cyan-500/60 uppercase tracking-wider">Type</span>
                <span className="text-cyan-300 uppercase font-bold">{selectedNode.entity_type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-cyan-500/60 uppercase tracking-wider">Value</span>
                <span className="text-white/90 text-right text-[10px] max-w-[150px] truncate">{selectedNode.value}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-cyan-500/60 uppercase tracking-wider">Mentions</span>
                <span className="text-white font-bold">{selectedNode.mention_count}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-cyan-500/60 uppercase tracking-wider">Risk Score</span>
                <span className={'font-bold ' + (selectedNode.risk_score > 0.7 ? 'text-red-400' : selectedNode.risk_score > 0.4 ? 'text-amber-400' : 'text-green-400')}>
                  {(selectedNode.risk_score * 100).toFixed(0)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-cyan-500/60 uppercase tracking-wider">First Seen</span>
                <span className="text-white/80 text-[10px]">{new Date(selectedNode.first_seen_at).toLocaleDateString()}</span>
              </div>
            </div>
            <button className="w-full py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-widest bg-cyan-500/10 border border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/20 transition-all">
              Open in ID Scan →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
