import React from 'react';
import { 
  Bot, 
  BarChart3, 
  Database, 
  Wand2, 
  BrainCircuit, 
  GitCompare, 
  FileText, 
  Sparkles,
  LayoutDashboard,
  Sun,
  Moon
} from 'lucide-react';
import { DatasetSummary } from '../types';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  datasets: DatasetSummary[];
  selectedDataset: DatasetSummary | null;
  onSelectDataset: (d: DatasetSummary) => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  datasets,
  selectedDataset,
  onSelectDataset,
  isDarkMode,
  onToggleTheme
}) => {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'datasets', label: 'Dataset Studio', icon: Database },
    { id: 'chat', label: 'AI Chat Analyst', icon: Bot },
    { id: 'eda', label: 'EDA Explorer', icon: BarChart3 },
    { id: 'cleaning', label: 'Data Cleaning', icon: Wand2 },
    { id: 'ml', label: 'AutoML Studio', icon: BrainCircuit },
    { id: 'compare', label: 'Compare', icon: GitCompare },
    { id: 'reports', label: 'Reports', icon: FileText },
  ];

  return (
    <header className={`sticky top-0 z-50 glass-panel border-b px-4 py-3 transition-colors ${
      isDarkMode ? 'border-slate-800/80 bg-slate-950/80' : 'border-slate-200/80 bg-white/80'
    }`}>
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center glow-brand shadow-lg">
            <Sparkles className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 dark:from-indigo-400 dark:via-purple-300 dark:to-pink-400">
                Agentic AI
              </span>
              <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${
                isDarkMode 
                  ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' 
                  : 'bg-indigo-50 text-indigo-700 border-indigo-200'
              }`}>
                Agentic Analyst
              </span>
            </div>
            <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Data Analysis & Predictive Intelligence
            </p>
          </div>
        </div>

        {/* Center Controls: Dataset Dropdown & Theme Toggle */}
        <div className="flex items-center space-x-2">
          {/* Dataset Selector Quick Dropdown */}
          <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl border transition-colors ${
            isDarkMode ? 'bg-slate-900 border-slate-700/60' : 'bg-slate-100 border-slate-200 shadow-sm'
          }`}>
            <Database className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
            <span className={`text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Dataset:</span>
            <select
              value={selectedDataset?.id || ''}
              onChange={(e) => {
                const found = datasets.find(d => d.id === Number(e.target.value));
                if (found) onSelectDataset(found);
              }}
              className={`bg-transparent text-xs font-semibold focus:outline-none cursor-pointer ${
                isDarkMode ? 'text-slate-200' : 'text-slate-800'
              }`}
            >
              {datasets.map((d) => (
                <option key={d.id} value={d.id} className={isDarkMode ? 'bg-slate-900 text-slate-200' : 'bg-white text-slate-800'}>
                  {d.name} ({d.rowCount} rows)
                </option>
              ))}
            </select>
          </div>

          {/* White / Dark Background Toggle Button */}
          <button
            onClick={onToggleTheme}
            aria-label="Toggle Light / Dark Mode"
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all duration-200 ${
              isDarkMode
                ? 'bg-slate-900 hover:bg-slate-800 text-amber-400 border-slate-700/80 shadow-inner'
                : 'bg-white hover:bg-slate-100 text-indigo-600 border-slate-200 shadow-sm'
            }`}
          >
            {isDarkMode ? (
              <>
                <Sun className="w-4 h-4 text-amber-400 animate-spin-slow" />
                <span className="text-slate-300">Light</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-indigo-600" />
                <span className="text-slate-700">Dark</span>
              </>
            )}
          </button>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center space-x-1 overflow-x-auto max-w-full pb-1 md:pb-0">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 whitespace-nowrap ${
                  isActive
                    ? isDarkMode
                      ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 shadow-sm'
                      : 'bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-600/20'
                    : isDarkMode
                      ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? (isDarkMode ? 'text-indigo-400' : 'text-white') : (isDarkMode ? 'text-slate-400' : 'text-slate-500')}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
