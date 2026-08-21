import React, { useState } from 'react';
import { 
  BrainCircuit, 
  Target, 
  Sliders, 
  Sparkles, 
  CheckCircle2, 
  Layers, 
  Play,
  Zap,
  Activity
} from 'lucide-react';
import { DatasetDetail, MLTrainResult } from '../types';
import { PlotlyChart } from '../components/PlotlyChart';
import { api } from '../services/api';

interface MLPageProps {
  currentDataset: DatasetDetail | null;
}

export const MLPage: React.FC<MLPageProps> = ({ currentDataset }) => {
  const [targetCol, setTargetCol] = useState<string>('');
  const [taskType, setTaskType] = useState<string>('auto');
  const [isTraining, setIsTraining] = useState(false);
  const [mlResult, setMlResult] = useState<MLTrainResult | null>(null);

  React.useEffect(() => {
    if (currentDataset && currentDataset.columns.length > 0 && !targetCol) {
      const numCols = currentDataset.columns.filter(c => c.inferredType === 'numeric' || c.inferredType === 'boolean');
      setTargetCol(numCols.length > 0 ? numCols[numCols.length - 1].columnName : currentDataset.columns[0].columnName);
    }
  }, [currentDataset]);

  const handleTrain = async () => {
    if (!currentDataset || !targetCol) return;
    setIsTraining(true);
    try {
      const res = await api.trainML(currentDataset.summary.id, targetCol, taskType);
      setMlResult(res);
    } finally {
      setIsTraining(false);
    }
  };

  if (!currentDataset) {
    return <div className="p-8 text-center text-slate-600 dark:text-slate-400 font-medium">Select a dataset to train models.</div>;
  }

  const featChartConfig = mlResult?.feature_importance ? {
    data: [{
      type: 'bar',
      orientation: 'h',
      x: mlResult.feature_importance.map(f => f.importance).reverse(),
      y: mlResult.feature_importance.map(f => f.feature).reverse(),
      marker: { color: '#6366f1', opacity: 0.85 }
    }],
    layout: {
      title: { text: "Relative Feature Importance" },
      xaxis: { title: "Importance Weight" },
      margin: { l: 120, r: 20, t: 40, b: 40 },
      paper_bgcolor: "rgba(0,0,0,0)",
      plot_bgcolor: "rgba(0,0,0,0)",
      font: { color: "#64748b" }
    }
  } : null;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <BrainCircuit className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">AutoML & Predictive Intelligence</h1>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">
            Automated feature engineering, model selection (Random Forest, XGBoost, Ridge), cross-validation, and diagnostics
          </p>
        </div>
      </div>

      {/* Model Training Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass-panel p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Model Configuration</h2>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-400 block mb-1">Target Variable (y):</label>
              <select
                value={targetCol}
                onChange={(e) => setTargetCol(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-200 text-xs font-semibold rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 shadow-sm"
              >
                {currentDataset.columns.map(c => (
                  <option key={c.columnName} value={c.columnName}>{c.columnName} ({c.inferredType})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-400 block mb-1">Task Type:</label>
              <select
                value={taskType}
                onChange={(e) => setTaskType(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-200 text-xs font-semibold rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 shadow-sm"
              >
                <option value="auto">Auto-Detect</option>
                <option value="regression">Regression (Continuous Value)</option>
                <option value="classification">Classification (Categories / Binary)</option>
                <option value="clustering">Clustering (K-Means)</option>
                <option value="anomaly_detection">Anomaly Detection (Isolation Forest)</option>
              </select>
            </div>

            <button
              onClick={handleTrain}
              disabled={isTraining}
              className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2"
            >
              <Play className="w-4 h-4" />
              <span>{isTraining ? 'Training AutoML Pipeline...' : 'Train Predictive Model'}</span>
            </button>
          </div>
        </div>

        {/* Model Results / Performance Card */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Evaluation Metrics</h2>
            {mlResult && (
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-mono font-bold">
                {mlResult.algorithm}
              </span>
            )}
          </div>

          {mlResult ? (
            <div className="space-y-6">
              {/* Metric KPI Pills */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {Object.entries(mlResult.metrics).map(([k, v]) => (
                  <div key={k} className="bg-slate-50 dark:bg-slate-900/80 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold">{k.replace('_', ' ')}</span>
                    <p className="text-base font-black text-indigo-600 dark:text-indigo-400 mt-0.5">{String(v)}</p>
                  </div>
                ))}
              </div>

              {/* Insights */}
              <div className="bg-indigo-50 dark:bg-indigo-950/20 p-4 rounded-2xl border border-indigo-200 dark:border-indigo-500/20 space-y-2">
                <div className="flex items-center space-x-2 text-xs font-bold text-indigo-900 dark:text-indigo-300">
                  <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Model Summary & Interpretation</span>
                </div>
                <p className="text-xs text-slate-800 dark:text-slate-300 font-medium leading-relaxed">{mlResult.model_summary}</p>
                <ul className="space-y-1 text-xs text-slate-700 dark:text-slate-400 font-medium">
                  {mlResult.insights.map((ins, i) => (
                    <li key={i}>&bull; {ins}</li>
                  ))}
                </ul>
              </div>

              {/* Feature Importance Chart */}
              {featChartConfig && (
                <div className="space-y-2">
                  <PlotlyChart config={featChartConfig} height={280} />
                </div>
              )}
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-500 dark:text-slate-400 space-y-2 font-medium">
              <BrainCircuit className="w-8 h-8 text-slate-400 dark:text-slate-600" />
              <p className="text-xs">Click 'Train Predictive Model' to automatically generate ML algorithms and feature importance.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
