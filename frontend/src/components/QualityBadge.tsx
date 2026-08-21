import React from 'react';
import { ShieldCheck, ShieldAlert } from 'lucide-react';

interface QualityBadgeProps {
  score: number;
  grade?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const QualityBadge: React.FC<QualityBadgeProps> = ({
  score,
  grade,
  size = 'md'
}) => {
  const getColors = () => {
    if (score >= 90) return { 
      bg: 'bg-emerald-100 dark:bg-emerald-500/10', 
      border: 'border-emerald-300 dark:border-emerald-500/30', 
      text: 'text-emerald-800 dark:text-emerald-400', 
      gradeText: 'text-emerald-900 dark:text-emerald-300' 
    };
    if (score >= 80) return { 
      bg: 'bg-blue-100 dark:bg-blue-500/10', 
      border: 'border-blue-300 dark:border-blue-500/30', 
      text: 'text-blue-800 dark:text-blue-400', 
      gradeText: 'text-blue-900 dark:text-blue-300' 
    };
    if (score >= 70) return { 
      bg: 'bg-amber-100 dark:bg-amber-500/10', 
      border: 'border-amber-300 dark:border-amber-500/30', 
      text: 'text-amber-800 dark:text-amber-400', 
      gradeText: 'text-amber-900 dark:text-amber-300' 
    };
    return { 
      bg: 'bg-rose-100 dark:bg-rose-500/10', 
      border: 'border-rose-300 dark:border-rose-500/30', 
      text: 'text-rose-800 dark:text-rose-400', 
      gradeText: 'text-rose-900 dark:text-rose-300' 
    };
  };

  const colors = getColors();

  if (size === 'sm') {
    return (
      <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${colors.bg} ${colors.border} ${colors.text}`}>
        <span>{score.toFixed(1)}%</span>
        {grade && <span className="opacity-90">({grade})</span>}
      </span>
    );
  }

  if (size === 'lg') {
    return (
      <div className={`flex items-center space-x-4 p-4 rounded-2xl border ${colors.bg} ${colors.border} shadow-sm`}>
        <div className="w-14 h-14 rounded-xl bg-white dark:bg-slate-900/80 flex items-center justify-center border border-slate-200 dark:border-slate-700/60 shadow-inner">
          <span className={`text-2xl font-black ${colors.gradeText}`}>{grade || 'A'}</span>
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <span className={`text-2xl font-black ${colors.text}`}>{score.toFixed(1)}/100</span>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Quality Score</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-0.5">Automated Multi-Metric Health Audit</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-xl border ${colors.bg} ${colors.border} shadow-sm`}>
      {score >= 80 ? (
        <ShieldCheck className={`w-4 h-4 ${colors.text}`} />
      ) : (
        <ShieldAlert className={`w-4 h-4 ${colors.text}`} />
      )}
      <span className={`text-sm font-black ${colors.text}`}>{score.toFixed(1)}%</span>
      {grade && (
        <span className={`text-xs px-2 py-0.5 rounded font-black bg-white dark:bg-slate-900/60 ${colors.gradeText} shadow-sm`}>
          Grade {grade}
        </span>
      )}
    </div>
  );
};
