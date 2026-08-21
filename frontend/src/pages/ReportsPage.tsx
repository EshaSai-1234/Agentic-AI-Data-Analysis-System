import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  Printer, 
  Sparkles, 
  CheckCircle2, 
  RefreshCw 
} from 'lucide-react';
import { DatasetDetail, ReportResult } from '../types';
import { api } from '../services/api';

interface ReportsPageProps {
  currentDataset: DatasetDetail | null;
}

export const ReportsPage: React.FC<ReportsPageProps> = ({ currentDataset }) => {
  const [report, setReport] = useState<ReportResult | null>(null);
  const [customTitle, setCustomTitle] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!currentDataset) return;
    setIsGenerating(true);
    try {
      const res = await api.generateReport(currentDataset.summary.id, customTitle || undefined);
      setReport(res);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadMarkdown = () => {
    if (!report) return;
    const blob = new Blob([report.markdown_content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.report_title.replace(/\s+/g, '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!currentDataset) {
    return <div className="p-8 text-center text-slate-600 dark:text-slate-400 font-medium">Select a dataset to generate reports.</div>;
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">Executive Report Generator</h1>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">
            Automated multi-section intelligence report compilation with data audits, EDA, ML findings, and strategic action plans
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {report && (
            <button
              onClick={handleDownloadMarkdown}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 transition-all shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Markdown</span>
            </button>
          )}

          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="flex items-center space-x-1.5 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-600/30"
          >
            <Sparkles className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>{isGenerating ? 'Compiling Report...' : 'Generate Full Report'}</span>
          </button>
        </div>
      </div>

      {/* Report Viewer / Preview */}
      <div className="glass-panel p-8 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-6 shadow-sm">
        {report ? (
          <div className="space-y-6">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">{report.report_title}</h2>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 font-medium">Generated for: <strong className="text-indigo-600 dark:text-indigo-300">{currentDataset.summary.name}</strong></p>
              </div>
              <div className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/20 text-xs font-extrabold">
                Quality: {report.quality_score}%
              </div>
            </div>

            {/* Markdown Display */}
            <div className="bg-slate-50 dark:bg-slate-950/70 p-6 rounded-2xl border border-slate-200 dark:border-slate-800/80 font-mono text-xs text-slate-900 dark:text-slate-300 leading-relaxed overflow-x-auto whitespace-pre-wrap font-medium">
              {report.markdown_content}
            </div>
          </div>
        ) : (
          <div className="h-72 flex flex-col items-center justify-center text-center p-6 text-slate-500 dark:text-slate-400 space-y-3 font-medium">
            <FileText className="w-10 h-10 text-slate-400 dark:text-slate-600" />
            <p className="text-xs">Click 'Generate Full Report' to automatically compile an executive intelligence report for {currentDataset.summary.name}.</p>
          </div>
        )}
      </div>
    </div>
  );
};
