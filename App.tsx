
import React, { useState, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import BowTieGraph from './components/BowTieGraph';
import ChatInterface from './components/ChatInterface';
import { INITIAL_REACTFLOW_NODES, INITIAL_REACTFLOW_EDGES, X_POS } from './constants';
import { ChatMessage, ContentType, MessageRole, SimulationResult, NodeType, Attachment } from './types';
import { generateRiskResponse, transcribeAudio } from './services/geminiService';
import { 
  Node, 
  Edge, 
  useNodesState, 
  useEdgesState, 
  addEdge, 
  Connection, 
  MarkerType 
} from 'reactflow';

// Updated Mock function to use graph topology logic
const runGraphSimulation = (nodes: Node[], edges: Edge[], iterations: number = 10000): SimulationResult[] => {
  const consequences = nodes.filter(n => n.data.type === NodeType.CONSEQUENCE);
  const results: number[] = [];

  for (let i = 0; i < iterations; i++) {
    let iterationLoss = 0;
    consequences.forEach(cons => {
       const baseChance = 0.05; 
       if (Math.random() < baseChance) {
         const impact = cons.data.value || 0;
         const actualImpact = impact * Math.exp(Math.random() - 0.5);
         iterationLoss += actualImpact;
       }
    });
    results.push(iterationLoss);
  }

  const bins = 20;
  const maxLoss = Math.max(...results);
  const binSize = maxLoss / bins;
  const histogram: SimulationResult[] = [];

  for (let i = 0; i < bins; i++) {
    const rangeStart = i * binSize;
    const rangeEnd = (i + 1) * binSize;
    const count = results.filter(r => r >= rangeStart && r < rangeEnd).length;
    histogram.push({
      bin: `$${Math.floor(rangeStart/1000)}k`,
      lossValue: rangeStart,
      frequency: count
    });
  }
  
  return histogram;
};

const PYTHON_CODE_STUB = `
import networkx as nx
import numpy as np
import pandas as pd

# Graph-Based Monte Carlo Simulation
G = nx.DiGraph()

# ... Nodes and Edges would be populated from the graph state ...
# G.add_node("c1", type="cause", prob=0.15)
# G.add_edge("c1", "p1", weight=0.8) 

iterations = 10000
losses = []

for _ in range(iterations):
    total_loss = 0
    # Simulate traversal
    for node in [n for n, d in G.nodes(data=True) if d['type'] == 'cause']:
        if np.random.random() < G.nodes[node]['prob']:
            # Traverse path...
            pass
    losses.append(total_loss)

df = pd.DataFrame(losses, columns=['Loss'])
print(df.describe())
`;

const App: React.FC = () => {
  // State for React Flow (Lifted Up)
  const [nodes, setNodes, onNodesChange] = useNodesState(INITIAL_REACTFLOW_NODES);
  const [edges, setEdges, onEdgesChange] = useEdgesState(INITIAL_REACTFLOW_EDGES);

  // State for Chat
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      role: MessageRole.MODEL,
      content: "Welcome to the Risk Agent. \n\nYou can now connect any nodes directly, or ask me to add nodes for you. Double-click a node to edit details.",
      type: ContentType.TEXT,
      timestamp: Date.now()
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);

  // File Input Ref for Import
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Graph Manipulation Handlers ---

  const handleAddNode = (type: NodeType, title?: string, value?: number, desiredId?: string) => {
    const xPos = X_POS[type] || 0;
    // We need to calculate Y position based on current nodes in state, 
    // but this helper is used by both UI and AI. 
    // For UI clicks, state is fresh. For AI, we might be in a batch.
    const countOfType = nodes.filter(n => n.data.type === type).length;
    const yPos = 50 + (countOfType * 150);

    const newNodeId = desiredId || `n-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    const newNode: Node = {
      id: newNodeId,
      type: 'riskNode',
      position: { x: xPos, y: yPos },
      data: {
        id: newNodeId,
        type: type,
        title: title || `New ${type.replace('_', ' ')}`,
        value: value !== undefined ? value : (type === NodeType.CONSEQUENCE ? 10000 : 50),
        onEdit: () => {} // handled via event system in RiskNode
      },
    };
    setNodes((nds) => [...nds, newNode]);
    return newNodeId;
  };

  const handleUpdateNode = (id: string, title: string, value: number) => {
    setNodes((nds) => nds.map(node => {
      if (node.id === id) {
        return { ...node, data: { ...node.data, title, value } };
      }
      return node;
    }));
  };

  const handleDeleteNode = (id: string) => {
    setNodes((nds) => nds.filter((n) => n.id !== id));
    setEdges((eds) => eds.filter((edge) => edge.source !== id && edge.target !== id));
  };

  const handleConnect = useCallback((params: Connection) => {
     const newEdge = { 
      ...params, 
      id: `e-${Date.now()}`,
      label: '100%', 
      data: { weight: 100 },
      style: { strokeWidth: 2, stroke: '#94a3b8' },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8' }
    };
    setEdges((eds) => addEdge(newEdge, eds));
  }, [setEdges]);

  const handleUpdateEdge = (id: string, label: string, weight: number) => {
    setEdges((eds) => eds.map(e => {
      if (e.id === id) {
        return { ...e, label, data: { ...e.data, weight } };
      }
      return e;
    }));
  };

  const handleDeleteEdge = (id: string) => {
    setEdges((eds) => eds.filter(e => e.id !== id));
  };

  // --- Chat Operations ---

  const addMessage = (role: MessageRole, content: string, type: ContentType = ContentType.TEXT, extra?: Partial<ChatMessage>) => {
    const newMsg: ChatMessage = {
      id: uuidv4(),
      role,
      content,
      type,
      timestamp: Date.now(),
      ...extra
    };
    setMessages(prev => [...prev, newMsg]);
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: 'init-1',
        role: MessageRole.MODEL,
        content: "Welcome to the Risk Agent. \n\nYou can now connect any nodes directly, or ask me to add nodes for you. Double-click a node to edit details.",
        type: ContentType.TEXT,
        timestamp: Date.now()
      }
    ]);
  };

  const handleTranscribeAudio = async (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64data = (reader.result as string).split(',')[1];
        try {
          const text = await transcribeAudio(base64data, blob.type);
          resolve(text);
        } catch (e) {
          reject(e);
        }
      };
      reader.readAsDataURL(blob);
    });
  };

  const handleSendMessage = async (text: string, attachments: Attachment[] = []) => {
    // Prepare message for display
    const displayAttachments = attachments.map(a => ({ name: a.name, mimeType: a.mimeType }));
    addMessage(MessageRole.USER, text, ContentType.TEXT, { attachments: displayAttachments });
    
    setIsTyping(true);

    // Simulation Logic check
    if (text.includes("Monte Carlo") || text.includes("simulation")) {
      setTimeout(() => {
        const simData = runGraphSimulation(nodes, edges);
        addMessage(
          MessageRole.MODEL, 
          `I've run a Monte Carlo simulation traversing your current graph topology.\n\nNodes: ${nodes.length}\nConnections: ${edges.length}`, 
          ContentType.CHART,
          { 
            chartData: simData,
            codeSnippet: PYTHON_CODE_STUB 
          }
        );
        setIsTyping(false);
      }, 2000); 
      return;
    }

    // Helper to convert ChatMessages to history format expected by Gemini service
    // We need to handle past attachments in history if we want the model to remember them (simplified here to text-only history for older messages, but current message gets full treatment)
    // Note: Proper multimodal history management is complex. Here we will send text history and attach files ONLY to current turn if provided.
    const history = messages.map(m => ({
      role: m.role,
      parts: [{ text: m.content }] // We are simplifying history to text for now to avoid payload bloat, unless essential.
    }));
    
    // Serialize full graph state 
    const graphContext = JSON.stringify({
      nodes: nodes.map(n => ({ id: n.id, label: n.data.title, type: n.data.type, value: n.data.value })),
      edges: edges.map(e => ({ source: e.source, target: e.target, label: e.label, weight: e.data?.weight }))
    });

    const response = await generateRiskResponse(history, text, attachments, graphContext);
    
    // Execute Tools if present
    if (response.toolCalls && response.toolCalls.length > 0) {
      let changeLog = "";
      
      // We need a local copy of the graph state to mutate during tool execution loop
      // This allows us to handle "clear_graph" followed by "add_node" in the same turn correctly
      let localNodes = [...nodes];
      let localEdges = [...edges];

      // Helper to simulate adding a node locally
      const addNodeLocally = (type: NodeType, title?: string, value?: number, desiredId?: string) => {
         const xPos = X_POS[type] || 0;
         // Calculate Y based on LOCAL state count
         const countOfType = localNodes.filter(n => n.data.type === type).length;
         const yPos = 50 + (countOfType * 150);
         
         const newNodeId = desiredId || `n-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

         const newNode: Node = {
          id: newNodeId,
          type: 'riskNode',
          position: { x: xPos, y: yPos },
          data: {
            id: newNodeId,
            type: type,
            title: title || `New ${type.replace('_', ' ')}`,
            value: value !== undefined ? value : (type === NodeType.CONSEQUENCE ? 10000 : 50),
            onEdit: () => {} 
          },
        };
        localNodes.push(newNode);
        return newNodeId;
      };

      response.toolCalls.forEach(tool => {
        if (tool.name === 'clear_graph') {
          localNodes = [];
          localEdges = [];
          changeLog += "• Cleared entire graph\n";
        }
        else if (tool.name === 'add_node') {
          const { type, title, value, id } = tool.args;
          addNodeLocally(type as NodeType, title, value, id);
          changeLog += `• Added node: ${title} (${type})\n`;
        } 
        else if (tool.name === 'connect_nodes') {
          const { sourceId, targetId, weight } = tool.args;
          const w = weight || 100;
          const newEdge = {
            id: `e-ai-${Date.now()}-${Math.random()}`,
            source: sourceId,
            target: targetId,
            label: `${w}%`,
            data: { weight: w },
            style: { strokeWidth: 2, stroke: '#94a3b8' },
            markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8' }
          };
          // Use react-flow's addEdge logic to prevent duplicates, but apply to local array
          localEdges = addEdge(newEdge, localEdges);
          changeLog += `• Connected ${sourceId} to ${targetId}\n`;
        }
        else if (tool.name === 'update_node') {
           const { id, title, value } = tool.args;
           const nodeIndex = localNodes.findIndex(n => n.id === id);
           if (nodeIndex !== -1) {
              const n = localNodes[nodeIndex];
              localNodes[nodeIndex] = {
                 ...n,
                 data: { ...n.data, title: title || n.data.title, value: value !== undefined ? value : n.data.value }
              };
              changeLog += `• Updated node: ${title || n.data.title}\n`;
           }
        }
      });

      // Commit all changes to React State at once
      setNodes(localNodes);
      setEdges(localEdges);

      // Append tool execution summary to the response text
      if (changeLog) {
        response.text = (response.text || "") + "\n\n**Graph Updates:**\n" + changeLog;
      }
    }

    addMessage(MessageRole.MODEL, response.text || "Graph updated successfully.");
    setIsTyping(false);
  };

  // --- Import / Export Handlers ---

  const handleSaveModel = () => {
    const modelData = {
      metadata: {
        version: '2.1',
        timestamp: new Date().toISOString(),
        appName: 'RiskGuard AI'
      },
      nodes,
      edges
    };
    
    const blob = new Blob([JSON.stringify(modelData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `risk-model-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        
        // Basic Validation
        if (Array.isArray(data.nodes) && Array.isArray(data.edges)) {
          setNodes(data.nodes);
          setEdges(data.edges);
          addMessage(MessageRole.MODEL, `Successfully imported model with ${data.nodes.length} nodes and ${data.edges.length} connections.`);
        } else {
          addMessage(MessageRole.MODEL, "Error: Invalid model file format. Expected 'nodes' and 'edges' arrays.");
        }
      } catch (error) {
        console.error("Import error:", error);
        addMessage(MessageRole.MODEL, "Error: Could not parse the file.");
      }
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-50 text-slate-900 font-sans overflow-hidden selection:bg-blue-100">
      
      {/* HEADER */}
      <header className="h-auto bg-white border-b border-slate-200 flex flex-col shrink-0 z-30 shadow-sm">
        <div className="h-16 flex items-center px-8 justify-between">
           <div className="flex items-center gap-3">
             <div className="w-9 h-9 bg-slate-900 rounded-lg flex items-center justify-center shadow-lg shadow-slate-400/20">
               <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 12L3 6v12l9-6zm0 0l9-6v12l-9-6z"></path>
               </svg>
             </div>
             <div>
                <h1 className="text-xl font-bold text-slate-800 tracking-tight leading-none">Risky Bowtie</h1>
                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">by Auditor in the Loop</span>
             </div>
           </div>
           <div className="flex items-center gap-6">
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Total Nodes</span>
                <span className="text-sm font-semibold text-slate-700">{nodes.length}</span>
              </div>
              
              {/* Hidden File Input */}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept=".json"
              />

              <div className="h-8 w-px bg-slate-100"></div>
              
              <button 
                onClick={handleImportClick}
                className="px-3 py-2 text-slate-600 bg-white border border-slate-200 text-xs font-semibold rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-all"
              >
                Import Model
              </button>
              
              <button 
                onClick={handleSaveModel}
                className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg shadow-md shadow-blue-600/20 hover:bg-blue-700 transition-all"
              >
                Save Model
              </button>
           </div>
        </div>
      </header>

      {/* MAIN CONTENT: Graph */}
      <main className="flex-1 relative overflow-hidden bg-slate-100">
        <BowTieGraph 
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={handleConnect}
          onAddNode={(type, title, value) => handleAddNode(type, title, value)} 
          onUpdateNode={handleUpdateNode}
          onDeleteNode={handleDeleteNode}
          onUpdateEdge={handleUpdateEdge}
          onDeleteEdge={handleDeleteEdge}
        />
      </main>

      {/* BOTTOM: Chat */}
      <section className="h-[40vh] shrink-0 z-40 relative border-t border-slate-200 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.05)]">
        <ChatInterface 
          messages={messages} 
          isTyping={isTyping} 
          onSendMessage={handleSendMessage}
          onSuggestionClick={(txt) => handleSendMessage(txt, [])}
          onClearChat={handleClearChat}
          onTranscribeAudio={handleTranscribeAudio}
        />
      </section>

    </div>
  );
};

export default App;
