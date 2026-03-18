
import { GoogleGenAI, GenerateContentResponse, Chat, ThinkingLevel, Modality } from "@google/genai";
import { Message, AppLanguage, AnalysisState, OutputLanguage } from "../types";

const API_KEY = process.env.GEMINI_API_KEY || "";

export class GeminiService {
  private ai: GoogleGenAI;
  private chatInstance: Chat | null = null;
  private currentApiKey: string = API_KEY;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: this.currentApiKey });
  }

  setApiKey(key: string) {
    if (key && key !== this.currentApiKey) {
      this.currentApiKey = key;
      this.ai = new GoogleGenAI({ apiKey: key });
      // Reset chat instance if key changes to ensure it uses the new key
      this.chatInstance = null;
    }
  }

  async summarize(
    context: string, 
    excludeCode: boolean, 
    focusKeywords: string,
    outputLanguage: OutputLanguage,
    config: { 
      temperature: number; 
      maxOutputTokens: number; 
      customPersona?: string;
      summaryType?: string;
      complexity?: string;
      topicIntensity?: number;
      excludeUrls?: boolean;
      excludeDates?: boolean;
      isThinkingMode?: boolean;
      isFastMode?: boolean;
    }
  ): Promise<string> {
    let langNote = "";
    if (outputLanguage === 'auto') {
      langNote = "Auto-detect the language of the provided content and respond in that same language.";
    } else if (outputLanguage === 'th') {
      langNote = "Respond in Thai language.";
    } else {
      langNote = "Respond in English language.";
    }
    
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

    const intensity = config.topicIntensity ?? 50;
    const intensityNote = intensity < 30 ? "Keep the summary broad and high-level, avoiding deep dives into specific sub-topics." :
                          intensity > 70 ? "Provide a highly focused and intense analysis of the main topics, exploring them in depth." :
                          "Provide a standard level of topic focus and depth.";

    let model = "gemini-3-flash-preview";
    let thinkingConfig = undefined;
    let maxOutputTokens = config.maxOutputTokens;

    if (config.isThinkingMode) {
      model = "gemini-3.1-pro-preview";
      thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
      maxOutputTokens = undefined; // Do not set maxOutputTokens for thinking mode as per instructions
    } else if (config.isFastMode) {
      model = "gemini-3.1-flash-lite-preview";
    }

    const prompt = `
      Please provide ${typeStr} of the following content.
      ${langNote}
      ${customInstruction}
      
      COMPLEXITY REQUIREMENT: ${complexityStr}
      TOPIC INTENSITY: ${intensityNote} (Intensity Level: ${intensity}/100)
      
      ${excludeCode ? "IMPORTANT: Exclude all technical code blocks, snippets, or implementation details." : "Include relevant code concepts if they are central to the discussion."}
      ${config.excludeUrls ? "IMPORTANT: Exclude all URLs, links, and web addresses from the output." : ""}
      ${config.excludeDates ? "IMPORTANT: Exclude all specific dates, times, and chronological markers from the output." : ""}
      ${focusKeywords ? `ADDITIONAL FOCUS: Prioritize information related to: ${focusKeywords}` : ""}

      CONTENT TO SUMMARIZE:
      ---
      ${context}
      ---
    `;

    try {
      const response: GenerateContentResponse = await this.ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          temperature: config.temperature,
          maxOutputTokens,
          topP: 0.95,
          thinkingConfig
        },
      });
      return response.text || (outputLanguage === 'th' ? "ไม่พบสรุปข้อมูล" : "No summary generated.");
    } catch (error) {
      console.error("Summarization error:", error);
      throw new Error(outputLanguage === 'th' ? "สรุปข้อมูลล้มเหลว โปรดตรวจสอบการเชื่อมต่อ" : "Failed to summarize the content. Please check your API key and connection.");
    }
  }

  async summarizeChat(messages: Message[], outputLanguage: OutputLanguage): Promise<string> {
    const chatTranscript = messages
      .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
      .join('\n\n');

    let langNote = "";
    if (outputLanguage === 'auto') {
      langNote = "Auto-detect the language of the conversation and respond in that same language.";
    } else if (outputLanguage === 'th') {
      langNote = "Respond in Thai language.";
    } else {
      langNote = "Respond in English language.";
    }

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
      return response.text || (outputLanguage === 'th' ? "ไม่สามารถสรุปการสนทนาได้" : "Could not summarize conversation.");
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

    let model = "gemini-3-flash-preview";
    let thinkingConfig = undefined;
    let maxOutputTokens = state.maxOutputTokens;

    if (state.isThinkingMode) {
      model = "gemini-3.1-pro-preview";
      thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
      maxOutputTokens = undefined;
    } else if (state.isFastMode) {
      model = "gemini-3.1-flash-lite-preview";
    }

    this.chatInstance = this.ai.chats.create({
      model,
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
          3. ${state.excludeUrls ? "IMPORTANT: Do not include any URLs, links, or web addresses in your responses." : ""}
          4. ${state.excludeDates ? "IMPORTANT: Do not include any specific dates, times, or chronological markers in your responses." : ""}
          5. If the answer is not in the context, state that clearly in the target language (${state.language}).
          6. Be concise and professional.
          ${customInstruction}
        `,
        temperature: state.temperature,
        maxOutputTokens,
        thinkingConfig
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
    outputLanguage: OutputLanguage
  ): Promise<string> {
    const codeContext = codeFiles.map(f => `FILE: ${f.name}\nCONTENT:\n${f.content}`).join('\n\n---\n\n');
    let langNote = "";
    if (outputLanguage === 'auto') {
      langNote = "Auto-detect the language of the codebase and respond in that same language.";
    } else if (outputLanguage === 'th') {
      langNote = "Respond in Thai language.";
    } else {
      langNote = "Respond in English language.";
    }
    
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

  async transcribeAudio(base64Audio: string): Promise<string> {
    try {
      const response: GenerateContentResponse = await this.ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          {
            inlineData: {
              mimeType: "audio/wav",
              data: base64Audio,
            },
          },
          {
            text: "Transcribe the following audio precisely.",
          },
        ],
      });
      return response.text || "";
    } catch (error) {
      console.error("Transcription error:", error);
      throw new Error("Failed to transcribe audio.");
    }
  }

  async generateSpeech(text: string): Promise<string> {
    try {
      const response: GenerateContentResponse = await this.ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      });
      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      return base64Audio || "";
    } catch (error) {
      console.error("TTS error:", error);
      throw new Error("Failed to generate speech.");
    }
  }
}

export const geminiService = new GeminiService();
