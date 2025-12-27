// src/components/scenes/visuals/graphs/SynergyGraph.tsx
'use client';

interface SynergyGraphProps {
  graphData: {
    nodes: {
      id: string;
      label: string;
      role: 'sweeper' | 'wall' | 'support';
    }[];
    edges: { source: string; target: string; strength: number }[];
  };
}

export default function SynergyGraph({ graphData }: SynergyGraphProps) {
  return (
    <div className="w-full h-full flex items-center justify-center bg-slate-950 rounded-xl border border-slate-800 p-4">
      <div className="grid grid-cols-2 gap-4 w-full max-w-md">
        {graphData.nodes.map((node) => (
          <div
            key={node.id}
            className="bg-slate-900 p-4 rounded border border-slate-700 flex flex-col items-center"
          >
            <div
              className={`w-3 h-3 rounded-full mb-2 ${
                node.role === 'sweeper'
                  ? 'bg-red-500'
                  : node.role === 'wall'
                  ? 'bg-blue-500'
                  : 'bg-green-500'
              }`}
            />
            <span className="text-sm font-bold text-slate-200">
              {node.label}
            </span>
            <span className="text-[10px] font-mono text-slate-500 uppercase">
              {node.role}
            </span>
          </div>
        ))}
      </div>
      {/* Nota: En implementación real usaríamos D3.js o ReactFlow aquí */}
      <div className="absolute bottom-4 right-4 text-[10px] font-mono text-slate-600">
        NETWORK_NODES: {graphData.nodes.length}
      </div>
    </div>
  );
}
