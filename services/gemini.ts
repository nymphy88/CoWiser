
import { GoogleGenAI, GenerateContentResponse, Chat } from "@google/genai";
import { Message } from "../types";

const API_KEY = process.env.API_KEY || "";

export class GeminiService {
  private ai: GoogleGenAI;
  private chatInstance: Chat | null = null;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: API_KEY });
  }

  async summarize(
    context: string, 
    excludeCode: boolean, 
    focusKeywords: string
  ): Promise<string> {
    const prompt = `
      Please provide a comprehensive summary of the following content.
      
      ${excludeCode ? "IMPORTANT: Exclude all technical code blocks, snippets, or implementation details. Focus only on the conceptual discussion and outcomes." : "Include relevant code concepts if they are central to the discussion."}
      ${focusKeywords ? `ADDITIONAL FOCUS: Prioritize information related to: ${focusKeywords}` : ""}

      CONTENT TO SUMMARIZE:
      ---
      ${context}
      ---
    `;

    try {
      const response: GenerateContentResponse = await this.ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          temperature: 0.7,
          topP: 0.95,
        },
      });
      return response.text || "No summary generated.";
    } catch (error) {
      console.error("Summarization error:", error);
      throw new Error("Failed to summarize the content. Please check your API key and connection.");
    }
  }

  initChat(context: string, excludeCode: boolean) {
    this.chatInstance = this.ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: {
        systemInstruction: `
          You are an expert context analyzer. You are helping the user understand a document or chat log they have provided.
          
          CONTEXT PROVIDED BY USER:
          ---
          ${context}
          ---

          RULES:
          1. Answer questions strictly based on the provided context.
          2. ${excludeCode ? "If the user asks for code, explain the logic but do not provide the actual code blocks as per their 'Exclude Code' preference." : "You may provide code snippets if requested and present in the context."}
          3. If the answer is not in the context, state that clearly.
          4. Be concise and professional.
        `,
      },
    });
  }

  async sendMessage(message: string): Promise<string> {
    if (!this.chatInstance) {
      throw new Error("Chat not initialized. Please summarize content first.");
    }

    try {
      const result = await this.chatInstance.sendMessage({ message });
      return result.text || "I'm sorry, I couldn't process that request.";
    } catch (error) {
      console.error("Chat error:", error);
      throw new Error("Failed to send message.");
    }
  }
}

export const geminiService = new GeminiService();
