import React, { useState } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  Connection, 
  Edge, 
  Node, 
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  ReactFlowProvider,
  Panel,
} from 'reactflow';
import { NodeType } from '../types';
import RiskNode from './RiskNode';
import { X_POS } from '../constants';

interface BowTieGraphProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  onAddNode: (type: NodeType) => void;
  onUpdateNode: (id: string, title: string, value: number) => void;
  onDeleteNode: (id: string) => void;
  onUpdateEdge: (id: string, label: string, weight: number) => void;
  onDeleteEdge: (id: string) => void;
}

const nodeTypes = {
  riskNode: RiskNode,
};

const BowTieGraphContent: React.FC<BowTieGraphProps> = ({ 
  nodes, edges, onNodesChange, onEdgesChange, onConnect,
  onAddNode, onUpdateNode, onDeleteNode, onUpdateEdge, onDeleteEdge
}) => {
  
  // Local Edge Editing UI State (Visual only)
  const [editingEdge, setEditingEdge] = useState<Edge | null>(null);
  const [edgeLabelInput, setEdgeLabelInput] = useState('');

  // Listen for custom node events and relay to parent handlers
  React.useEffect(() => {
    const handleNodeUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { id, title, value } = customEvent.detail;
      onUpdateNode(id, title, value);
    };

    const handleNodeDelete = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { id } = customEvent.detail;
      onDeleteNode(id);
    };

    window.addEventListener('node-update', handleNodeUpdate);
    window.addEventListener('node-delete', handleNodeDelete);
    
    return () => {
      window.removeEventListener('node-update', handleNodeUpdate);
      window.removeEventListener('node-delete', handleNodeDelete);
    };
  }, [onUpdateNode, onDeleteNode]);

  const onEdgeClick = (event: React.MouseEvent, edge: Edge) => {
    event.stopPropagation();
    setEditingEdge(edge);
    setEdgeLabelInput(edge.data?.weight?.toString() || '100');
  };

  const saveEdgeEdit = () => {
    if (editingEdge) {
      const val = parseInt(edgeLabelInput) || 0;
      onUpdateEdge(editingEdge.id, `${val}%`, val);
      setEditingEdge(null);
    }
  };

  const deleteEdge = () => {
    if (editingEdge) {
      onDeleteEdge(editingEdge.id);
      setEditingEdge(null);
    }
  };

  return (
    <div className="w-full h-full relative bg-slate-50">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onEdgeClick={onEdgeClick}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.2}
        attributionPosition="bottom-right"
      >
        <Background color="#cbd5e1" gap={24} size={1} />
        <Controls className="bg-white border border-slate-200 shadow-sm" />
        
        <Panel position="top-center" className="bg-white/80 backdrop-blur p-2 rounded-lg shadow-sm border border-slate-200 flex gap-2">
          <button onClick={() => onAddNode(NodeType.CAUSE)} className="text-[10px] font-bold text-orange-600 px-2 py-1 bg-orange-50 hover:bg-orange-100 rounded">+ CAUSE</button>
          <div className="w-px bg-slate-200"></div>
          <button onClick={() => onAddNode(NodeType.PREVENTION)} className="text-[10px] font-bold text-blue-600 px-2 py-1 bg-blue-50 hover:bg-blue-100 rounded">+ PREV</button>
          <div className="w-px bg-slate-200"></div>
          <button onClick={() => onAddNode(NodeType.RISK_EVENT)} className="text-[10px] font-bold text-red-600 px-2 py-1 bg-red-50 hover:bg-red-100 rounded">+ RISK</button>
          <div className="w-px bg-slate-200"></div>
          <button onClick={() => onAddNode(NodeType.MITIGATION)} className="text-[10px] font-bold text-green-600 px-2 py-1 bg-green-50 hover:bg-green-100 rounded">+ MITIG</button>
          <div className="w-px bg-slate-200"></div>
          <button onClick={() => onAddNode(NodeType.CONSEQUENCE)} className="text-[10px] font-bold text-purple-600 px-2 py-1 bg-purple-50 hover:bg-purple-100 rounded">+ CONS</button>
        </Panel>
      </ReactFlow>

      {/* Edge Edit Modal */}
      {editingEdge && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-xl shadow-2xl border border-slate-200 z-50 w-72">
          <h3 className="text-sm font-bold text-slate-700 mb-4">Edit Connection</h3>
          <div className="mb-4">
            <label className="block text-xs text-slate-500 mb-1">Probability / Effectiveness (%)</label>
            <div className="flex items-center gap-2">
              <input 
                type="number" 
                min="0" max="100"
                value={edgeLabelInput}
                onChange={(e) => setEdgeLabelInput(e.target.value)}
                className="flex-1 border border-slate-300 rounded px-3 py-2 text-sm"
                autoFocus
              />
              <span className="text-sm text-slate-500">%</span>
            </div>
          </div>
          <div className="flex justify-between gap-2">
             <button onClick={deleteEdge} className="flex-1 px-3 py-2 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded">
               Delete
             </button>
             <button onClick={() => setEditingEdge(null)} className="flex-1 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded">
               Cancel
             </button>
             <button onClick={saveEdgeEdit} className="flex-1 px-3 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded">
               Save
             </button>
          </div>
        </div>
      )}
      {editingEdge && <div className="absolute inset-0 bg-black/20 z-40" onClick={() => setEditingEdge(null)}></div>}
    </div>
  );
};

const BowTieGraphWrapper: React.FC<BowTieGraphProps> = (props) => (
  <ReactFlowProvider>
    <BowTieGraphContent {...props} />
  </ReactFlowProvider>
);

export default BowTieGraphWrapper;