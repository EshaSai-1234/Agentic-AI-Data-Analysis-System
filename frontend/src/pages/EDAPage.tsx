import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Flame, 
  Activity, 
  Layers,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { DatasetDetail, EDAResult } from '../types';
import { PlotlyChart } from '../components/PlotlyChart';
import { api } from '../services/api';

interface EDAPageProps {
  currentDataset: DatasetDetail | null;
}

export const EDAPage: React.FC<EDAPageProps> = ({ currentDataset }) => {
  const [edaData, setEdaData] = useState<EDAResult | null>(null);
  const [selectedNumCol, setSelectedNumCol] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentDataset) {
      loadEDA();
    }
  }, [currentDataset]);

  const loadEDA = async () => {
    if (!currentDataset) return;
    setLoading(true);
    try {
      const data = await api.getEDA(currentDataset.summary.id);
      setEdaData(data);
      if (data.numeric_columns.length > 0) {
        setSelectedNumCol(data.numeric_columns[0]);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!currentDataset) {
    return <div className="p-8 text-center text-slate-600 dark:text-slate-400 font-medium">Select a dataset to view EDA.</div>;
  }

  const [chartType, setChartType] = useState<string>('column');

  const corrCols = edaData ? Object.keys(edaData.correlation_matrix) : [];
  const heatmapConfig = corrCols.length >= 2 ? {
    data: [{
      type: 'heatmap',
      x: corrCols,
      y: corrCols,
      z: corrCols.map(c1 => corrCols.map(c2 => edaData!.correlation_matrix[c1]?.[c2] ?? 0)),
      colorscale: 'RdBu',
      reversescale: true,
      zmin: -1,
      zmax: 1
    }],
    layout: {
      title: { text: "Pairwise Feature Correlation Heatmap" },
      paper_bgcolor: "rgba(0,0,0,0)",
      plot_bgcolor: "rgba(0,0,0,0)",
      font: { color: "#64748b" }
    }
  } : null;

  const distInfo = selectedNumCol && edaData?.distributions?.[selectedNumCol];
  
  const getDynamicChartConfig = () => {
    if (!distInfo) return null;
    const xVals = distInfo.bins;
    const yVals = distInfo.counts;

    if (chartType === 'line') {
      return {
        data: [{
          type: 'scatter',
          mode: 'lines+markers',
          x: xVals,
          y: yVals,
          line: { color: '#6366f1', shape: 'spline', smoothing: 1.2, width: 3 },
          marker: { size: 6, color: '#4f46e5' },
          fill: 'tozeroy',
          fillcolor: 'rgba(99, 102, 241, 0.15)'
        }],
        layout: { title: { text: `Line Trend Distribution: ${selectedNumCol}` }, xaxis: { title: "Ranges" }, yaxis: { title: "Frequency" } }
      };
    } else if (chartType === 'pie') {
      return {
        data: [{
          type: 'pie',
          labels: xVals,
          values: yVals,
          hole: 0.4,
          textinfo: 'percent+label'
        }],
        layout: { title: { text: `Proportional Breakdown: ${selectedNumCol}` } }
      };
    } else if (chartType === 'box') {
      return {
        data: [{
          type: 'box',
          y: yVals,
          name: selectedNumCol,
          boxpoints: 'outliers',
          marker: { color: '#8b5cf6' }
        }],
        layout: { title: { text: `Box & Quartile Spread: ${selectedNumCol}` } }
      };
    } else if (chartType === 'map') {
      return {
        data: [{
          type: 'choropleth',
          locations: xVals,
          locationmode: 'country names',
          z: yVals,
          colorscale: 'Viridis'
        }],
        layout: { title: { text: `Geographic Feature Frequency Map: ${selectedNumCol}` } }
      };
    }

    // Default Column / Bar chart
    return {
      data: [{
        type: 'bar',
        x: xVals,
        y: yVals,
        marker: { color: '#6366f1', opacity: 0.85 }
      }],
      layout: {
        title: { text: `Column Binned Distribution: ${selectedNumCol}` },
        xaxis: { title: "Value Ranges" },
        yaxis: { title: "Frequency Count" },
        paper_bgcolor: "rgba(0,0,0,0)",
        plot_bgcolor: "rgba(0,0,0,0)",
        font: { color: "#64748b" }
      }
    };
  };

  const distConfig = getDynamicChartConfig();

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">Exploratory Data Analysis (EDA)</h1>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">
            Multi-variate statistical distributions, correlations, and observations
          </p>
        </div>

        <button
          onClick={loadEDA}
          disabled={loading}
          className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 transition-all shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Analysis</span>
        </button>
      </div>

      {/* Automated Key Observations */}
      {edaData?.key_observations && (
        <div className="glass-panel p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-200">AI-Synthesized Statistical Insights</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {edaData.key_observations.map((obs, i) => (
              <div key={i} className="glass-card p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-300 leading-relaxed font-medium">
                {obs}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grid: Correlation Heatmap + Top Associations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-panel p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Correlation Matrix</h2>
          {heatmapConfig ? (
            <PlotlyChart config={heatmapConfig} height={380} />
          ) : (
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Insufficient numeric columns for correlation heatmap.</p>
          )}
        </div>

        {/* Top Correlation Rankings */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center space-x-2">
            <Flame className="w-4 h-4 text-rose-500" />
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Top Associations (r)</h2>
          </div>

          <div className="space-y-2.5 max-h-[380px] overflow-y-auto">
            {edaData?.top_correlations.map((corr, idx) => (
              <div key={idx} className="bg-slate-50 dark:bg-slate-900/80 p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-200">{corr.col1} &bull; {corr.col2}</div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 capitalize font-medium">{corr.strength.replace('_', ' ')}</span>
                </div>
                <span className={`text-sm font-bold font-mono px-2 py-0.5 rounded ${
                  corr.correlation >= 0.7 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300' :
                  corr.correlation >= 0.4 ? 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300' : 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                }`}>
                  {corr.correlation > 0 ? `+${corr.correlation}` : corr.correlation}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Distribution Explorer */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Univariate Feature Distribution</h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">Inspect histograms, spread, skewness, and central tendencies</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
              {[
                { id: 'column', label: 'Column' },
                { id: 'line', label: 'Line' },
                { id: 'pie', label: 'Pie' },
                { id: 'box', label: 'Box' },
                { id: 'map', label: 'Map' }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setChartType(t.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    chartType === t.id
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-600 dark:text-slate-400 font-bold">Select Column:</span>
              <select
                value={selectedNumCol}
                onChange={(e) => setSelectedNumCol(e.target.value)}
                className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-200 text-xs font-semibold rounded-xl px-3 py-1.5 focus:outline-none focus:border-indigo-500 shadow-sm"
              >
                {edaData?.numeric_columns.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {distConfig && (
          <div className="space-y-4">
            <PlotlyChart config={distConfig} height={320} />
            {distInfo && (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold">Mean</span>
                  <p className="text-sm font-extrabold text-slate-900 dark:text-slate-200">{distInfo.mean}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold">Median</span>
                  <p className="text-sm font-extrabold text-slate-900 dark:text-slate-200">{distInfo.median}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold">Std Dev</span>
                  <p className="text-sm font-extrabold text-slate-900 dark:text-slate-200">{distInfo.std}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold">Min</span>
                  <p className="text-sm font-extrabold text-slate-900 dark:text-slate-200">{distInfo.min}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold">Max</span>
                  <p className="text-sm font-extrabold text-slate-900 dark:text-slate-200">{distInfo.max}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
