import React from 'react';
import { 
  Database, 
  Bot, 
  Sparkles, 
  BarChart3, 
  Wand2, 
  BrainCircuit, 
  TrendingUp, 
  ArrowRight,
  Zap,
  CheckCircle2,
  Trash2
} from 'lucide-react';
import { DatasetDetail, DatasetSummary } from '../types';
import { QualityBadge } from '../components/QualityBadge';

interface DashboardPageProps {
  datasets: DatasetSummary[];
  currentDataset: DatasetDetail | null;
  onSelectDataset: (d: DatasetSummary) => void;
  onDeleteDataset?: (id: number) => void;
  setActiveTab: (tab: string) => void;
  onAskPrompt: (prompt: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  datasets,
  currentDataset,
  onSelectDataset,
  onDeleteDataset,
  setActiveTab,
  onAskPrompt
}) => {
  const quickPrompts = [
    "Compare sales by channel using a column chart",
    "Show monthly sales trends over time using a line graph",
    "What is the proportional percentage share by category using a pie chart?",
    "Show geographic regional performance distribution on a map",
    "What is the relationship between advertising spend and sales?",
    "Train a high-accuracy predictive ML model for Revenue"
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl p-8 bg-gradient-to-r from-indigo-600/90 via-purple-600/80 to-slate-900 dark:from-indigo-950/80 dark:via-purple-950/60 dark:to-slate-950 border border-indigo-200 dark:border-indigo-500/20 shadow-xl">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/20 dark:bg-indigo-500/20 text-white dark:text-indigo-300 text-xs font-semibold backdrop-blur-sm border border-white/30 dark:border-indigo-500/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Autonomous Multi-Agent Data Intelligence</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
            Agentic AI Data Analysis & Visualization Assistant
          </h1>
          <p className="text-indigo-50 dark:text-slate-300 text-sm md:text-base leading-relaxed">
            Upload complex datasets or query with natural language. The system automatically profiles schemas, cleans anomalies, conducts exploratory statistics, renders charts, and builds predictive ML models.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => setActiveTab('chat')}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-white text-indigo-700 hover:bg-indigo-50 dark:bg-indigo-600 dark:text-white dark:hover:bg-indigo-500 text-sm font-bold transition-all shadow-lg"
            >
              <Bot className="w-4 h-4" />
              <span>Launch AI Analyst Chat</span>
            </button>
            <button
              onClick={() => setActiveTab('datasets')}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-black/20 hover:bg-black/30 text-white text-sm font-semibold border border-white/20 transition-all backdrop-blur-sm"
            >
              <Database className="w-4 h-4 text-indigo-300" />
              <span>Manage Datasets</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      {currentDataset && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active Dataset</span>
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-slate-900 dark:text-slate-100 truncate">{currentDataset.summary.name}</span>
              <span className="text-xs px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300 font-mono font-bold">
                {currentDataset.summary.fileFormat}
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">{currentDataset.summary.rowCount} rows &bull; {currentDataset.summary.columnCount} columns</p>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Quality Score</span>
            <div className="flex items-center justify-between">
              <QualityBadge score={currentDataset.summary.qualityScore} grade={currentDataset.summary.qualityGrade} />
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">Completeness: 100% &bull; Zero Duplicates</p>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Numeric Features</span>
            <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
              {currentDataset.columns.filter(c => c.inferredType === 'numeric').length}
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 ml-2">columns</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">Continuous distributions tracked</p>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Agent Engine</span>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
              <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">Supervisor Active</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">AST Sandbox + Local Heuristic AI</p>
          </div>
        </div>
      )}

      {/* Fast Prompt Launcher */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Zap className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Suggested Natural Language Queries</h2>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Click any prompt to analyze</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {quickPrompts.map((prompt, idx) => (
            <div
              key={idx}
              onClick={() => {
                onAskPrompt(prompt);
                setActiveTab('chat');
              }}
              className="glass-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-slate-800/40 cursor-pointer transition-all duration-200 group shadow-sm hover:shadow"
            >
              <div className="flex items-start justify-between">
                <p className="text-xs text-slate-800 dark:text-slate-200 font-semibold group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">
                  "{prompt}"
                </p>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 shrink-0 ml-2 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Available Datasets Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Available Datasets</h2>
          <button
            onClick={() => setActiveTab('datasets')}
            className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-bold"
          >
            Upload New +
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {datasets.map((d) => (
            <div
              key={d.id}
              onClick={() => onSelectDataset(d)}
              className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                currentDataset?.summary.id === d.id
                  ? 'bg-indigo-50/80 border-indigo-500 dark:bg-indigo-950/40 dark:border-indigo-500/80 shadow-md'
                  : 'glass-panel border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">{d.name}</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">{d.description || d.originalFilename}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <QualityBadge score={d.qualityScore} grade={d.qualityGrade} size="sm" />
                  {onDeleteDataset && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm(`Are you sure you want to delete dataset "${d.name}"?`)) {
                          onDeleteDataset(d.id);
                        }
                      }}
                      title="Delete dataset"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-transparent hover:border-rose-300 dark:hover:border-rose-800 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-4 mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 font-medium">
                <span>{d.rowCount} rows</span>
                <span>&bull;</span>
                <span>{d.columnCount} columns</span>
                <span>&bull;</span>
                <span>{d.fileFormat}</span>
                {currentDataset?.summary.id === d.id && (
                  <span className="ml-auto text-emerald-600 dark:text-emerald-400 font-bold flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Active</span>
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
