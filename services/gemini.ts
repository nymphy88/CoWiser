
import { GoogleGenAI, GenerateContentResponse, Chat } from "@google/genai";
import { Message, AppLanguage, AnalysisState } from "../types";

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
    language: AppLanguage,
    config: { 
      temperature: number; 
      maxOutputTokens: number; 
      customPersona?: string;
      summaryType?: string;
      complexity?: string;
    }
  ): Promise<string> {
    const langNote = language === 'th' ? "Respond in Thai language." : "Respond in English language.";
    const customInstruction = config.customPersona ? `\nUSER CUSTOM PERSONA/INSTRUCTION:\n${config.customPersona}` : "";
    
    const typeMap: Record<string, string> = {
      'summary': 'a comprehensive summary',
      'action_items': 'a list of actionable items and next steps',
      'key_takeaways': 'the most important key takeaways',
      'bullets': 'a concise bulleted list of main points'
    };

    const complexityMap: Record<string, string> = {
      'simple': 'Use simple, easy-to-understand language suitable for a general audience.',
      'standard': 'Use professional, standard language with balanced detail.',
      'detailed': 'Provide a highly detailed analysis covering all nuances of the content.',
      'technical': 'Use technical terminology and focus on architectural or implementation details.'
    };

    const typeStr = typeMap[config.summaryType || 'summary'];
    const complexityStr = complexityMap[config.complexity || 'standard'];

    const prompt = `
      Please provide ${typeStr} of the following content.
      ${langNote}
      ${customInstruction}
      
      COMPLEXITY REQUIREMENT: ${complexityStr}
      
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
          temperature: config.temperature,
          maxOutputTokens: config.maxOutputTokens,
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

  initChat(state: AnalysisState, history: Message[] = []) {
    const langNote = state.language === 'th' ? "Always respond in Thai language." : "Always respond in English language.";
    
    const geminiHistory = history
      .filter(m => !m.isError)
      .map(m => ({
        role: m.role,
        parts: [{ text: m.content }]
      }));

    const customInstruction = state.customPersona ? `\nUSER CUSTOM PERSONA/INSTRUCTION:\n${state.customPersona}` : "";

    this.chatInstance = this.ai.chats.create({
      model: 'gemini-3-flash-preview',
      history: geminiHistory,
      config: {
        systemInstruction: `
          You are an expert context analyzer. You are helping the user understand a document or chat log they have provided.
          ${langNote}
          
          CONTEXT PROVIDED BY USER:
          ---
          ${state.rawContext}
          ---

          RULES:
          1. Answer questions strictly based on the provided context.
          2. ${state.excludeCode ? "If the user asks for code, explain the logic but do not provide the actual code blocks as per their 'Exclude Code' preference." : "You may provide code snippets if requested and present in the context."}
          3. If the answer is not in the context, state that clearly in the target language (${state.language}).
          4. Be concise and professional.
          ${customInstruction}
        `,
        temperature: state.temperature,
        maxOutputTokens: state.maxOutputTokens
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

  async processCodeUpdate(
    currentCode: string,
    updateInstruction: string,
    language: AppLanguage
  ): Promise<string> {
    const prompt = `
      You are an expert code editor and formatter.
      The user wants to update the following code based on their instructions.
      
      CURRENT CODE:
      \`\`\`
      ${currentCode}
      \`\`\`
      
      UPDATE INSTRUCTIONS / NEW CODE SNIPPET:
      ${updateInstruction}
      
      TASK:
      1. Apply the updates to the code.
      2. Ensure the code is correctly formatted and indented.
      3. Maintain the existing style and logic unless instructed otherwise.
      4. Return ONLY the updated code block. Do not include any explanations or markdown formatting like \`\`\` outside the code itself.
      5. If the update is a new snippet and there is no current code, format the new snippet perfectly.
    `;

    try {
      const response: GenerateContentResponse = await this.ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          temperature: 0.2, // Low temperature for precision
          maxOutputTokens: 4096,
        },
      });
      return response.text || "";
    } catch (error) {
      console.error("Code update error:", error);
      throw new Error(language === 'th' ? "ไม่สามารถอัปเดตโค้ดได้" : "Failed to update code.");
    }
  }

  async summarizeCode(
    codeFiles: { name: string; content: string }[],
    language: AppLanguage
  ): Promise<string> {
    const codeContext = codeFiles.map(f => `FILE: ${f.name}\nCONTENT:\n${f.content}`).join('\n\n---\n\n');
    const langNote = language === 'th' ? "Respond in Thai language." : "Respond in English language.";
    
    const prompt = `
      Summarize the following codebase. Provide an overall architectural overview and a brief summary of each file's purpose.
      ${langNote}
      
      CODEBASE:
      ${codeContext}
    `;

    try {
      const response: GenerateContentResponse = await this.ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: { temperature: 0.3 },
      });
      return response.text || "";
    } catch (error) {
      console.error("Code summarization error:", error);
      throw new Error("Failed to summarize code.");
    }
  }
}

export const geminiService = new GeminiService();
