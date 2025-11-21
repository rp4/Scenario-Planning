export enum NodeType {
  CAUSE = 'CAUSE',
  PREVENTION = 'PREVENTION',
  RISK_EVENT = 'RISK_EVENT',
  MITIGATION = 'MITIGATION',
  CONSEQUENCE = 'CONSEQUENCE'
}

export interface RiskNodeData {
  id: string; // Kept for reference in data
  type: NodeType;
  title: string;
  value?: number; // Probability % (Cause) or Cost $ (Consequence). Controls rely on Edge values.
  description?: string;
  // For React Flow custom node props
  onEdit?: (id: string) => void;
}

export interface EdgeData {
  label?: string;
  weight?: number; // 0-100% effectiveness or probability
}

export enum MessageRole {
  USER = 'user',
  MODEL = 'model'
}

export enum ContentType {
  TEXT = 'text',
  CHART = 'chart',
  CODE = 'code'
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string; // Text content
  type: ContentType;
  chartData?: any[]; // For Recharts
  codeSnippet?: string; // For Python code display
  timestamp: number;
}

export interface SimulationResult {
  bin: string; // Range "$0k - $10k"
  frequency: number;
  lossValue: number; // Midpoint for calculation
}