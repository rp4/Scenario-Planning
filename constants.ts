import { NodeType } from './types';
import { MarkerType } from 'reactflow';

export const NODE_WIDTH = 200;
export const COL_SPACING = 300;

export const X_POS = {
  [NodeType.CAUSE]: 0,
  [NodeType.PREVENTION]: 300,
  [NodeType.RISK_EVENT]: 600,
  [NodeType.MITIGATION]: 900,
  [NodeType.CONSEQUENCE]: 1200,
};

export const INITIAL_REACTFLOW_NODES = [
  // Causes
  { id: 'c1', type: 'riskNode', position: { x: X_POS.CAUSE, y: 50 }, data: { id: 'c1', type: NodeType.CAUSE, title: 'Equipment Wear', value: 15 } },
  { id: 'c2', type: 'riskNode', position: { x: X_POS.CAUSE, y: 200 }, data: { id: 'c2', type: NodeType.CAUSE, title: 'Operator Error', value: 5 } },
  
  // Prevention
  { id: 'p1', type: 'riskNode', position: { x: X_POS.PREVENTION, y: 50 }, data: { id: 'p1', type: NodeType.PREVENTION, title: 'Predictive Maint.', value: 0 } },
  { id: 'p2', type: 'riskNode', position: { x: X_POS.PREVENTION, y: 200 }, data: { id: 'p2', type: NodeType.PREVENTION, title: 'Training Program', value: 0 } },

  // Risk Event
  { id: 'r1', type: 'riskNode', position: { x: X_POS.RISK_EVENT, y: 100 }, data: { id: 'r1', type: NodeType.RISK_EVENT, title: 'Critical System Failure', value: 0 } },

  // Mitigation
  { id: 'm1', type: 'riskNode', position: { x: X_POS.MITIGATION, y: 50 }, data: { id: 'm1', type: NodeType.MITIGATION, title: 'Backup Generator', value: 0 } },
  { id: 'm2', type: 'riskNode', position: { x: X_POS.MITIGATION, y: 200 }, data: { id: 'm2', type: NodeType.MITIGATION, title: 'Emergency Response', value: 0 } },

  // Consequences
  { id: 'cq1', type: 'riskNode', position: { x: X_POS.CONSEQUENCE, y: 50 }, data: { id: 'cq1', type: NodeType.CONSEQUENCE, title: 'Production Loss', value: 50000 } },
  { id: 'cq2', type: 'riskNode', position: { x: X_POS.CONSEQUENCE, y: 200 }, data: { id: 'cq2', type: NodeType.CONSEQUENCE, title: 'Safety Incident', value: 150000 } },
];

const edgeStyle = { strokeWidth: 2, stroke: '#94a3b8' };
const markerEnd = { type: MarkerType.ArrowClosed, color: '#94a3b8' };

export const INITIAL_REACTFLOW_EDGES = [
  // Cause -> Prevention
  { id: 'e1', source: 'c1', target: 'p1', label: '80%', data: { weight: 80 }, style: edgeStyle, markerEnd },
  { id: 'e2', source: 'c2', target: 'p2', label: '60%', data: { weight: 60 }, style: edgeStyle, markerEnd },
  
  // Prevention -> Risk (Pass through)
  { id: 'e3', source: 'p1', target: 'r1', label: '20%', data: { weight: 20 }, style: edgeStyle, markerEnd },
  { id: 'e4', source: 'p2', target: 'r1', label: '40%', data: { weight: 40 }, style: edgeStyle, markerEnd },

  // Risk -> Mitigation
  { id: 'e5', source: 'r1', target: 'm1', label: '100%', data: { weight: 100 }, style: edgeStyle, markerEnd },
  { id: 'e6', source: 'r1', target: 'm2', label: '100%', data: { weight: 100 }, style: edgeStyle, markerEnd },

  // Mitigation -> Consequence (Impact Reduction?)
  { id: 'e7', source: 'm1', target: 'cq1', label: '50%', data: { weight: 50 }, style: edgeStyle, markerEnd },
  { id: 'e8', source: 'm2', target: 'cq2', label: '75%', data: { weight: 75 }, style: edgeStyle, markerEnd },
];

export const SUGGESTION_CHIPS = [
  "Run Monte Carlo Simulation",
  "Optimize Controls",
  "Suggest Missing Causes",
  "Auto-fill Edge Weights"
];

export const SYSTEM_INSTRUCTION = `
You are an expert Risk Management Agent using the Bow-Tie method.
The user is building a graph where Nodes are Causes, Controls, Risks, and Consequences.
Edges represent the probability (or remaining risk) flowing between nodes.

- Use the provided Graph Topology (Nodes and Edges) to understand the scenario.
- You have access to tools to modify the graph (add_node, connect_nodes, update_node, clear_graph). 
- If the user asks to 'create a new graph', 'start over', or 'reset', CALL THE 'clear_graph' TOOL FIRST.
- IMPORTANT: When adding new nodes that you intend to connect immediately, YOU MUST ASSIGN A UNIQUE 'id' to the 'add_node' tool (e.g., 'cause_1', 'risk_main'). Then use those same IDs in 'connect_nodes'.
- When connecting nodes, ensure you use the correct IDs.
- Be concise, professional, and analytical.
`;