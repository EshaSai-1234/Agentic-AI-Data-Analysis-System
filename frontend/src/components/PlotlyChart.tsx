import React, { useEffect, useRef } from 'react';

declare global {
  interface Window {
    Plotly: any;
  }
}

interface PlotlyChartProps {
  config: any;
  height?: number | string;
  className?: string;
}

export const PlotlyChart: React.FC<PlotlyChartProps> = ({
  config,
  height = 360,
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !config || !config.data || config.data.length === 0) return;

    const isDark = document.documentElement.classList.contains('dark') || !document.documentElement.classList.contains('light');

    const firstType = config.data[0]?.type;
    const isGeo = ['scattergeo', 'choropleth', 'mapbox', 'densitymapbox'].includes(firstType);
    const isPie = ['pie', 'donut'].includes(firstType);

    const layout: any = {
      autosize: true,
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
      font: { 
        family: 'Inter, sans-serif', 
        color: isDark ? '#94a3b8' : '#334155', 
        size: 12 
      },
      margin: { l: 45, r: 25, t: 40, b: 40 },
      ...config.layout
    };

    if (!isGeo && !isPie) {
      layout.xaxis = {
        gridcolor: isDark ? '#1e293b' : '#e2e8f0',
        zerolinecolor: isDark ? '#334155' : '#cbd5e1',
        tickfont: { color: isDark ? '#94a3b8' : '#475569' },
        ...config.layout?.xaxis
      };
      layout.yaxis = {
        gridcolor: isDark ? '#1e293b' : '#e2e8f0',
        zerolinecolor: isDark ? '#334155' : '#cbd5e1',
        tickfont: { color: isDark ? '#94a3b8' : '#475569' },
        ...config.layout?.yaxis
      };
    }

    if (isGeo) {
      layout.geo = {
        bgcolor: 'rgba(0,0,0,0)',
        showland: true,
        landcolor: isDark ? '#1e293b' : '#f8fafc',
        showocean: true,
        oceancolor: isDark ? '#0f172a' : '#e0f2fe',
        showlakes: true,
        lakecolor: isDark ? '#0f172a' : '#e0f2fe',
        showcoastlines: true,
        coastlinecolor: isDark ? '#475569' : '#94a3b8',
        countrycolor: isDark ? '#475569' : '#cbd5e1',
        subunitcolor: isDark ? '#334155' : '#e2e8f0',
        framecolor: isDark ? '#334155' : '#cbd5e1',
        ...config.layout?.geo
      };
    }

    if (window.Plotly) {
      window.Plotly.newPlot(containerRef.current, config.data, layout, {
        responsive: true,
        displayModeBar: false
      });
    }
  }, [config]);

  if (!config || !config.data || config.data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-slate-900/50 dark:bg-slate-900/50 bg-slate-100 rounded-xl border border-slate-800 dark:border-slate-800 border-slate-200 text-slate-500 text-sm">
        No chart visualization generated.
      </div>
    );
  }

  return (
    <div className={`w-full overflow-hidden rounded-2xl p-2 border transition-colors glass-card ${className}`}>
      <div
        ref={containerRef}
        style={{ width: '100%', height: typeof height === 'number' ? `${height}px` : height }}
      />
    </div>
  );
};
