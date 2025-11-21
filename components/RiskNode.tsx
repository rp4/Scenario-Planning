import React, { useState, memo } from 'react';
import { Handle, Position } from 'reactflow';
import { NodeType, RiskNodeData } from '../types';
import { AlertTriangle, Shield, Zap, AlertOctagon, DollarSign, X, Activity, Trash2 } from 'lucide-react';

interface RiskNodeProps {
  id: string;
  data: RiskNodeData;
}

// Use memo to prevent unnecessary re-renders in React Flow
const RiskNode = memo(({ id, data }: RiskNodeProps) => {
  const [isEditing, setIsEditing] = useState(false);
  
  // Edit State
  const [tempValue, setTempValue] = useState(data.value || 0);
  const [tempTitle, setTempTitle] = useState(data.title);

  const handleSave = () => {
    if (data.onEdit) {
       const event = new CustomEvent('node-update', {
        detail: { id, title: tempTitle, value: tempValue }
      });
      window.dispatchEvent(event);
    }
    setIsEditing(false);
  };

  const handleDelete = () => {
    const event = new CustomEvent('node-delete', {
      detail: { id }
    });
    window.dispatchEvent(event);
    setIsEditing(false); // Close modal (though node will disappear)
  };

  const getNodeStyle = (type: NodeType) => {
    switch (type) {
      case NodeType.CAUSE:
        return 'border-l-4 border-l-orange-400 bg-white hover:border-orange-500';
      case NodeType.PREVENTION:
        return 'border-l-4 border-l-blue-500 bg-blue-50 hover:border-blue-600';
      case NodeType.RISK_EVENT:
        return 'bg-red-600 text-white shadow-lg hover:bg-red-700 ring-2 ring-red-100';
      case NodeType.MITIGATION:
        return 'border-l-4 border-l-green-500 bg-green-50 hover:border-green-600';
      case NodeType.CONSEQUENCE:
        return 'border-l-4 border-l-purple-500 bg-white hover:border-purple-600';
      default:
        return 'bg-white';
    }
  };

  const getIcon = (type: NodeType) => {
    const className = type === NodeType.RISK_EVENT ? "w-5 h-5 text-white" : "w-4 h-4 text-slate-500";
    switch (type) {
      case NodeType.CAUSE: return <Zap className={className} />;
      case NodeType.PREVENTION: return <Shield className={className} />;
      case NodeType.RISK_EVENT: return <AlertTriangle className={className} />;
      case NodeType.MITIGATION: return <Shield className={className} />;
      case NodeType.CONSEQUENCE: return <AlertOctagon className={className} />;
    }
  };

  const isControl = data.type === NodeType.PREVENTION || data.type === NodeType.MITIGATION;
  const isRisk = data.type === NodeType.RISK_EVENT;

  return (
    <>
      {/* Input Handle (Left) - Not for Causes */}
      {data.type !== NodeType.CAUSE && (
        <Handle 
          type="target" 
          position={Position.Left} 
          className="!w-3 !h-3 !bg-slate-400 !-ml-1.5 hover:!bg-blue-500 transition-colors" 
        />
      )}

      <div className="relative group">
        {/* Popover for Editing */}
        {isEditing && (
          <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 p-4 animate-in fade-in zoom-in duration-200 cursor-default">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase">Edit Node</h4>
              <button onClick={() => setIsEditing(false)}><X className="w-4 h-4 text-slate-400 hover:text-slate-600" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Title</label>
                <input 
                  type="text" 
                  value={tempTitle}
                  onChange={(e) => setTempTitle(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded px-2 py-1.5 text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>
              
              {!isControl && !isRisk && (
                 <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    {data.type === NodeType.CONSEQUENCE ? 'Impact Cost ($)' : 'Base Probability (%)'}
                  </label>
                  <input 
                    type="number" 
                    value={tempValue}
                    onChange={(e) => setTempValue(Number(e.target.value))}
                    className="w-full text-sm border border-slate-200 rounded px-2 py-1.5 text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>
              )}
              
              <div className="flex gap-2 pt-1">
                <button 
                  onClick={handleDelete}
                  className="flex-1 text-xs py-2 bg-red-50 text-red-600 border border-red-100 rounded hover:bg-red-100 flex items-center justify-center gap-1 transition-colors"
                >
                  <Trash2 className="w-3 h-3" /> Delete
                </button>
                <button 
                  onClick={handleSave}
                  className="flex-[2] text-xs py-2 bg-slate-900 text-white rounded hover:bg-slate-800 transition-colors"
                >
                  Update
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Card */}
        <div 
          onDoubleClick={() => setIsEditing(true)}
          className={`
            ${getNodeStyle(data.type)}
            relative w-48 p-3 rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col gap-2
            border border-slate-200/60 select-none min-h-[80px]
          `}
        >
          <div className="flex items-start justify-between gap-2">
            <span className="font-semibold text-xs leading-snug line-clamp-2">{data.title}</span>
            <div className="shrink-0 mt-0.5">{getIcon(data.type)}</div>
          </div>
          
          <div className="flex items-center justify-between mt-auto pt-2">
             {/* Value Display */}
             {data.type === NodeType.CAUSE && (
               <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded">{data.value}% Prob</span>
             )}
             {data.type === NodeType.CONSEQUENCE && (
               <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">${data.value?.toLocaleString()}</span>
             )}
             {isControl && (
               <span className="text-[10px] text-slate-400 flex items-center gap-1">
                 <Activity className="w-3 h-3" /> Edge Driven
               </span>
             )}
             {isRisk && <span className="text-[10px] text-white/80">Risk Event</span>}
          </div>
        </div>
      </div>

      {/* Output Handle (Right) - Not for Consequences */}
      {data.type !== NodeType.CONSEQUENCE && (
        <Handle 
          type="source" 
          position={Position.Right} 
          className="!w-3 !h-3 !bg-slate-400 !-mr-1.5 hover:!bg-blue-500 transition-colors" 
        />
      )}
    </>
  );
});

export default RiskNode;