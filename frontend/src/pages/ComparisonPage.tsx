import React, { useState } from 'react';
import { 
  GitCompare, 
  ArrowRight, 
  CheckCircle2, 
  TrendingUp, 
  Layers,
  Sparkles
} from 'lucide-react';
import { DatasetDetail, DatasetSummary } from '../types';
import { QualityBadge } from '../components/QualityBadge';

interface ComparisonPageProps {
  datasets: DatasetSummary[];
  currentDataset: DatasetDetail | null;
}

export const ComparisonPage: React.FC<ComparisonPageProps> = ({
  datasets,
  currentDataset
}) => {
  const [selectedIdA, setSelectedIdA] = useState<number>(datasets[0]?.id || 1);
  const [selectedIdB, setSelectedIdB] = useState<number>(datasets[1]?.id || (datasets[0]?.id || 1));

  const datasetA = datasets.find(d => d.id === Number(selectedIdA)) || datasets[0];
  const datasetB = datasets.find(d => d.id === Number(selectedIdB)) || datasets[1] || datasets[0];

  const rowDelta = datasetB ? datasetB.rowCount - datasetA.rowCount : 0;
  const colDelta = datasetB ? datasetB.columnCount - datasetA.columnCount : 0;
  const qualityDelta = datasetB ? Number((datasetB.qualityScore - datasetA.qualityScore).toFixed(1)) : 0;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <GitCompare className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">Dataset Comparison Matrix</h1>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">
            Side-by-side comparative analysis of datasets (Raw vs Cleaned, or Multi-Cohort Drift)
          </p>
        </div>
      </div>

      {/* Dataset Selection Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-panel p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-400 uppercase tracking-wider block">Dataset A (Baseline)</label>
          <select
            value={selectedIdA}
            onChange={(e) => setSelectedIdA(Number(e.target.value))}
            className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-200 text-xs font-semibold rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500 shadow-sm"
          >
            {datasets.map(d => (
              <option key={d.id} value={d.id}>{d.name} ({d.rowCount} rows, {d.fileFormat})</option>
            ))}
          </select>
        </div>

        <div className="glass-panel p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-400 uppercase tracking-wider block">Dataset B (Comparison)</label>
          <select
            value={selectedIdB}
            onChange={(e) => setSelectedIdB(Number(e.target.value))}
            className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-200 text-xs font-semibold rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500 shadow-sm"
          >
            {datasets.map(d => (
              <option key={d.id} value={d.id}>{d.name} ({d.rowCount} rows, {d.fileFormat})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Comparative Metrics Delta Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-1">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold">Row Count Delta</span>
          <div className={`text-2xl font-black ${rowDelta >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-amber-600 dark:text-amber-400'}`}>
            {rowDelta >= 0 ? `+${rowDelta}` : rowDelta} rows
          </div>
          <p className="text-[11px] text-slate-500 font-medium">{datasetA?.rowCount} &rarr; {datasetB?.rowCount}</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-1">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold">Feature Dimension Delta</span>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-200">
            {colDelta >= 0 ? `+${colDelta}` : colDelta} columns
          </div>
          <p className="text-[11px] text-slate-500 font-medium">{datasetA?.columnCount} &rarr; {datasetB?.columnCount}</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-1">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold">Quality Delta</span>
          <div className={`text-2xl font-black ${qualityDelta >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {qualityDelta >= 0 ? `+${qualityDelta}%` : `${qualityDelta}%`}
          </div>
          <p className="text-[11px] text-slate-500 font-medium">{datasetA?.qualityScore}% &rarr; {datasetB?.qualityScore}%</p>
        </div>
      </div>

      {/* Side by side comparison summary */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Comparative Schema Overview</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-50 dark:bg-slate-900/80 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-slate-900 dark:text-slate-200 text-sm">{datasetA?.name}</h3>
              <QualityBadge score={datasetA?.qualityScore || 90} grade={datasetA?.qualityGrade} size="sm" />
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">{datasetA?.description || 'Baseline dataset configuration'}</p>
            <div className="text-xs text-slate-700 dark:text-slate-300 space-y-1 pt-2 border-t border-slate-200 dark:border-slate-800 font-medium">
              <div>Format: <span className="font-mono font-bold text-indigo-600 dark:text-indigo-300">{datasetA?.fileFormat}</span></div>
              <div>File Size: <span className="font-mono text-slate-500 dark:text-slate-400">{Math.round((datasetA?.fileSizeBytes || 0) / 1024)} KB</span></div>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/80 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-slate-900 dark:text-slate-200 text-sm">{datasetB?.name}</h3>
              <QualityBadge score={datasetB?.qualityScore || 90} grade={datasetB?.qualityGrade} size="sm" />
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">{datasetB?.description || 'Target comparison dataset'}</p>
            <div className="text-xs text-slate-700 dark:text-slate-300 space-y-1 pt-2 border-t border-slate-200 dark:border-slate-800 font-medium">
              <div>Format: <span className="font-mono font-bold text-indigo-600 dark:text-indigo-300">{datasetB?.fileFormat}</span></div>
              <div>File Size: <span className="font-mono text-slate-500 dark:text-slate-400">{Math.round((datasetB?.fileSizeBytes || 0) / 1024)} KB</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
