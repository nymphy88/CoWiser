
import { GoogleGenAI, GenerateContentResponse, Chat } from "@google/genai";
import { Message, AppLanguage } from "../types";

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
    focusKeywords: string,
    language: AppLanguage
  ): Promise<string> {
    const langNote = language === 'th' ? "Respond in Thai language." : "Respond in English language.";
    const prompt = `
      Please provide a comprehensive summary of the following content.
      ${langNote}
      
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
      return response.text || (language === 'th' ? "ไม่พบสรุปข้อมูล" : "No summary generated.");
    } catch (error) {
      console.error("Summarization error:", error);
      throw new Error(language === 'th' ? "สรุปข้อมูลล้มเหลว โปรดตรวจสอบการเชื่อมต่อ" : "Failed to summarize the content. Please check your API key and connection.");
    }
  }

  async summarizeChat(messages: Message[], language: AppLanguage): Promise<string> {
    const chatTranscript = messages
      .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
      .join('\n\n');

    const langNote = language === 'th' ? "Respond in Thai language." : "Respond in English language.";
    const prompt = `
      Summarize the following chat conversation history between a user and an AI assistant.
      Provide the key takeaways, questions asked, and solutions provided.
      ${langNote}

      CONVERSATION:
      ---
      ${chatTranscript}
      ---
    `;

    try {
      const response: GenerateContentResponse = await this.ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: { temperature: 0.5 },
      });
      return response.text || (language === 'th' ? "ไม่สามารถสรุปการสนทนาได้" : "Could not summarize conversation.");
    } catch (error) {
      console.error("Chat summarization error:", error);
      throw new Error("Failed to summarize chat.");
    }
  }

  initChat(context: string, excludeCode: boolean, language: AppLanguage, history: Message[] = []) {
    const langNote = language === 'th' ? "Always respond in Thai language." : "Always respond in English language.";
    
    // Map local message history to Gemini format, filtering out UI errors
    const geminiHistory = history
      .filter(m => !m.isError)
      .map(m => ({
        role: m.role,
        parts: [{ text: m.content }]
      }));

    this.chatInstance = this.ai.chats.create({
      model: 'gemini-3-flash-preview',
      history: geminiHistory,
      config: {
        systemInstruction: `
          You are an expert context analyzer. You are helping the user understand a document or chat log they have provided.
          ${langNote}
          
          CONTEXT PROVIDED BY USER:
          ---
          ${context}
          ---

          RULES:
          1. Answer questions strictly based on the provided context.
          2. ${excludeCode ? "If the user asks for code, explain the logic but do not provide the actual code blocks as per their 'Exclude Code' preference." : "You may provide code snippets if requested and present in the context."}
          3. If the answer is not in the context, state that clearly in the target language (${language}).
          4. Be concise and professional.
        `,
      },
    });
  }

  async sendMessage(message: string): Promise<string> {
    if (!this.chatInstance) {
      throw new Error("Chat not initialized.");
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
