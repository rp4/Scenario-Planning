import { GoogleGenAI, GenerateContentResponse, FunctionDeclaration, Type } from "@google/genai";
import { SYSTEM_INSTRUCTION } from '../constants';

const apiKey = process.env.API_KEY || ''; 

let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({ apiKey });
}

// --- Tool Definitions ---

const addNodeTool: FunctionDeclaration = {
  name: 'add_node',
  description: 'Add a new node to the risk graph. IMPORTANT: Assign a unique "id" if you plan to connect it immediately.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      type: { type: Type.STRING, enum: ['CAUSE', 'PREVENTION', 'RISK_EVENT', 'MITIGATION', 'CONSEQUENCE'], description: 'Type of node' },
      title: { type: Type.STRING, description: 'Title or name of the node' },
      value: { type: Type.NUMBER, description: 'Value (Probability % or Cost $)' },
      id: { type: Type.STRING, description: 'Optional unique ID (e.g. "c1", "r1"). Use this if you need to connect this node in the same turn.' }
    },
    required: ['type', 'title']
  }
};

const connectNodesTool: FunctionDeclaration = {
  name: 'connect_nodes',
  description: 'Connect two existing nodes with an edge',
  parameters: {
    type: Type.OBJECT,
    properties: {
      sourceId: { type: Type.STRING, description: 'ID of the source node' },
      targetId: { type: Type.STRING, description: 'ID of the target node' },
      weight: { type: Type.NUMBER, description: 'Probability or effectiveness % (0-100)' },
    },
    required: ['sourceId', 'targetId']
  }
};

const updateNodeTool: FunctionDeclaration = {
  name: 'update_node',
  description: 'Update an existing node title or value',
  parameters: {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.STRING, description: 'ID of the node to update' },
      title: { type: Type.STRING, description: 'New title' },
      value: { type: Type.NUMBER, description: 'New value' },
    },
    required: ['id']
  }
};

const clearGraphTool: FunctionDeclaration = {
  name: 'clear_graph',
  description: 'Delete all nodes and edges to start with an empty canvas.',
  parameters: {
    type: Type.OBJECT,
    properties: {},
  }
};

export interface GeminiResponse {
  text: string;
  toolCalls?: {
    name: string;
    args: any;
  }[];
}

export const generateRiskResponse = async (
  history: { role: string; parts: { text: string }[] }[],
  currentMessage: string,
  contextData: string // The current graph state as JSON string
): Promise<GeminiResponse> => {
  if (!ai) {
    return { text: "API Key not configured. Please ensure process.env.API_KEY is set." };
  }

  try {
    const model = 'gemini-2.5-flash';
    
    // Construct the new message with context attached
    const newMessageWithContext = `
    Context (Current Bow-Tie Model JSON):
    ${contextData}

    User Query: ${currentMessage}
    `;

    // Combine history with the new message
    const contents = [
      ...history,
      { role: 'user', parts: [{ text: newMessageWithContext }] }
    ];

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: model,
      contents: contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{
          functionDeclarations: [addNodeTool, connectNodesTool, updateNodeTool, clearGraphTool]
        }]
      }
    });

    const result: GeminiResponse = {
      text: response.text || "",
      toolCalls: []
    };

    // Parse Function Calls
    if (response.functionCalls && response.functionCalls.length > 0) {
      result.toolCalls = response.functionCalls.map(call => ({
        name: call.name,
        args: call.args
      }));
    }

    return result;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return { text: "I encountered an error connecting to the risk engine." };
  }
};