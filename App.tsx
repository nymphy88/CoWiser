
import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { AnalysisState, Message, TabType, AppLanguage, SummaryHistoryItem, AppMode, CodeFile } from './types';
import { geminiService } from './services/gemini';

const translations = {
  en: {
    sidebarTitle: 'ContextWhisper',
    contentSource: 'Content Source',
    upload: 'Upload .txt / .pdf',
    dropZoneText: 'Drop files here or click to upload',
    dropZoneSubtext: 'Supports .txt and .pdf documents',
    placeholder: 'Paste content, links, or upload a document...',
    excludeCode: 'Exclude Code Blocks',
    excludeUrls: 'Exclude URLs',
    excludeDates: 'Exclude Dates',
    topicIntensity: 'Topic Intensity',
    topicIntensityLow: 'Broad',
    topicIntensityHigh: 'Focused',
    focusLabel: 'Custom Specific Focus',
    focusPlaceholder: 'e.g. Budget, Deadlines, UX Design',
    analyzeBtn: 'Analyze Context',
    summaryTab: 'Summary',
    chatTab: 'Ask Questions',
    clearChat: 'Clear Chat',
    summarizeChat: 'Summarize Chat',
    chatSummaryTitle: 'Conversation Summary',
    emptySummary: 'Paste content or upload a file to start.',
    thinking: 'Analyzing context...',
    reading: 'Reading file...',
    chatPlaceholder: 'Type your message...',
    chatLock: 'Summarize context to unlock chat',
    export: 'Export .txt',
    contextSummary: 'Context Summary',
    chatDefault: 'Ask anything about the context provided.\nThe model will remember the conversation.',
    errorGeneral: 'Please provide some content or upload a file to analyze.',
    clearConfirm: 'Are you sure you want to clear the conversation history?',
    analyzeFirst: 'Analyze context first to chat...',
    retry: 'Retry',
    close: 'Close',
    historyTitle: 'Summary History',
    historyEmpty: 'No previous summaries found.',
    restore: 'Restore',
    view: 'View',
    historyBtn: 'History',
    restoreConfirm: 'Are you sure you want to restore this version? This will overwrite your current summary and context.',
    generatedOn: 'Generated on',
    searchPlaceholder: 'Search messages...',
    settingsTitle: 'Model Configuration',
    temperature: 'Temperature',
    maxTokens: 'Max Output Tokens',
    personaLabel: 'Custom Persona / Instructions',
    personaPlaceholder: 'e.g. You are a senior software architect who explains concepts simply...',
    saveSettings: 'Apply Changes',
    typeLabel: 'Result Type',
    complexityLabel: 'Complexity',
    outputLangLabel: 'Output Language',
    editMode: 'Edit Mode',
    undo: 'Undo',
    redo: 'Redo',
    types: {
      summary: 'Summary',
      action_items: 'Action Items',
      key_takeaways: 'Key Takeaways',
      bullets: 'Bullet Points'
    },
    outputLangs: {
      auto: 'Auto Detect',
      en: 'English',
      th: 'Thai'
    },
    codeMode: {
      title: 'Code Editor',
      analysisMode: 'Analysis',
      codeFiles: 'Code Files',
      addFile: 'Add New File',
      updateCode: 'Update Code / Add Snippet',
      codeSummary: 'Overall Code Summary',
      applyUpdate: 'Apply & Format',
      formatting: 'Formatting code...',
      noFiles: 'No code files added yet.',
      filePlaceholder: 'filename.ts',
      updatePlaceholder: 'Paste new code or instructions for update...',
      overallSummaryPlaceholder: 'Summary of all code will appear here...'
    },
    complexities: {
      simple: 'Simple',
      standard: 'Standard',
      detailed: 'Detailed',
      technical: 'Technical'
    }
  },
  th: {
    sidebarTitle: 'ContextWhisper',
    contentSource: 'แหล่งที่มาของเนื้อหา',
    upload: 'อัปโหลด .txt / .pdf',
    dropZoneText: 'วางไฟล์ที่นี่หรือคลิกเพื่ออัปโหลด',
    dropZoneSubtext: 'รองรับเอกสาร .txt และ .pdf',
    placeholder: 'วางเนื้อหา ลิงก์ หรืออัปโหลดเอกสาร...',
    excludeCode: 'ไม่รวมบล็อกโค้ด',
    excludeUrls: 'ไม่รวม URL',
    excludeDates: 'ไม่รวมวันที่',
    topicIntensity: 'ความเข้มข้นของหัวข้อ',
    topicIntensityLow: 'กว้าง',
    topicIntensityHigh: 'เจาะจง',
    focusLabel: 'เน้นหัวข้อเฉพาะเจาะจง',
    focusPlaceholder: 'เช่น งบประมาณ, กำหนดการ, การออกแบบ UX',
    analyzeBtn: 'วิเคราะห์เนื้อหา',
    summaryTab: 'บทสรุป',
    chatTab: 'ถามคำถาม',
    clearChat: 'ล้างประวัติแชท',
    summarizeChat: 'สรุปการสนทนา',
    chatSummaryTitle: 'สรุปการสนทนา',
    emptySummary: 'วางเนื้อหาหรืออัปโหลดไฟล์เพื่อเริ่มต้น',
    thinking: 'กำลังวิเคราะห์ข้อมูล...',
    reading: 'กำลังอ่านไฟล์...',
    chatPlaceholder: 'พิมพ์ข้อความของคุณ...',
    chatLock: 'สรุปข้อมูลก่อนเพื่อเริ่มแชท',
    export: 'ส่งออกไฟล์ .txt',
    contextSummary: 'สรุปเนื้อหา',
    chatDefault: 'ถามอะไรก็ได้เกี่ยวกับเนื้อหาที่ให้มา\nโมเดลจะจำประวัติการสนทนา',
    errorGeneral: 'โปรดระบุเนื้อหาหรืออัปโหลดไฟล์เพื่อวิเคราะห์',
    clearConfirm: 'คุณแน่ใจหรือไม่ว่าต้องการล้างประวัติการสนทนา?',
    analyzeFirst: 'วิเคราะห์เนื้อหาก่อนเพื่อเริ่มแชท...',
    retry: 'ลองใหม่',
    close: 'ปิด',
    historyTitle: 'ประวัติการสรุป',
    historyEmpty: 'ไม่พบประวัติการสรุปก่อนหน้า',
    restore: 'กู้คืน',
    view: 'ดู',
    historyBtn: 'ประวัติ',
    restoreConfirm: 'คุณแน่ใจหรือไม่ว่าต้องการกู้คืนเวอร์ชันนี้? การดำเนินการนี้จะเขียนทับสรุปและเนื้อหาปัจจุบันของคุณ',
    generatedOn: 'สร้างเมื่อ',
    searchPlaceholder: 'ค้นหาข้อความ...',
    settingsTitle: 'การตั้งค่าโมเดล',
    temperature: 'อุณหภูมิ (Temperature)',
    maxTokens: 'จำกัดจำนวนคำตอบ (Max Tokens)',
    personaLabel: 'กำหนดบุคลิกภาพ / คำสั่งเพิ่มเติม',
    personaPlaceholder: 'เช่น คุณเป็นวิศวกรซอฟต์แวร์อาวุโสที่อธิบายแนวคิดอย่างง่าย...',
    saveSettings: 'ปรับใช้การเปลี่ยนแปลง',
    typeLabel: 'รูปแบบผลลัพธ์',
    complexityLabel: 'ระดับความละเอียด',
    outputLangLabel: 'ภาษาของผลลัพธ์',
    editMode: 'โหมดแก้ไข',
    undo: 'เลิกทำ',
    redo: 'ทำซ้ำ',
    types: {
      summary: 'บทสรุป',
      action_items: 'รายการสิ่งที่ต้องทำ',
      key_takeaways: 'ประเด็นสำคัญ',
      bullets: 'รายการหัวข้อ'
    },
    outputLangs: {
      auto: 'ตรวจจับอัตโนมัติ',
      en: 'อังกฤษ',
      th: 'ไทย'
    },
    codeMode: {
      title: 'ตัวแก้ไขโค้ด',
      analysisMode: 'การวิเคราะห์',
      codeFiles: 'ไฟล์โค้ด',
      addFile: 'เพิ่มไฟล์ใหม่',
      updateCode: 'อัปเดตโค้ด / เพิ่มโค้ด',
      codeSummary: 'สรุปโค้ดทั้งหมด',
      applyUpdate: 'ปรับใช้และจัดรูปแบบ',
      formatting: 'กำลังจัดรูปแบบโค้ด...',
      noFiles: 'ยังไม่มีไฟล์โค้ด',
      filePlaceholder: 'ชื่อไฟล์.ts',
      updatePlaceholder: 'วางโค้ดใหม่หรือคำสั่งสำหรับการอัปเดต...',
      overallSummaryPlaceholder: 'สรุปโค้ดทั้งหมดจะแสดงที่นี่...'
    },
    complexities: {
      simple: 'เข้าใจง่าย',
      standard: 'มาตรฐาน',
      detailed: 'ละเอียด',
      technical: 'เชิงเทคนิค'
    }
  }
};

const STORAGE_KEYS = {
  STATE: 'cw_persisted_state',
  MESSAGES: 'cw_persisted_messages'
};

const App: React.FC = () => {
  const [state, setState] = useState<AnalysisState>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.STATE);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { 
          ...parsed, 
          isProcessing: false, 
          error: null,
          temperature: parsed.temperature ?? 0.7,
          maxOutputTokens: parsed.maxOutputTokens ?? 2048,
          customPersona: parsed.customPersona ?? '',
          summaryType: parsed.summaryType ?? 'summary',
          complexity: parsed.complexity ?? 'standard',
          outputLanguage: parsed.outputLanguage ?? 'auto',
          appMode: parsed.appMode ?? AppMode.ANALYSIS,
          codeFiles: (parsed.codeFiles || []).map((f: any) => ({
            ...f,
            lastUpdated: new Date(f.lastUpdated)
          })),
          activeCodeFileId: parsed.activeCodeFileId ?? null,
          editMode: parsed.editMode ?? false,
          summaryUndoStack: parsed.summaryUndoStack ?? [],
          summaryRedoStack: parsed.summaryRedoStack ?? [],
          topicIntensity: parsed.topicIntensity ?? 50,
          excludeUrls: parsed.excludeUrls ?? false,
          excludeDates: parsed.excludeDates ?? false,
          summaryHistory: (parsed.summaryHistory || []).map((h: any) => ({
            ...h,
            timestamp: new Date(h.timestamp)
          }))
        };
      } catch (e) {
        console.error("Failed to load state from storage", e);
      }
    }
    return {
      rawContext: '',
      summary: '',
      summaryHistory: [],
      isProcessing: false,
      excludeCode: false,
      focusKeywords: '',
      summaryType: 'summary',
      complexity: 'standard',
      outputLanguage: 'auto',
      error: null,
      language: 'en',
      uploadProgress: 0,
      temperature: 0.7,
      maxOutputTokens: 2048,
      customPersona: '',
      appMode: AppMode.ANALYSIS,
      codeFiles: [],
      activeCodeFileId: null,
      editMode: false,
      summaryUndoStack: [],
      summaryRedoStack: [],
      topicIntensity: 50,
      excludeUrls: false,
      excludeDates: false
    };
  });

  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.MESSAGES);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((m: any) => ({
          ...m,
          id: m.id || Math.random().toString(36).substring(2, 9),
          timestamp: new Date(m.timestamp)
        }));
      } catch (e) {
        console.error("Failed to load messages from storage", e);
      }
    }
    return [];
  });

  const [activeTab, setActiveTab] = useState<TabType>(TabType.SUMMARY);
  const [inputMessage, setInputMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  const [chatSummary, setChatSummary] = useState<string | null>(null);
  const [isSummarizingChat, setIsSummarizingChat] = useState(false);
  const [showChatSummaryModal, setShowChatSummaryModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [lastUserMessage, setLastUserMessage] = useState<string>('');
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(384); // Default 384px (w-96)
  const [isResizing, setIsResizing] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const [past, setPast] = useState<string[]>([]);
  const [future, setFuture] = useState<string[]>([]);

  const [newFileName, setNewFileName] = useState('');
  const [codeUpdateInput, setCodeUpdateInput] = useState('');
  const [isFormatting, setIsFormatting] = useState(false);
  const [overallCodeSummary, setOverallCodeSummary] = useState('');

  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const t = translations[state.language];

  useEffect(() => {
    const handleWindowResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleWindowResize);
    return () => window.removeEventListener('resize', handleWindowResize);
  }, []);

  useEffect(() => {
    const { error, isProcessing, ...persistableState } = state;
    localStorage.setItem(STORAGE_KEYS.STATE, JSON.stringify(persistableState));
  }, [state]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    if (state.summary && state.rawContext) {
      geminiService.initChat(state, messages);
    }
  }, []);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (activeTab === TabType.CHAT && !searchTerm) {
      scrollToBottom();
    }
  }, [messages, isChatting, activeTab, searchTerm]);

  const updateContextWithHistory = useCallback((newText: string) => {
    if (newText === state.rawContext) return;
    setPast(prev => [...prev, state.rawContext]);
    setFuture([]);
    setState(prev => ({ ...prev, rawContext: newText }));
  }, [state.rawContext]);

  const handleUndo = () => {
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);
    setFuture(prev => [state.rawContext, ...prev]);
    setPast(newPast);
    setState(prev => ({ ...prev, rawContext: previous }));
  };

  const handleRedo = () => {
    if (future.length === 0) return;
    const next = future[0];
    const newFuture = future.slice(1);
    setPast(prev => [...prev, state.rawContext]);
    setFuture(newFuture);
    setState(prev => ({ ...prev, rawContext: next }));
  };

  const updateSummaryWithHistory = useCallback((newText: string) => {
    if (newText === state.summary) return;
    setState(prev => ({ 
      ...prev, 
      summary: newText,
      summaryUndoStack: [...prev.summaryUndoStack, prev.summary],
      summaryRedoStack: []
    }));
  }, [state.summary]);

  const handleSummaryUndo = () => {
    if (state.summaryUndoStack.length === 0) return;
    const previous = state.summaryUndoStack[state.summaryUndoStack.length - 1];
    const newUndoStack = state.summaryUndoStack.slice(0, state.summaryUndoStack.length - 1);
    setState(prev => ({ 
      ...prev, 
      summary: previous,
      summaryUndoStack: newUndoStack,
      summaryRedoStack: [prev.summary, ...prev.summaryRedoStack]
    }));
  };

  const handleSummaryRedo = () => {
    if (state.summaryRedoStack.length === 0) return;
    const next = state.summaryRedoStack[0];
    const newRedoStack = state.summaryRedoStack.slice(1);
    setState(prev => ({ 
      ...prev, 
      summary: next,
      summaryUndoStack: [...prev.summaryUndoStack, prev.summary],
      summaryRedoStack: newRedoStack
    }));
  };

  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback((e: MouseEvent) => {
    if (isResizing) {
      const newWidth = e.clientX;
      if (newWidth > 280 && newWidth < 600) {
        setSidebarWidth(newWidth);
      }
    }
  }, [isResizing]);

  useEffect(() => {
    window.addEventListener('mousemove', resize);
    window.addEventListener('mouseup', stopResizing);
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [resize, stopResizing]);

  const extractTextFromPdf = async (file: File, onProgress: (progress: number) => void): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdfjsLib = (window as any).pdfjsLib;
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    
    // Track loading progress
    loadingTask.onProgress = (progressData: { loaded: number; total: number }) => {
      if (progressData.total > 0) {
        onProgress((progressData.loaded / progressData.total) * 30); // First 30% for loading
      }
    };

    const pdf = await loadingTask.promise;
    let fullText = '';
    const numPages = pdf.numPages;
    
    for (let i = 1; i <= numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += pageText + '\n';
      
      // Update progress from 30% to 100%
      onProgress(30 + ((i / numPages) * 70));
    }
    return fullText;
  };

  const handleFile = async (file: File) => {
    setIsUploading(true);
    setState(prev => ({ ...prev, error: null, uploadProgress: 0 }));
    try {
      let text = '';
      if (file.type === 'application/pdf') {
        text = await extractTextFromPdf(file, (progress) => {
          setState(prev => ({ ...prev, uploadProgress: Math.round(progress) }));
        });
      } else if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
        // For large text files, we can use a FileReader and track progress
        text = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onprogress = (event) => {
            if (event.lengthComputable) {
              const progress = Math.round((event.loaded / event.total) * 100);
              setState(prev => ({ ...prev, uploadProgress: progress }));
            }
          };
          reader.onload = (e) => resolve(e.target?.result as string || '');
          reader.onerror = (e) => reject(new Error('Failed to read text file'));
          reader.readAsText(file);
        });
      } else {
        throw new Error(state.language === 'th' ? 'ไม่รองรับประเภทไฟล์นี้ โปรดอัปโหลด .txt หรือ .pdf' : 'Unsupported file type. Please upload a .txt or .pdf file.');
      }
      const finalContent = text.trim();
      if (finalContent) updateContextWithHistory(finalContent);
      setState(prev => ({ ...prev, uploadProgress: 100 }));
      // Small delay to show 100%
      setTimeout(() => setState(prev => ({ ...prev, uploadProgress: 0 })), 1000);
    } catch (err: any) {
      setState(prev => ({ ...prev, error: err.message, uploadProgress: 0 }));
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) handleFile(file);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleSummarize = async () => {
    if (!state.rawContext.trim()) {
      setState(prev => ({ ...prev, error: t.errorGeneral }));
      return;
    }
    
    const currentSummary = state.summary;
    const currentContext = state.rawContext;
    const currentExcludeCode = state.excludeCode;
    const currentFocus = state.focusKeywords;

    setState(prev => ({ ...prev, isProcessing: true, error: null }));
    try {
      const result = await geminiService.summarize(
        state.rawContext,
        state.excludeCode,
        state.focusKeywords,
        state.outputLanguage,
        { 
          temperature: state.temperature, 
          maxOutputTokens: state.maxOutputTokens, 
          customPersona: state.customPersona,
          summaryType: state.summaryType,
          complexity: state.complexity,
          topicIntensity: state.topicIntensity,
          excludeUrls: state.excludeUrls,
          excludeDates: state.excludeDates
        }
      );
      
      const newHistoryItem: SummaryHistoryItem = {
        id: Date.now().toString(),
        timestamp: new Date(),
        summary: result,
        rawContext: currentContext,
        excludeCode: currentExcludeCode,
        excludeUrls: state.excludeUrls,
        excludeDates: state.excludeDates,
        topicIntensity: state.topicIntensity,
        focusKeywords: currentFocus
      };

      const newState = { 
        ...state, 
        summary: result, 
        isProcessing: false,
        summaryHistory: [newHistoryItem, ...state.summaryHistory].slice(0, 20)
      };
      setState(newState);
      
      geminiService.initChat(newState, []);
      setMessages([]); 
    } catch (err: any) {
      setState(prev => ({ ...prev, isProcessing: false, error: err.message }));
    }
  };

  const handleRestoreHistory = (item: SummaryHistoryItem) => {
    if (window.confirm(t.restoreConfirm)) {
      const newState = {
        ...state,
        summary: item.summary,
        rawContext: item.rawContext,
        excludeCode: item.excludeCode,
        excludeUrls: item.excludeUrls,
        excludeDates: item.excludeDates,
        topicIntensity: item.topicIntensity,
        focusKeywords: item.focusKeywords
      };
      setState(newState);
      setShowHistoryModal(false);
      geminiService.initChat(newState, []);
      setMessages([]);
    }
  };

  const handleSummarizeChat = async () => {
    if (messages.length === 0) return;
    setIsSummarizingChat(true);
    try {
      const summary = await geminiService.summarizeChat(messages, state.outputLanguage);
      setChatSummary(summary);
      setShowChatSummaryModal(true);
    } catch (err: any) {
      alert("Failed to summarize conversation: " + err.message);
    } finally {
      setIsSummarizingChat(false);
    }
  };

  const processChatMessage = async (text: string) => {
    setIsChatting(true);
    setChatError(null);
    try {
      const response = await geminiService.sendMessage(text);
      const aiMsg: Message = { 
        id: Date.now().toString() + "-ai",
        role: 'model', 
        content: response, 
        timestamp: new Date() 
      };
      setMessages(prev => [...prev, aiMsg]);
      setChatError(null);
    } catch (err: any) {
      const errorText = (state.language === 'th' ? "เกิดข้อผิดพลาดในการประมวลผล: " : "Oops! Something went wrong while processing your message. ") + err.message;
      setChatError(errorText);
      const errMsg: Message = { 
        id: Date.now().toString() + "-err",
        role: 'model', 
        content: errorText, 
        timestamp: new Date(),
        isError: true 
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setIsChatting(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || state.isProcessing || isChatting) return;
    const userText = inputMessage;
    setLastUserMessage(userText);
    const userMsg: Message = { 
      id: Date.now().toString() + "-user",
      role: 'user', 
      content: userText, 
      timestamp: new Date() 
    };
    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    await processChatMessage(userText);
  };

  const handleRetry = async (failedId: string) => {
    if (state.isProcessing || isChatting) return;
    
    let userMessageToRetry = "";
    
    setMessages(prev => {
      const failedIdx = prev.findIndex(m => m.id === failedId);
      if (failedIdx === -1) return prev;

      const newMessages = [...prev];
      // Look for the user message before this error
      for (let i = failedIdx - 1; i >= 0; i--) {
        if (newMessages[i].role === 'user') {
          userMessageToRetry = newMessages[i].content;
          break;
        }
      }
      newMessages.splice(failedIdx, 1);
      return newMessages;
    });

    if (userMessageToRetry) {
      setLastUserMessage(userMessageToRetry);
      await processChatMessage(userMessageToRetry);
    }
  };

  const handleDismissError = (id: string) => {
    setMessages(prev => prev.filter(m => m.id !== id));
  };

  const handleClearHistory = () => {
    if (window.confirm(t.clearConfirm)) {
      setMessages([]);
      localStorage.removeItem(STORAGE_KEYS.MESSAGES);
      if (state.rawContext) {
        geminiService.initChat(state, []);
      }
    }
  };

  const handleExport = () => {
    if (!state.summary) return;
    const blob = new Blob([state.summary], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `summary-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleAddFile = () => {
    if (!newFileName.trim()) return;
    const newFile: CodeFile = {
      id: Date.now().toString(),
      name: newFileName.trim(),
      content: '',
      summary: '',
      lastUpdated: new Date()
    };
    setState(prev => ({
      ...prev,
      codeFiles: [...prev.codeFiles, newFile],
      activeCodeFileId: newFile.id
    }));
    setNewFileName('');
  };

  const handleCodeUpdate = async () => {
    if (!state.activeCodeFileId || !codeUpdateInput.trim()) return;
    const activeFile = state.codeFiles.find(f => f.id === state.activeCodeFileId);
    if (!activeFile) return;

    setIsFormatting(true);
    try {
      const updatedCode = await geminiService.processCodeUpdate(
        activeFile.content,
        codeUpdateInput,
        state.language
      );
      
      const updatedFiles = state.codeFiles.map(f => 
        f.id === state.activeCodeFileId 
          ? { ...f, content: updatedCode, lastUpdated: new Date() } 
          : f
      );

      setState(prev => ({ ...prev, codeFiles: updatedFiles }));
      setCodeUpdateInput('');
      
      // Auto-summarize codebase after update
      const summary = await geminiService.summarizeCode(updatedFiles, state.outputLanguage);
      setOverallCodeSummary(summary);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsFormatting(false);
    }
  };

  const handleResetAll = () => {
    if (window.confirm(state.language === 'th' ? "ต้องการล้างข้อมูลทั้งหมดและเริ่มใหม่หรือไม่?" : "Are you sure you want to reset everything and start fresh?")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const filteredMessages = messages.filter(m => 
    m.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderSummaryContent = (content: string) => {
    // Regex to find filenames (e.g., file.ts, style.css, App.tsx)
    const fileRegex = /([a-zA-Z0-9_-]+\.[a-zA-Z0-9]+)/g;
    const parts = content.split(fileRegex);
    
    return parts.map((part, i) => {
      if (fileRegex.test(part)) {
        const existingFile = state.codeFiles.find(f => f.name === part);
        return (
          <span key={i} className="group/file relative inline-block">
            <button 
              onClick={() => {
                if (existingFile) {
                  setState(prev => ({ ...prev, appMode: AppMode.CODE, activeCodeFileId: existingFile.id }));
                } else {
                  setNewFileName(part);
                  setState(prev => ({ ...prev, appMode: AppMode.CODE }));
                }
              }}
              className="text-indigo-600 font-mono font-bold hover:underline bg-indigo-50 px-1 rounded transition-colors"
            >
              {part}
            </button>
            {existingFile && (
              <div className="absolute bottom-full left-0 mb-2 hidden group-hover/file:block w-64 p-3 bg-white border border-gray-200 rounded-lg shadow-xl z-50 text-xs text-gray-600">
                <p className="font-bold mb-1 border-b pb-1">{existingFile.name}</p>
                <p className="line-clamp-3 italic">{existingFile.content || 'No content yet.'}</p>
              </div>
            )}
          </span>
        );
      }
      return (
        <ReactMarkdown key={i} remarkPlugins={[remarkGfm]} components={{ p: 'span' }}>
          {part}
        </ReactMarkdown>
      );
    });
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50 text-gray-900">
      {/* Sidebar */}
      <aside 
        style={{ width: isMobile ? '100%' : `${sidebarWidth}px` }}
        className="bg-white border-r border-gray-200 flex flex-col p-6 shadow-sm overflow-y-auto relative group/sidebar"
      >
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 text-white p-2 rounded-lg">
              <i className="fas fa-brain text-xl"></i>
            </div>
            <h1 className="text-xl font-bold tracking-tight">{t.sidebarTitle}</h1>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button onClick={() => setState(prev => ({ ...prev, language: 'en' }))} className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${state.language === 'en' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}>EN</button>
              <button onClick={() => setState(prev => ({ ...prev, language: 'th' }))} className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${state.language === 'th' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}>TH</button>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowSettingsModal(true)} className="text-[10px] text-gray-400 hover:text-indigo-600 font-medium transition-colors uppercase tracking-wider"><i className="fas fa-cog mr-1"></i>Settings</button>
              <button onClick={handleResetAll} className="text-[10px] text-gray-400 hover:text-red-500 font-medium transition-colors uppercase tracking-wider" title="Reset everything">Reset</button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-700">{t.contentSource}</label>
            
            <div 
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                const items = Array.from(e.dataTransfer.items);
                const hasSupportedFile = items.some(item => 
                  item.kind === 'file' && 
                  (item.type === 'text/plain' || item.type === 'application/pdf' || item.type === '')
                );
                if (hasSupportedFile) setIsDragging(true);
              }}
              onDragLeave={onDragLeave}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                const file = e.dataTransfer.files?.[0];
                if (file && (file.type === 'text/plain' || file.name.endsWith('.txt') || file.type === 'application/pdf')) {
                  handleFile(file);
                } else if (file) {
                  setState(prev => ({ ...prev, error: state.language === 'th' ? 'รองรับเฉพาะไฟล์ .txt และ .pdf เท่านั้น' : 'Only .txt and .pdf files are supported.' }));
                }
              }}
              className={`file-drop-zone p-6 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer transition-all duration-300 ${isDragging ? 'border-indigo-600 bg-indigo-50 scale-[1.02]' : 'border-gray-200 bg-gray-50 hover:border-indigo-300'} ${isUploading ? 'pointer-events-none opacity-60' : ''}`}
            >
              {isUploading ? (
                <div className="w-full space-y-3">
                  <div className="flex items-center justify-center gap-3">
                    <i className="fas fa-circle-notch fa-spin text-2xl text-indigo-600"></i>
                    <p className="text-xs font-bold text-indigo-600 animate-pulse">{t.reading}</p>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className="bg-indigo-600 h-full transition-all duration-300 ease-out" 
                      style={{ width: `${state.uploadProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-[10px] text-center text-gray-400 font-mono">{state.uploadProgress}%</p>
                </div>
              ) : (
                <>
                  <div className={`p-4 rounded-2xl transition-all ${isDragging ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-indigo-500 shadow-sm'}`}>
                    <i className="fas fa-file-import text-2xl"></i>
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-bold text-gray-700">{t.dropZoneText}</p>
                    <p className="text-[10px] text-gray-400 mt-1">{t.dropZoneSubtext}</p>
                  </div>
                </>
              )}
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".txt, .pdf" className="hidden" />
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between mb-1 px-1">
                <div className="flex items-center gap-2">
                  <button onClick={handleUndo} disabled={past.length === 0} className="text-xs text-gray-400 hover:text-indigo-600 disabled:opacity-30 transition-all p-1" title="Undo"><i className="fas fa-undo"></i></button>
                  <button onClick={handleRedo} disabled={future.length === 0} className="text-xs text-gray-400 hover:text-indigo-600 disabled:opacity-30 transition-all p-1" title="Redo"><i className="fas fa-redo"></i></button>
                </div>
                <span className="text-[10px] text-gray-400 font-mono uppercase tracking-widest">Source Preview</span>
              </div>
              <div className="relative group">
                <textarea className="w-full min-h-[160px] p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none resize-y text-sm custom-scrollbar bg-white shadow-inner" placeholder={t.placeholder} value={state.rawContext} onChange={(e) => updateContextWithHistory(e.target.value)} />
                {state.rawContext && <button onClick={() => updateContextWithHistory('')} className="absolute top-2 right-4 text-gray-400 hover:text-red-500 transition-colors bg-white/80 p-1 rounded-md" title="Clear context"><i className="fas fa-times-circle"></i></button>}
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">{t.typeLabel}</label>
                <select 
                  className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all cursor-pointer"
                  value={state.summaryType}
                  onChange={(e) => setState(prev => ({ ...prev, summaryType: e.target.value as any }))}
                >
                  {Object.entries(t.types).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">{t.complexityLabel}</label>
                <select 
                  className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all cursor-pointer"
                  value={state.complexity}
                  onChange={(e) => setState(prev => ({ ...prev, complexity: e.target.value as any }))}
                >
                  {Object.entries(t.complexities).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">{t.outputLangLabel}</label>
                <select 
                  className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all cursor-pointer"
                  value={state.outputLanguage}
                  onChange={(e) => setState(prev => ({ ...prev, outputLanguage: e.target.value as any }))}
                >
                  {Object.entries(t.outputLangs).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                <label className="text-sm font-medium text-gray-700 cursor-pointer" htmlFor="exclude-code">{t.excludeCode}</label>
                <input id="exclude-code" type="checkbox" className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500" checked={state.excludeCode} onChange={(e) => setState(prev => ({ ...prev, excludeCode: e.target.checked }))} />
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                <label className="text-sm font-medium text-gray-700 cursor-pointer" htmlFor="exclude-urls">{t.excludeUrls}</label>
                <input id="exclude-urls" type="checkbox" className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500" checked={state.excludeUrls} onChange={(e) => setState(prev => ({ ...prev, excludeUrls: e.target.checked }))} />
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                <label className="text-sm font-medium text-gray-700 cursor-pointer" htmlFor="exclude-dates">{t.excludeDates}</label>
                <input id="exclude-dates" type="checkbox" className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500" checked={state.excludeDates} onChange={(e) => setState(prev => ({ ...prev, excludeDates: e.target.checked }))} />
              </div>
            </div>
            <div className="space-y-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-gray-700">{t.topicIntensity}</label>
                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">{state.topicIntensity}%</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="100" 
                step="5"
                className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" 
                value={state.topicIntensity} 
                onChange={(e) => setState(prev => ({ ...prev, topicIntensity: parseInt(e.target.value) }))} 
              />
              <div className="flex justify-between text-[10px] text-gray-400 font-medium">
                <span>{t.topicIntensityLow}</span>
                <span>{t.topicIntensityHigh}</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">{t.focusLabel}</label>
              <input type="text" className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm" placeholder={t.focusPlaceholder} value={state.focusKeywords} onChange={(e) => setState(prev => ({ ...prev, focusKeywords: e.target.value }))} />
            </div>
          </div>
          <button onClick={handleSummarize} disabled={state.isProcessing || isUploading} className={`w-full py-4 rounded-xl font-bold text-white transition-all transform active:scale-95 flex items-center justify-center gap-2 ${state.isProcessing ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 shadow-md'}`}>
            {state.isProcessing ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-magic"></i>}{t.analyzeBtn}
          </button>
          {state.error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-xs"><i className="fas fa-exclamation-circle mr-2"></i>{state.error}</div>}
        </div>

        {/* Resize Handle */}
        <div 
          onMouseDown={startResizing}
          className="hidden md:block absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-indigo-400 transition-colors z-10"
        />
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <nav className="flex items-center justify-between px-6 pt-6 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-4">
            <div className="flex bg-gray-100 p-1 rounded-xl mr-4">
              <button 
                onClick={() => setState(prev => ({ ...prev, appMode: AppMode.ANALYSIS }))}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${state.appMode === AppMode.ANALYSIS ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <i className="fas fa-search-plus"></i>
                {t.codeMode.analysisMode}
              </button>
              <button 
                onClick={() => setState(prev => ({ ...prev, appMode: AppMode.CODE }))}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${state.appMode === AppMode.CODE ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <i className="fas fa-code"></i>
                {t.codeMode.title}
              </button>
            </div>
            {state.appMode === AppMode.ANALYSIS && (
              <>
                <button onClick={() => setActiveTab(TabType.SUMMARY)} className={`px-6 py-3 text-sm font-semibold transition-all border-b-2 ${activeTab === TabType.SUMMARY ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>{t.summaryTab}</button>
                <button onClick={() => setActiveTab(TabType.CHAT)} className={`px-6 py-3 text-sm font-semibold transition-all border-b-2 ${activeTab === TabType.CHAT ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>{t.chatTab}</button>
              </>
            )}
          </div>
          
          <div className="flex items-center gap-2 pb-1">
            {activeTab === TabType.SUMMARY && state.summary && (
              <div className="flex items-center gap-2 mr-2 pr-2 border-r border-gray-200">
                {state.editMode && (
                  <div className="flex items-center gap-1 mr-2">
                    <button 
                      onClick={handleSummaryUndo} 
                      disabled={state.summaryUndoStack.length === 0} 
                      className="text-xs text-gray-400 hover:text-indigo-600 disabled:opacity-30 transition-all p-2 rounded-lg hover:bg-gray-50" 
                      title={t.undo}
                    >
                      <i className="fas fa-undo"></i>
                    </button>
                    <button 
                      onClick={handleSummaryRedo} 
                      disabled={state.summaryRedoStack.length === 0} 
                      className="text-xs text-gray-400 hover:text-indigo-600 disabled:opacity-30 transition-all p-2 rounded-lg hover:bg-gray-50" 
                      title={t.redo}
                    >
                      <i className="fas fa-redo"></i>
                    </button>
                  </div>
                )}
                <button 
                  onClick={() => setState(prev => ({ ...prev, editMode: !prev.editMode }))} 
                  className={`text-xs font-bold px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${state.editMode ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  <i className={`fas ${state.editMode ? 'fa-check' : 'fa-edit'}`}></i>
                  {t.editMode}
                </button>
              </div>
            )}
            {activeTab === TabType.SUMMARY && state.summaryHistory.length > 0 && (
              <button onClick={() => setShowHistoryModal(true)} className="text-xs bg-gray-50 text-gray-600 hover:bg-gray-100 font-semibold px-4 py-2 rounded-lg transition-all flex items-center gap-1 border border-gray-200">
                <i className="fas fa-history"></i>
                {t.historyBtn}
              </button>
            )}
            {activeTab === TabType.CHAT && (
              <div className="flex items-center gap-2">
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder={t.searchPlaceholder}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="text-xs p-2 pl-8 pr-8 border border-gray-200 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none w-48 transition-all"
                  />
                  <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400"></i>
                  {searchTerm && (
                    <button 
                      onClick={() => setSearchTerm('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      title="Clear search"
                    >
                      <i className="fas fa-times text-[10px]"></i>
                    </button>
                  )}
                </div>
                {messages.length > 0 && (
                  <>
                    <button onClick={handleSummarizeChat} disabled={isSummarizingChat} className="text-xs bg-indigo-50 text-indigo-600 hover:bg-indigo-100 font-semibold px-4 py-2 rounded-lg transition-all flex items-center gap-1">
                      {isSummarizingChat ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-magic"></i>}
                      {t.summarizeChat}
                    </button>
                    <button onClick={handleClearHistory} className="text-xs text-red-500 hover:text-red-700 font-medium px-4 py-2 rounded-lg hover:bg-red-50 transition-all flex items-center gap-1">
                      <i className="fas fa-trash-alt"></i>{t.clearChat}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </nav>

        <div className="flex-1 overflow-hidden relative">
          {state.appMode === AppMode.ANALYSIS ? (
            <div className="h-full overflow-y-auto p-6 md:p-10 custom-scrollbar">
              {activeTab === TabType.SUMMARY ? (
                <div className="max-w-4xl mx-auto space-y-6">
                  {!state.summary && !state.isProcessing ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                      <i className="fas fa-file-alt text-6xl mb-4 opacity-20"></i>
                      <p className="text-lg text-center whitespace-pre-wrap">{t.emptySummary}</p>
                    </div>
                  ) : state.isProcessing ? (
                    <div className="space-y-4 animate-pulse">
                      <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-full"></div>
                      <div className="h-4 bg-gray-200 rounded w-full"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  ) : (
                    <article className="prose prose-indigo max-w-none bg-white p-8 rounded-2xl shadow-sm border border-gray-100 relative">
                      <div className="flex justify-between items-start mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><i className="fas fa-clipboard-list text-indigo-600"></i>{t.contextSummary}</h2>
                        <div className="flex gap-2">
                          <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-lg transition-colors" title={t.export}><i className="fas fa-file-export"></i>{t.export}</button>
                        </div>
                      </div>
                      {state.editMode ? (
                        <textarea
                          className="w-full min-h-[400px] p-6 border border-indigo-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-gray-700 leading-relaxed resize-y bg-indigo-50/30 font-sans"
                          value={state.summary}
                          onChange={(e) => updateSummaryWithHistory(e.target.value)}
                        />
                      ) : (
                        <div className="text-gray-700 leading-relaxed markdown-body">
                          {renderSummaryContent(state.summary)}
                        </div>
                      )}
                    </article>
                  )}
                </div>
              ) : (
                <div className="max-w-4xl mx-auto h-full flex flex-col">
                  <div className="flex-1 overflow-y-auto space-y-4 pb-4 custom-scrollbar">
                    {searchTerm && filteredMessages.length > 0 && (
                      <div className="flex items-center justify-between mb-4 px-2">
                        <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2 py-1 rounded">
                          {state.language === 'th' ? `พบ ${filteredMessages.length} รายการ` : `Found ${filteredMessages.length} ${filteredMessages.length === 1 ? 'match' : 'matches'}`}
                        </span>
                        <button onClick={() => setSearchTerm('')} className="text-[10px] font-bold text-gray-400 hover:text-gray-600 uppercase tracking-widest">
                          {state.language === 'th' ? 'ล้างการค้นหา' : 'Clear Search'}
                        </button>
                      </div>
                    )}
                    {filteredMessages.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                        <i className="fas fa-comments text-6xl mb-4 opacity-20"></i>
                        <p className="text-center whitespace-pre-wrap">{searchTerm ? 'No matches found.' : t.chatDefault}</p>
                      </div>
                    )}
                    {filteredMessages.map((msg) => (
                      <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                        <div className="mb-1 px-2 flex items-center gap-2">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{msg.role === 'user' ? (state.language === 'th' ? 'คุณ' : 'You') : (state.language === 'th' ? 'ผู้ช่วย' : 'Assistant')}</span>
                        </div>
                        <div className={`max-w-[85%] p-4 rounded-2xl shadow-sm relative group ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : msg.isError ? 'bg-red-50 text-red-800 border-2 border-red-200 rounded-tl-none' : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'}`}>
                          <div className="flex items-start gap-2">
                            {msg.isError && <i className="fas fa-exclamation-circle mt-1 text-red-500"></i>}
                            <div className="text-sm markdown-body">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {msg.content}
                              </ReactMarkdown>
                            </div>
                          </div>
                          <div className="flex items-center justify-between mt-2 pt-2 border-t border-black/5">
                            <span className={`text-[10px] block opacity-50`}>{msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            {msg.isError && (
                              <div className="flex items-center gap-2">
                                <button 
                                  onClick={() => handleRetry(msg.id)} 
                                  className="text-[10px] font-bold bg-red-100 text-red-700 px-2 py-1 rounded-md hover:bg-red-200 transition-all flex items-center gap-1"
                                >
                                  <i className="fas fa-redo text-[8px]"></i>
                                  {t.retry}
                                </button>
                                <button 
                                  onClick={() => handleDismissError(msg.id)} 
                                  className="text-[10px] font-bold bg-gray-100 text-gray-600 px-2 py-1 rounded-md hover:bg-gray-200 transition-all"
                                >
                                  {t.close}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {isChatting && (
                      <div className="flex flex-col items-start">
                        <div className="mb-1 px-2"><span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{state.language === 'th' ? 'ผู้ช่วย' : 'Assistant'}</span></div>
                        <div className="bg-white text-gray-400 border border-gray-100 rounded-2xl rounded-tl-none p-4 shadow-sm flex items-center gap-3">
                          <div className="flex gap-1">
                            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></span>
                          </div>
                          <span className="text-sm">{t.thinking}</span>
                        </div>
                      </div>
                    )}
                    {!searchTerm && <div ref={chatEndRef} />}
                  </div>

                  <div className="pt-4 mt-auto border-t border-gray-100">
                    {chatError && (
                      <div className="mb-3 p-3 bg-red-50 border border-red-100 rounded-xl flex items-center justify-between animate-in slide-in-from-bottom-2 duration-300">
                        <div className="flex items-center gap-2 text-red-700 text-xs font-medium">
                          <i className="fas fa-exclamation-triangle"></i>
                          <span className="line-clamp-1">{chatError}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => processChatMessage(lastUserMessage)}
                            className="text-[10px] font-bold bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700 transition-all shadow-sm flex items-center gap-1"
                          >
                            <i className="fas fa-redo text-[8px]"></i>
                            {t.retry}
                          </button>
                          <button 
                            onClick={() => setChatError(null)}
                            className="text-red-400 hover:text-red-600 p-1"
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        </div>
                      </div>
                    )}
                    <form onSubmit={handleSendMessage} className="flex gap-2 relative">
                      <input type="text" placeholder={!state.summary ? t.analyzeFirst : isChatting ? t.thinking : t.chatPlaceholder} className="flex-1 p-4 pr-16 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm bg-white shadow-sm disabled:bg-gray-50 transition-all" value={inputMessage} onChange={(e) => setInputMessage(e.target.value)} disabled={!state.summary || isChatting} />
                      <button type="submit" disabled={!state.summary || state.isProcessing || isChatting || !inputMessage.trim()} className="absolute right-2 top-2 bottom-2 bg-indigo-600 text-white px-4 rounded-xl hover:bg-indigo-700 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[48px]">
                        {isChatting ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-paper-plane"></i>}
                      </button>
                    </form>
                    {!state.summary && <p className="text-center text-[10px] font-medium text-amber-600 mt-2 uppercase tracking-tighter"><i className="fas fa-lock mr-1"></i> {t.chatLock}</p>}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Code Editor Mode UI */
            <div className="h-full flex flex-col md:flex-row overflow-hidden bg-gray-900">
              {/* File Explorer */}
              <div className="w-full md:w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
                <div className="p-4 border-b border-gray-700">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">{t.codeMode.codeFiles}</h3>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder={t.codeMode.filePlaceholder}
                      className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-gray-300 focus:ring-1 focus:ring-indigo-500 outline-none"
                      value={newFileName}
                      onChange={(e) => setNewFileName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddFile()}
                    />
                    <button onClick={handleAddFile} className="bg-indigo-600 hover:bg-indigo-700 text-white p-1.5 rounded-lg transition-colors"><i className="fas fa-plus"></i></button>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                  {state.codeFiles.length === 0 ? (
                    <p className="text-[10px] text-gray-500 text-center mt-4">{t.codeMode.noFiles}</p>
                  ) : (
                    state.codeFiles.map(file => (
                      <button 
                        key={file.id} 
                        onClick={() => setState(prev => ({ ...prev, activeCodeFileId: file.id }))}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-all flex items-center justify-between group ${state.activeCodeFileId === file.id ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-gray-200'}`}
                      >
                        <span className="flex items-center gap-2 truncate">
                          <i className={`fas ${file.name.endsWith('.ts') || file.name.endsWith('.tsx') ? 'fa-code text-blue-400' : 'fa-file-code text-gray-400'}`}></i>
                          {file.name}
                        </span>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setState(prev => ({ ...prev, codeFiles: prev.codeFiles.filter(f => f.id !== file.id), activeCodeFileId: prev.activeCodeFileId === file.id ? null : prev.activeCodeFileId }));
                          }}
                          className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all"
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Editor Area */}
              <div className="flex-1 flex flex-col overflow-hidden">
                {state.activeCodeFileId ? (
                  <>
                    <div className="flex-1 relative">
                      <textarea 
                        className="w-full h-full p-6 bg-gray-900 text-gray-300 font-mono text-sm leading-relaxed resize-none outline-none custom-scrollbar"
                        value={state.codeFiles.find(f => f.id === state.activeCodeFileId)?.content || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setState(prev => ({
                            ...prev,
                            codeFiles: prev.codeFiles.map(f => f.id === state.activeCodeFileId ? { ...f, content: val } : f)
                          }));
                        }}
                        placeholder="// Start coding here..."
                      />
                    </div>
                    <div className="p-4 bg-gray-800 border-t border-gray-700">
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t.codeMode.updateCode}</label>
                          {isFormatting && <span className="text-[10px] text-indigo-400 animate-pulse font-bold">{t.codeMode.formatting}</span>}
                        </div>
                        <div className="flex gap-3">
                          <textarea 
                            className="flex-1 bg-gray-900 border border-gray-700 rounded-xl p-3 text-xs text-gray-300 focus:ring-1 focus:ring-indigo-500 outline-none resize-none h-20"
                            placeholder={t.codeMode.updatePlaceholder}
                            value={codeUpdateInput}
                            onChange={(e) => setCodeUpdateInput(e.target.value)}
                          />
                          <button 
                            onClick={handleCodeUpdate}
                            disabled={isFormatting || !codeUpdateInput.trim()}
                            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white px-6 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2"
                          >
                            {isFormatting ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-magic"></i>}
                            {t.codeMode.applyUpdate}
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-gray-600 space-y-4">
                    <i className="fas fa-code-branch text-5xl opacity-20"></i>
                    <p className="text-sm font-medium">{t.codeMode.noFiles}</p>
                  </div>
                )}
              </div>

              {/* Code Summary Sidebar */}
              <div className="w-full md:w-80 bg-gray-800 border-l border-gray-700 flex flex-col p-6 overflow-y-auto custom-scrollbar">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">{t.codeMode.codeSummary}</h3>
                <div className="prose prose-invert prose-xs">
                  {overallCodeSummary ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {overallCodeSummary}
                    </ReactMarkdown>
                  ) : (
                    <p className="text-gray-500 italic text-xs">{t.codeMode.overallSummaryPlaceholder}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <i className="fas fa-sliders-h text-indigo-600"></i>
                {t.settingsTitle}
              </h3>
              <button onClick={() => setShowSettingsModal(false)} className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors">
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>
            <div className="p-8 space-y-6 overflow-y-auto max-h-[70vh] custom-scrollbar">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-semibold text-gray-700">{t.temperature}</label>
                  <span className="text-xs font-mono bg-indigo-50 text-indigo-600 px-2 py-1 rounded-md">{state.temperature.toFixed(2)}</span>
                </div>
                <input 
                  type="range" min="0" max="2" step="0.05"
                  className="w-full accent-indigo-600"
                  value={state.temperature}
                  onChange={(e) => setState(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                />
                <div className="flex justify-between text-[10px] text-gray-400 uppercase font-medium">
                  <span>Precise</span>
                  <span>Creative</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-semibold text-gray-700">{t.maxTokens}</label>
                  <input 
                    type="number" min="1" max="8192"
                    className="text-xs font-mono bg-indigo-50 text-indigo-600 px-2 py-1 rounded-md border-none outline-none w-20 text-right"
                    value={state.maxOutputTokens}
                    onChange={(e) => setState(prev => ({ ...prev, maxOutputTokens: parseInt(e.target.value) || 2048 }))}
                  />
                </div>
                <input 
                  type="range" min="256" max="8192" step="256"
                  className="w-full accent-indigo-600"
                  value={state.maxOutputTokens}
                  onChange={(e) => setState(prev => ({ ...prev, maxOutputTokens: parseInt(e.target.value) }))}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">{t.personaLabel}</label>
                <textarea 
                  className="w-full h-32 p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm resize-none custom-scrollbar"
                  placeholder={t.personaPlaceholder}
                  value={state.customPersona}
                  onChange={(e) => setState(prev => ({ ...prev, customPersona: e.target.value }))}
                />
              </div>
            </div>
            <div className="p-6 bg-gray-50 flex justify-end">
              <button 
                onClick={() => {
                  setShowSettingsModal(false);
                  if (state.summary) geminiService.initChat(state, messages);
                }}
                className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg active:scale-95 transition-all"
              >
                {t.saveSettings}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity">
          <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <i className="fas fa-history text-indigo-600"></i>
                {t.historyTitle}
              </h3>
              <button onClick={() => setShowHistoryModal(false)} className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors">
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>
            <div className="p-6 overflow-y-auto custom-scrollbar bg-gray-50 space-y-4">
              {state.summaryHistory.length === 0 ? (
                <div className="text-center py-20 text-gray-400">
                  <i className="fas fa-ghost text-4xl mb-4 opacity-20"></i>
                  <p>{t.historyEmpty}</p>
                </div>
              ) : (
                state.summaryHistory.map((item) => (
                  <div key={item.id} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:border-indigo-200 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">
                          {t.generatedOn}: {item.timestamp.toLocaleString()}
                        </p>
                        {item.focusKeywords && (
                          <p className="text-[10px] text-gray-500 italic">
                            {t.focusLabel}: {item.focusKeywords}
                          </p>
                        )}
                      </div>
                      <button 
                        onClick={() => handleRestoreHistory(item)}
                        className="px-4 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-all flex items-center gap-1"
                      >
                        <i className="fas fa-undo-alt"></i>
                        {t.restore}
                      </button>
                    </div>
                    <div className="text-sm text-gray-700 line-clamp-3 bg-gray-50 p-3 rounded-lg border border-gray-100 italic">
                      {item.summary}
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="p-4 border-t border-gray-100 bg-white flex justify-end">
              <button onClick={() => setShowHistoryModal(false)} className="px-6 py-2 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-all">
                {t.close}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chat Summary Modal */}
      {showChatSummaryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <i className="fas fa-magic text-indigo-600"></i>
                {t.chatSummaryTitle}
              </h3>
              <button onClick={() => setShowChatSummaryModal(false)} className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors">
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>
            <div className="p-8 overflow-y-auto custom-scrollbar">
              <div className="prose prose-indigo max-w-none text-gray-700 leading-relaxed markdown-body">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {chatSummary || ''}
                </ReactMarkdown>
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button onClick={() => setShowChatSummaryModal(false)} className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-md">
                {t.close}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
