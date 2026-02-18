
import React, { useState, useEffect, useRef } from 'react';
import { AnalysisState, Message, TabType } from './types';
import { geminiService } from './services/gemini';

const App: React.FC = () => {
  const [state, setState] = useState<AnalysisState>({
    rawContext: '',
    summary: '',
    isProcessing: false,
    excludeCode: false,
    focusKeywords: '',
    error: null,
  });

  const [activeTab, setActiveTab] = useState<TabType>(TabType.SUMMARY);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSummarize = async () => {
    if (!state.rawContext.trim()) {
      setState(prev => ({ ...prev, error: 'Please provide some content to analyze.' }));
      return;
    }

    setState(prev => ({ ...prev, isProcessing: true, error: null }));
    try {
      const result = await geminiService.summarize(
        state.rawContext,
        state.excludeCode,
        state.focusKeywords
      );
      setState(prev => ({ ...prev, summary: result, isProcessing: false }));
      geminiService.initChat(state.rawContext, state.excludeCode);
    } catch (err: any) {
      setState(prev => ({ ...prev, isProcessing: false, error: err.message }));
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || state.isProcessing) return;

    const userMsg: Message = { role: 'user', content: inputMessage, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');

    try {
      const response = await geminiService.sendMessage(inputMessage);
      const aiMsg: Message = { role: 'model', content: response, timestamp: new Date() };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      const errMsg: Message = { role: 'model', content: "Error: " + err.message, timestamp: new Date() };
      setMessages(prev => [...prev, errMsg]);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50 text-gray-900">
      {/* Sidebar Controls */}
      <aside className="w-full md:w-96 bg-white border-r border-gray-200 flex flex-col p-6 shadow-sm overflow-y-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-indigo-600 text-white p-2 rounded-lg">
            <i className="fas fa-brain text-xl"></i>
          </div>
          <h1 className="text-xl font-bold tracking-tight">ContextWhisper</h1>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Paste Content or Link
            </label>
            <textarea
              className="w-full h-48 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none resize-none text-sm custom-scrollbar"
              placeholder="Paste chat history, documents, or URLs here..."
              value={state.rawContext}
              onChange={(e) => setState(prev => ({ ...prev, rawContext: e.target.value }))}
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
              <label className="text-sm font-medium text-gray-700 cursor-pointer" htmlFor="exclude-code">
                Exclude Code Blocks
              </label>
              <input
                id="exclude-code"
                type="checkbox"
                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                checked={state.excludeCode}
                onChange={(e) => setState(prev => ({ ...prev, excludeCode: e.target.checked }))}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Custom Specific Focus
              </label>
              <input
                type="text"
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                placeholder="e.g. Budget, Deadlines, UX Design"
                value={state.focusKeywords}
                onChange={(e) => setState(prev => ({ ...prev, focusKeywords: e.target.value }))}
              />
            </div>
          </div>

          <button
            onClick={handleSummarize}
            disabled={state.isProcessing}
            className={`w-full py-4 rounded-xl font-bold text-white transition-all transform active:scale-95 flex items-center justify-center gap-2 ${
              state.isProcessing ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 shadow-md'
            }`}
          >
            {state.isProcessing ? (
              <i className="fas fa-spinner fa-spin"></i>
            ) : (
              <i className="fas fa-magic"></i>
            )}
            Analyze Context
          </button>

          {state.error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-xs">
              <i className="fas fa-exclamation-circle mr-2"></i>
              {state.error}
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Tabs */}
        <nav className="flex items-center px-6 pt-6 border-b border-gray-200 bg-white">
          <button
            onClick={() => setActiveTab(TabType.SUMMARY)}
            className={`px-6 py-3 text-sm font-semibold transition-all border-b-2 ${
              activeTab === TabType.SUMMARY 
                ? 'border-indigo-600 text-indigo-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Summary
          </button>
          <button
            onClick={() => setActiveTab(TabType.CHAT)}
            className={`px-6 py-3 text-sm font-semibold transition-all border-b-2 ${
              activeTab === TabType.CHAT 
                ? 'border-indigo-600 text-indigo-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Ask Questions
          </button>
        </nav>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar">
          {activeTab === TabType.SUMMARY ? (
            <div className="max-w-4xl mx-auto space-y-6">
              {!state.summary && !state.isProcessing ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                  <i className="fas fa-file-alt text-6xl mb-4 opacity-20"></i>
                  <p className="text-lg">Paste content and click "Analyze" to see a summary.</p>
                </div>
              ) : state.isProcessing ? (
                <div className="space-y-4 animate-pulse">
                  <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              ) : (
                <article className="prose prose-indigo max-w-none bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <i className="fas fa-clipboard-list text-indigo-600"></i>
                    Context Summary
                  </h2>
                  <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {state.summary}
                  </div>
                </article>
              )}
            </div>
          ) : (
            <div className="max-w-4xl mx-auto h-full flex flex-col">
              {/* Chat Window */}
              <div className="flex-1 overflow-y-auto space-y-4 pb-4 custom-scrollbar">
                {messages.length === 0 && (
                  <div className="text-center py-10 text-gray-400">
                    <p>Ask anything about the provided context.</p>
                  </div>
                )}
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] p-4 rounded-2xl shadow-sm ${
                        msg.role === 'user'
                          ? 'bg-indigo-600 text-white rounded-tr-none'
                          : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      <span className="text-[10px] mt-2 block opacity-60">
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendMessage} className="mt-4 flex gap-2">
                <input
                  type="text"
                  placeholder="Ask a question..."
                  className="flex-1 p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white shadow-sm"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  disabled={!state.summary}
                />
                <button
                  type="submit"
                  disabled={!state.summary || state.isProcessing}
                  className="bg-indigo-600 text-white px-6 py-2 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <i className="fas fa-paper-plane"></i>
                </button>
              </form>
              {!state.summary && (
                <p className="text-center text-xs text-red-500 mt-2">
                  Please summarize content first to enable chat.
                </p>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
