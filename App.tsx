
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AnalysisState, Message, TabType, AppLanguage, SummaryHistoryItem } from './types';
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
    close: 'Close',
    historyTitle: 'Summary History',
    historyEmpty: 'No previous summaries found.',
    restore: 'Restore',
    view: 'View',
    historyBtn: 'History',
    restoreConfirm: 'Are you sure you want to restore this version? This will overwrite your current summary and context.',
    generatedOn: 'Generated on'
  },
  th: {
    sidebarTitle: 'ContextWhisper',
    contentSource: 'แหล่งที่มาของเนื้อหา',
    upload: 'อัปโหลด .txt / .pdf',
    dropZoneText: 'วางไฟล์ที่นี่หรือคลิกเพื่ออัปโหลด',
    dropZoneSubtext: 'รองรับเอกสาร .txt และ .pdf',
    placeholder: 'วางเนื้อหา ลิงก์ หรืออัปโหลดเอกสาร...',
    excludeCode: 'ไม่รวมบล็อกโค้ด',
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
    close: 'ปิด',
    historyTitle: 'ประวัติการสรุป',
    historyEmpty: 'ไม่พบประวัติการสรุปก่อนหน้า',
    restore: 'กู้คืน',
    view: 'ดู',
    historyBtn: 'ประวัติ',
    restoreConfirm: 'คุณแน่ใจหรือไม่ว่าต้องการกู้คืนเวอร์ชันนี้? การดำเนินการนี้จะเขียนทับสรุปและเนื้อหาปัจจุบันของคุณ',
    generatedOn: 'สร้างเมื่อ'
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
      error: null,
      language: 'en'
    };
  });

  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.MESSAGES);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((m: any) => ({
          ...m,
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
  const [isChatting, setIsChatting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  const [chatSummary, setChatSummary] = useState<string | null>(null);
  const [isSummarizingChat, setIsSummarizingChat] = useState(false);
  const [showChatSummaryModal, setShowChatSummaryModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const [past, setPast] = useState<string[]>([]);
  const [future, setFuture] = useState<string[]>([]);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const t = translations[state.language];

  useEffect(() => {
    const { error, isProcessing, ...persistableState } = state;
    localStorage.setItem(STORAGE_KEYS.STATE, JSON.stringify(persistableState));
  }, [state]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    if (state.summary && state.rawContext) {
      geminiService.initChat(state.rawContext, state.excludeCode, state.language, messages);
    }
  }, []);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (activeTab === TabType.CHAT) {
      scrollToBottom();
    }
  }, [messages, isChatting, activeTab]);

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

  const extractTextFromPdf = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdfjsLib = (window as any).pdfjsLib;
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += pageText + '\n';
    }
    return fullText;
  };

  const handleFile = async (file: File) => {
    setIsUploading(true);
    setState(prev => ({ ...prev, error: null }));
    try {
      let text = '';
      if (file.type === 'application/pdf') {
        text = await extractTextFromPdf(file);
      } else if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
        text = await file.text();
      } else {
        throw new Error(state.language === 'th' ? 'ไม่รองรับประเภทไฟล์นี้ โปรดอัปโหลด .txt หรือ .pdf' : 'Unsupported file type. Please upload a .txt or .pdf file.');
      }
      const finalContent = text.trim();
      if (finalContent) updateContextWithHistory(finalContent);
    } catch (err: any) {
      setState(prev => ({ ...prev, error: err.message }));
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
        state.language
      );
      
      const newHistoryItem: SummaryHistoryItem = {
        id: Date.now().toString(),
        timestamp: new Date(),
        summary: result,
        rawContext: currentContext,
        excludeCode: currentExcludeCode,
        focusKeywords: currentFocus
      };

      setState(prev => ({ 
        ...prev, 
        summary: result, 
        isProcessing: false,
        summaryHistory: [newHistoryItem, ...prev.summaryHistory].slice(0, 20)
      }));
      
      geminiService.initChat(state.rawContext, state.excludeCode, state.language, []);
      setMessages([]); 
    } catch (err: any) {
      setState(prev => ({ ...prev, isProcessing: false, error: err.message }));
    }
  };

  const handleRestoreHistory = (item: SummaryHistoryItem) => {
    if (window.confirm(t.restoreConfirm)) {
      setState(prev => ({
        ...prev,
        summary: item.summary,
        rawContext: item.rawContext,
        excludeCode: item.excludeCode,
        focusKeywords: item.focusKeywords
      }));
      setShowHistoryModal(false);
      geminiService.initChat(item.rawContext, item.excludeCode, state.language, []);
      setMessages([]);
    }
  };

  const handleSummarizeChat = async () => {
    if (messages.length === 0) return;
    setIsSummarizingChat(true);
    try {
      const summary = await geminiService.summarizeChat(messages, state.language);
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
    try {
      const response = await geminiService.sendMessage(text);
      const aiMsg: Message = { role: 'model', content: response, timestamp: new Date() };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      const errMsg: Message = { 
        role: 'model', 
        content: (state.language === 'th' ? "เกิดข้อผิดพลาดในการประมวลผล: " : "Oops! Something went wrong while processing your message. ") + err.message, 
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
    const userMsg: Message = { role: 'user', content: userText, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    await processChatMessage(userText);
  };

  const handleRetry = async () => {
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
    if (lastUserMessage) {
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last && last.role === 'model' && last.isError) return prev.slice(0, -1);
        return prev;
      });
      await processChatMessage(lastUserMessage.content);
    }
  };

  const handleClearHistory = () => {
    if (window.confirm(t.clearConfirm)) {
      setMessages([]);
      localStorage.removeItem(STORAGE_KEYS.MESSAGES);
      if (state.rawContext) {
        geminiService.initChat(state.rawContext, state.excludeCode, state.language, []);
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

  const handleResetAll = () => {
    if (window.confirm(state.language === 'th' ? "ต้องการล้างข้อมูลทั้งหมดและเริ่มใหม่หรือไม่?" : "Are you sure you want to reset everything and start fresh?")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50 text-gray-900">
      {/* Sidebar */}
      <aside className="w-full md:w-96 bg-white border-r border-gray-200 flex flex-col p-6 shadow-sm overflow-y-auto">
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
            <button onClick={handleResetAll} className="text-[10px] text-gray-400 hover:text-red-500 font-medium transition-colors uppercase tracking-wider" title="Reset everything">Reset App</button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-700">{t.contentSource}</label>
            
            {/* File Drop Zone Component */}
            <div 
              onClick={() => fileInputRef.current?.click()}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              className={`file-drop-zone p-6 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer transition-all duration-300 ${isDragging ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200 bg-gray-50 hover:border-indigo-300'} ${isUploading ? 'pointer-events-none opacity-60' : ''}`}
            >
              {isUploading ? (
                <>
                  <i className="fas fa-circle-notch fa-spin text-2xl text-indigo-600"></i>
                  <p className="text-xs font-medium text-indigo-600 animate-pulse">{t.reading}</p>
                </>
              ) : (
                <>
                  <div className={`p-3 rounded-full transition-colors ${isDragging ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-500 shadow-sm'}`}>
                    <i className="fas fa-cloud-upload-alt text-xl"></i>
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
              <div className="flex items-center gap-2 mb-1 px-1">
                <button onClick={handleUndo} disabled={past.length === 0} className="text-xs text-gray-400 hover:text-indigo-600 disabled:opacity-30 transition-all p-1" title="Undo"><i className="fas fa-undo"></i></button>
                <button onClick={handleRedo} disabled={future.length === 0} className="text-xs text-gray-400 hover:text-indigo-600 disabled:opacity-30 transition-all p-1" title="Redo"><i className="fas fa-redo"></i></button>
              </div>
              <div className="relative group">
                <textarea className="w-full h-40 p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none resize-none text-sm custom-scrollbar bg-white shadow-inner" placeholder={t.placeholder} value={state.rawContext} onChange={(e) => updateContextWithHistory(e.target.value)} />
                {state.rawContext && <button onClick={() => updateContextWithHistory('')} className="absolute top-2 right-2 text-gray-400 hover:text-red-500 transition-colors bg-white/80 p-1 rounded-md" title="Clear context"><i className="fas fa-times-circle"></i></button>}
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
              <label className="text-sm font-medium text-gray-700 cursor-pointer" htmlFor="exclude-code">{t.excludeCode}</label>
              <input id="exclude-code" type="checkbox" className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500" checked={state.excludeCode} onChange={(e) => setState(prev => ({ ...prev, excludeCode: e.target.checked }))} />
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
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <nav className="flex items-center justify-between px-6 pt-6 border-b border-gray-200 bg-white">
          <div className="flex items-center">
            <button onClick={() => setActiveTab(TabType.SUMMARY)} className={`px-6 py-3 text-sm font-semibold transition-all border-b-2 ${activeTab === TabType.SUMMARY ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>{t.summaryTab}</button>
            <button onClick={() => setActiveTab(TabType.CHAT)} className={`px-6 py-3 text-sm font-semibold transition-all border-b-2 ${activeTab === TabType.CHAT ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>{t.chatTab}</button>
          </div>
          
          <div className="flex items-center gap-2 pb-1">
            {activeTab === TabType.SUMMARY && state.summaryHistory.length > 0 && (
              <button onClick={() => setShowHistoryModal(true)} className="text-xs bg-gray-50 text-gray-600 hover:bg-gray-100 font-semibold px-4 py-2 rounded-lg transition-all flex items-center gap-1 border border-gray-200">
                <i className="fas fa-history"></i>
                {t.historyBtn}
              </button>
            )}
            {activeTab === TabType.CHAT && messages.length > 0 && (
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
        </nav>

        <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar">
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
                  <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">{state.summary}</div>
                </article>
              )}
            </div>
          ) : (
            <div className="max-w-4xl mx-auto h-full flex flex-col">
              <div className="flex-1 overflow-y-auto space-y-4 pb-4 custom-scrollbar">
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                    <i className="fas fa-comments text-6xl mb-4 opacity-20"></i>
                    <p className="text-center whitespace-pre-wrap">{t.chatDefault}</p>
                  </div>
                )}
                {messages.map((msg, idx) => (
                  <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className="mb-1 px-2 flex items-center gap-2">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{msg.role === 'user' ? (state.language === 'th' ? 'คุณ' : 'You') : (state.language === 'th' ? 'ผู้ช่วย' : 'Assistant')}</span>
                    </div>
                    <div className={`max-w-[85%] p-4 rounded-2xl shadow-sm relative group ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : msg.isError ? 'bg-red-50 text-red-800 border border-red-200 rounded-tl-none' : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'}`}>
                      <div className="flex items-start gap-2">
                        {msg.isError && <i className="fas fa-exclamation-triangle mt-1"></i>}
                        <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                      </div>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-black/5">
                        <span className={`text-[10px] block opacity-50`}>{msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        {msg.isError && <button onClick={handleRetry} className="text-[10px] font-bold underline hover:no-underline transition-all flex items-center gap-1"><i className="fas fa-redo text-[8px]"></i>Retry</button>}
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
                <div ref={chatEndRef} />
              </div>

              <div className="pt-4 mt-auto border-t border-gray-100">
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
      </main>

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
              <div className="prose prose-indigo max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap">
                {chatSummary}
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
