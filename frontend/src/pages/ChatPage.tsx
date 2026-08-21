import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  User, 
  Send, 
  Sparkles, 
  Code2, 
  TrendingUp, 
  AlertCircle, 
  ArrowUpRight,
  Loader2,
  HelpCircle,
  Download,
  Printer,
  FileText
} from 'lucide-react';
import { DatasetDetail, ChatMessage } from '../types';
import { PlotlyChart } from '../components/PlotlyChart';
import { api } from '../services/api';

interface ChatPageProps {
  currentDataset: DatasetDetail | null;
  initialPrompt?: string;
}

export const ChatPage: React.FC<ChatPageProps> = ({
  currentDataset,
  initialPrompt
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState(initialPrompt || '');
  const [isLoading, setIsLoading] = useState(false);
  const [showCodeFor, setShowCodeFor] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messages.length === 0 && currentDataset) {
      setMessages([
        {
          id: 1,
          sender: 'ASSISTANT',
          queryText: 'Welcome',
          explanation: `I'm your **Agentic AI Data Analyst**. I've loaded **${currentDataset.summary.name}** (${currentDataset.summary.rowCount} rows, ${currentDataset.summary.columnCount} columns). Ask me any question in natural language about correlations, monthly trends, distributions, anomalies, or predictions!`,
          suggestedFollowups: [
            "Compare sales by channel using a column chart",
            "Show monthly sales trends over time using a line graph",
            "What is the percentage share by category using a pie chart?",
            "Show geographic regional performance distribution on a map"
          ],
          createdAt: new Date().toISOString()
        }
      ]);
    }
  }, [currentDataset]);

  useEffect(() => {
    if (initialPrompt && initialPrompt.trim() !== '') {
      handleSend(initialPrompt);
    }
  }, [initialPrompt]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (queryText: string) => {
    if (!queryText.trim() || !currentDataset || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now(),
      sender: 'USER',
      queryText: queryText.trim(),
      createdAt: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const assistantMsg = await api.sendChatQuery(currentDataset.summary.id, queryText.trim());
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'ASSISTANT',
          queryText: queryText,
          explanation: "Encountered an issue processing query. Please check your data or try a different phrasing.",
          createdAt: new Date().toISOString()
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadMarkdown = () => {
    if (!currentDataset || messages.length === 0) return;
    
    let md = `# AI Data Analyst - Full Analytical Chat Transcript\n\n`;
    md += `**Dataset Name:** ${currentDataset.summary.name}\n`;
    md += `**Total Records:** ${currentDataset.summary.rowCount} rows | ${currentDataset.summary.columnCount} columns\n`;
    md += `**Export Date:** ${new Date().toLocaleString()}\n`;
    md += `**Total Messages:** ${messages.length}\n\n`;
    md += `---\n\n`;

    messages.forEach((msg, idx) => {
      const timestamp = new Date(msg.createdAt).toLocaleTimeString();
      if (msg.sender === 'USER') {
        md += `### 👤 USER QUERY [${timestamp}]\n`;
        md += `> **${msg.queryText}**\n\n`;
      } else {
        md += `### 🤖 AI DATA ANALYST [${timestamp}]\n\n`;
        md += `${msg.explanation}\n\n`;

        if (msg.stats && Object.keys(msg.stats).length > 0) {
          md += `#### Key Statistical Metrics:\n`;
          Object.entries(msg.stats).forEach(([key, val]) => {
            md += `- **${key.replace(/_/g, ' ').toUpperCase()}**: ${val}\n`;
          });
          md += `\n`;
        }

        if (msg.safeCodeSnippet) {
          md += `#### Executed Sandboxed Code:\n\`\`\`python\n${msg.safeCodeSnippet}\n\`\`\`\n\n`;
        }

        if (msg.limitations) {
          md += `*Analysis Caution: ${msg.limitations}*\n\n`;
        }
      }
      md += `---\n\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentDataset.summary.name.replace(/\s+/g, '_')}_Full_Chat_Transcript.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadJSON = () => {
    if (!currentDataset || messages.length === 0) return;
    const payload = {
      dataset: currentDataset.summary,
      exportedAt: new Date().toISOString(),
      messageCount: messages.length,
      messages: messages
    };
    const jsonStr = JSON.stringify(payload, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentDataset.summary.name.replace(/\s+/g, '_')}_Full_Chat_Data.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  if (!currentDataset) {
    return <div className="p-8 text-center text-slate-600 dark:text-slate-400 font-medium">Select a dataset to begin AI chat analysis.</div>;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] glass-panel rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-fadeIn shadow-lg">
      {/* Chat Header */}
      <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800/80 bg-slate-100/60 dark:bg-slate-900/60 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-600/30 border border-indigo-200 dark:border-indigo-500/40 flex items-center justify-center">
            <Bot className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-200">AI Data Analyst Assistant</h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Active dataset: <span className="text-indigo-600 dark:text-indigo-400 font-bold">{currentDataset.summary.name}</span></p>
          </div>
        </div>

        {/* Action Buttons: Export & Print */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleDownloadMarkdown}
            title="Download full chat transcript (.md)"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-bold transition-all shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Download All (.MD)</span>
          </button>

          <button
            onClick={handleDownloadJSON}
            title="Download full chat data (.JSON)"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-bold transition-all shadow-sm"
          >
            <FileText className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Export JSON</span>
          </button>

          <button
            onClick={handlePrint}
            title="Print full chat transcript or save as PDF"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print All Chats</span>
          </button>

          <div className="hidden sm:flex items-center space-x-2 text-[11px] px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>AST Sandbox</span>
          </div>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((msg) => {
          const isUser = msg.sender === 'USER';
          return (
            <div
              key={msg.id}
              className={`flex items-start space-x-3 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}
            >
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                isUser
                  ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-md'
                  : 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-700 shadow-sm'
              }`}>
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Content Bubble */}
              <div className={`max-w-3xl space-y-3 ${isUser ? 'items-end' : 'items-start'}`}>
                <div className={`p-4 rounded-2xl text-xs leading-relaxed ${
                  isUser
                    ? 'bg-indigo-600 text-white rounded-tr-none font-medium shadow-md'
                    : 'glass-card border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none space-y-3 shadow-sm'
                }`}>
                  {isUser ? (
                    <p>{msg.queryText}</p>
                  ) : (
                    <>
                      {/* Natural Language Explanation */}
                      <div className="prose prose-xs max-w-none text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                        <p>{msg.explanation}</p>
                      </div>

                      {/* Statistical Pills if any */}
                      {msg.stats && Object.keys(msg.stats).length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200 dark:border-slate-800/80">
                          {Object.entries(msg.stats).map(([k, v]) => (
                            <div key={k} className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-[11px]">
                              <span className="text-slate-500 dark:text-slate-400 capitalize font-medium">{k.replace('_', ' ')}: </span>
                              <span className="font-bold text-indigo-600 dark:text-indigo-300 ml-1">{String(v)}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Embedded Plotly Chart if present */}
                      {msg.chartConfig && (
                        <div className="mt-3">
                          <PlotlyChart config={msg.chartConfig} height={320} />
                        </div>
                      )}

                      {/* Code Snippet Drawer Toggle */}
                      {msg.safeCodeSnippet && (
                        <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80">
                          <button
                            onClick={() => setShowCodeFor(showCodeFor === msg.id ? null : msg.id)}
                            className="flex items-center space-x-1.5 text-[11px] text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-300 font-mono font-semibold transition-colors"
                          >
                            <Code2 className="w-3.5 h-3.5" />
                            <span>{showCodeFor === msg.id ? 'Hide Sandboxed Code' : 'View Safe Pandas Code'}</span>
                            {msg.executionTimeMs && <span className="text-slate-400 dark:text-slate-500">({msg.executionTimeMs}ms)</span>}
                          </button>

                          {showCodeFor === msg.id && (
                            <div className="mt-2 p-3 rounded-xl bg-slate-900 dark:bg-slate-950 border border-slate-800 font-mono text-[11px] text-emerald-400 overflow-x-auto">
                              <code>{msg.safeCodeSnippet}</code>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Limitations Disclaimer */}
                      {msg.limitations && (
                        <div className="flex items-start space-x-2 text-[10px] text-slate-600 dark:text-slate-400 bg-amber-50 dark:bg-slate-900/50 p-2.5 rounded-lg border border-amber-200 dark:border-slate-800 font-medium">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                          <span>{msg.limitations}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Follow-up suggestion chips */}
                {!isUser && msg.suggestedFollowups && msg.suggestedFollowups.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {msg.suggestedFollowups.map((sug, i) => (
                      <button
                        key={i}
                        onClick={() => handleSend(sug)}
                        className="px-2.5 py-1 rounded-full bg-white dark:bg-slate-800/60 hover:bg-indigo-50 dark:hover:bg-indigo-600/20 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-300 border border-slate-200 dark:border-slate-700/60 hover:border-indigo-300 dark:hover:border-indigo-500/40 text-[11px] font-semibold transition-all flex items-center space-x-1 shadow-sm"
                      >
                        <span>{sug}</span>
                        <ArrowUpRight className="w-3 h-3 opacity-60" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-xl bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="glass-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-xs flex items-center space-x-2 font-medium">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-600 dark:text-indigo-400" />
              <span>Agents executing sandboxed query & generating visualizations...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Query Input Bar */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800/80 bg-slate-100/60 dark:bg-slate-900/60">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(input);
          }}
          className="flex items-center space-x-2"
        >
          <input
            type="text"
            placeholder="Ask a question (e.g. 'What is the relationship between advertising spend and sales?')..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            className="flex-1 bg-white dark:bg-slate-950/80 border border-slate-300 dark:border-slate-700/80 focus:border-indigo-500 rounded-2xl px-4 py-3 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none transition-colors shadow-sm font-medium"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-bold flex items-center space-x-1.5 transition-all shadow-lg shadow-indigo-600/30"
          >
            <span>Analyze</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
