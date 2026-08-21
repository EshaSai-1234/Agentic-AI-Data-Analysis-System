import React, { useState, useEffect } from 'react';
import { 
  Wand2, 
  CheckCircle2, 
  ArrowRight, 
  ShieldCheck, 
  Trash2, 
  Plus, 
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { DatasetDetail, CleaningPlan, CleaningStep } from '../types';
import { QualityBadge } from '../components/QualityBadge';
import { api } from '../services/api';

interface CleaningPageProps {
  currentDataset: DatasetDetail | null;
  onDatasetUpdated?: () => void;
}

export const CleaningPage: React.FC<CleaningPageProps> = ({ currentDataset, onDatasetUpdated }) => {
  const [cleaningPlan, setCleaningPlan] = useState<CleaningPlan | null>(null);
  const [activeSteps, setActiveSteps] = useState<CleaningStep[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [cleaningResult, setCleaningResult] = useState<any>(null);
  const [newAction, setNewAction] = useState<string>('impute_missing');
  const [newColumn, setNewColumn] = useState<string>('');
  const [newStrategy, setNewStrategy] = useState<string>('median');

  const handleAddStep = () => {
    if (!currentDataset) return;
    const colTarget = newColumn || (currentDataset.columns[0]?.columnName || '');
    const newStep: CleaningStep = {
      action: newAction,
      column: newAction === 'drop_duplicates' ? undefined : colTarget,
      strategy: newStrategy
    };
    setActiveSteps([...activeSteps, newStep]);
  };

  useEffect(() => {
    if (currentDataset) {
      loadRecommendations();
    }
  }, [currentDataset]);

  const loadRecommendations = async () => {
    if (!currentDataset) return;
    setIsLoading(true);
    try {
      const plan = await api.getCleaningRecommendations(currentDataset.summary.id);
      setCleaningPlan(plan);
      setActiveSteps(plan.recommended_steps);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = async () => {
    if (!currentDataset || activeSteps.length === 0) return;
    setIsApplying(true);
    try {
      const res = await api.applyCleaning(currentDataset.summary.id, activeSteps);
      setCleaningResult(res);
      if (onDatasetUpdated) onDatasetUpdated();
    } finally {
      setIsApplying(false);
    }
  };

  if (!currentDataset) {
    return <div className="p-8 text-center text-slate-600 dark:text-slate-400 font-medium">Select a dataset to clean.</div>;
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <Wand2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">Data Cleaning Studio</h1>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">
            Autonomous anomaly remediation, missing value imputation, deduplication, and outlier winsorization
          </p>
        </div>

        <button
          onClick={loadRecommendations}
          disabled={isLoading}
          className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 transition-all shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Re-evaluate Dataset</span>
        </button>
      </div>

      {/* Cleaning Result Banner if applied */}
      {cleaningResult && (
        <div className="p-6 rounded-3xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-500/40 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-base font-extrabold text-emerald-900 dark:text-emerald-200">Cleaning Successfully Applied!</h3>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-600 dark:text-slate-400 font-semibold">Quality Improvement:</span>
              <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-bold text-xs">
                +{Math.max(0, (cleaningResult.quality_score_after - cleaningResult.quality_score_before)).toFixed(1)}%
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-800 dark:text-slate-300 font-medium">
            {cleaningResult.applied_steps_summary?.map((step: string, idx: number) => (
              <div key={idx} className="bg-white dark:bg-slate-900/60 p-3 rounded-xl border border-emerald-200 dark:border-slate-800 flex items-center space-x-2 shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>{step}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommended Cleaning Recipe */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-panel p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Configured Cleaning Recipe</h2>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">{activeSteps.length} operations</span>
          </div>

          <div className="space-y-3">
            {activeSteps.map((step, idx) => (
              <div key={idx} className="bg-white dark:bg-slate-900/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold font-mono tracking-wider bg-indigo-100 text-indigo-800 dark:bg-indigo-500/20 dark:text-indigo-300 px-2 py-0.5 rounded">
                      {step.action.replace('_', ' ')}
                    </span>
                    {step.column && (
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-300">
                        Target: <code className="text-indigo-600 dark:text-indigo-400">{step.column}</code>
                      </span>
                    )}
                  </div>
                  {step.strategy && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Strategy: <span className="text-slate-800 dark:text-slate-200 font-semibold capitalize">{step.strategy}</span></p>
                  )}
                </div>

                <button
                  onClick={() => setActiveSteps(activeSteps.filter((_, i) => i !== idx))}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Add Custom Operation Builder */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-1.5">
              <Plus className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Add Custom Operation to Recipe</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <select
                value={newAction}
                onChange={(e) => setNewAction(e.target.value)}
                className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-200 text-xs font-semibold rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 shadow-sm"
              >
                <option value="impute_missing">Impute Missing</option>
                <option value="cap_outliers">Cap Outliers (IQR)</option>
                <option value="drop_columns">Drop Column</option>
                <option value="drop_duplicates">Drop Duplicates</option>
              </select>

              {newAction !== 'drop_duplicates' && (
                <select
                  value={newColumn}
                  onChange={(e) => setNewColumn(e.target.value)}
                  className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-200 text-xs font-semibold rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 shadow-sm"
                >
                  {currentDataset.columns.map(c => (
                    <option key={c.columnName} value={c.columnName}>{c.columnName}</option>
                  ))}
                </select>
              )}

              {newAction === 'impute_missing' && (
                <select
                  value={newStrategy}
                  onChange={(e) => setNewStrategy(e.target.value)}
                  className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-200 text-xs font-semibold rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 shadow-sm"
                >
                  <option value="median">Median</option>
                  <option value="mean">Mean</option>
                  <option value="mode">Mode</option>
                </select>
              )}

              <button
                onClick={handleAddStep}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Step</span>
              </button>
            </div>
          </div>

          <button
            onClick={handleApply}
            disabled={isApplying || activeSteps.length === 0}
            className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2"
          >
            <Wand2 className="w-4 h-4" />
            <span>{isApplying ? 'Applying Transformations...' : 'Apply Recipe & Save Cleaned Dataset'}</span>
          </button>
        </div>

        {/* Quality Forecast & Rationale */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Quality Impact Forecast</h2>

            <div className="bg-slate-50 dark:bg-slate-900/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-2">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">Estimated Quality Boost</span>
              <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
                +{cleaningPlan?.estimated_quality_improvement || 14.5}%
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">Predicted final grade: <strong className="text-emerald-700 dark:text-emerald-300">A+</strong></p>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-300">Agent Rationale:</span>
              <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 font-medium">
                {cleaningPlan?.rationale.map((r, i) => (
                  <li key={i} className="flex items-start space-x-2">
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold">&bull;</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
