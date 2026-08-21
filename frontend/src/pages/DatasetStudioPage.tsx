import React, { useState } from 'react';
import { 
  Upload, 
  Database, 
  FileSpreadsheet, 
  Search, 
  CheckCircle, 
  AlertTriangle,
  Info,
  Layers,
  Sparkles,
  Trash2
} from 'lucide-react';
import { DatasetDetail } from '../types';
import { QualityBadge } from '../components/QualityBadge';

interface DatasetStudioProps {
  currentDataset: DatasetDetail | null;
  onUpload: (file: File, name?: string, desc?: string) => Promise<void>;
  onDelete?: (id: number) => void;
}

export const DatasetStudioPage: React.FC<DatasetStudioProps> = ({
  currentDataset,
  onUpload,
  onDelete
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedColumn, setSelectedColumn] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadName, setUploadName] = useState('');
  const [uploadDesc, setUploadDesc] = useState('');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setIsUploading(true);
      try {
        await onUpload(file, uploadName, uploadDesc);
      } finally {
        setIsUploading(false);
        setUploadName('');
        setUploadDesc('');
      }
    }
  };

  if (!currentDataset) {
    return (
      <div className="p-8 text-center text-slate-600 dark:text-slate-400 font-medium">No active dataset selected.</div>
    );
  }

  const { summary, columns, previewData, qualityBreakdown } = currentDataset;

  const filteredPreview = previewData.filter(row => {
    if (!searchTerm) return true;
    return Object.values(row).some(val => 
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Upload Zone & Metadata Header */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Card */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center space-x-2">
            <Upload className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Upload Dataset</h2>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400">Supports CSV, TSV, and Excel (.xlsx) up to 50MB.</p>

          <div className="space-y-3">
            <input
              type="text"
              placeholder="Dataset Name (optional)"
              value={uploadName}
              onChange={(e) => setUploadName(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 shadow-sm"
            />
            <label className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors group bg-slate-50/60 dark:bg-slate-900/40">
              <FileSpreadsheet className="w-8 h-8 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-2">
                {isUploading ? 'Ingesting & Profiling...' : 'Click or Drag CSV/XLSX Here'}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Automatic schema detection</span>
              <input
                type="file"
                accept=".csv,.tsv,.xlsx,.xls"
                onChange={handleFileChange}
                disabled={isUploading}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Dataset Summary & Quality Score Audit */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">{summary.name}</h2>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-mono font-bold">
                    {summary.fileFormat}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">{summary.description || 'Raw operational data'}</p>
              </div>
              <div className="flex items-center space-x-3">
                <QualityBadge score={summary.qualityScore} grade={summary.qualityGrade} size="lg" />
                {onDelete && (
                  <button
                    onClick={() => {
                      if (window.confirm(`Are you sure you want to delete dataset "${summary.name}"?`)) {
                        onDelete(summary.id);
                      }
                    }}
                    title="Delete dataset"
                    className="p-2.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200 dark:border-slate-800 hover:border-rose-300 dark:hover:border-rose-800 transition-all shadow-sm"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            {qualityBreakdown && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                <div className="bg-slate-100 dark:bg-slate-900/80 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold">Completeness</span>
                  <p className="text-sm font-extrabold text-slate-900 dark:text-slate-100 mt-0.5">{qualityBreakdown.completeness_score}%</p>
                </div>
                <div className="bg-slate-100 dark:bg-slate-900/80 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold">Uniqueness</span>
                  <p className="text-sm font-extrabold text-slate-900 dark:text-slate-100 mt-0.5">{qualityBreakdown.uniqueness_score}%</p>
                </div>
                <div className="bg-slate-100 dark:bg-slate-900/80 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold">Validity</span>
                  <p className="text-sm font-extrabold text-slate-900 dark:text-slate-100 mt-0.5">{qualityBreakdown.validity_score}%</p>
                </div>
                <div className="bg-slate-100 dark:bg-slate-900/80 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold">Consistency</span>
                  <p className="text-sm font-extrabold text-slate-900 dark:text-slate-100 mt-0.5">{qualityBreakdown.consistency_score}%</p>
                </div>
              </div>
            )}
          </div>

          <div className="text-xs text-indigo-900 dark:text-slate-300 bg-indigo-50 dark:bg-indigo-950/30 p-3 rounded-xl border border-indigo-200 dark:border-indigo-500/20 flex items-center space-x-2 font-medium">
            <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span>{qualityBreakdown?.summary || 'Dataset schema analyzed by Data Profiling Agent.'}</span>
          </div>
        </div>
      </div>

      {/* Column Schema Inspector */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Layers className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Schema & Column Diagnostics ({columns.length} features)</h2>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {columns.map((col) => (
            <div
              key={col.columnName}
              onClick={() => setSelectedColumn(selectedColumn === col.columnName ? null : col.columnName)}
              className={`p-3 rounded-xl border cursor-pointer transition-all ${
                selectedColumn === col.columnName
                  ? 'bg-indigo-50 dark:bg-indigo-900/40 border-indigo-500 shadow-sm'
                  : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-200 truncate">{col.columnName}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                  col.inferredType === 'numeric' ? 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300' :
                  col.inferredType === 'categorical' ? 'bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-300' :
                  'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300'
                }`}>
                  {col.inferredType}
                </span>
              </div>
              <div className="mt-2 text-[11px] text-slate-600 dark:text-slate-400 space-y-0.5 font-medium">
                <div>Nulls: <span className={col.nullCount > 0 ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-slate-800 dark:text-slate-300'}>{col.nullCount} ({col.nullPercentage}%)</span></div>
                <div>Distinct: <span className="text-slate-800 dark:text-slate-300 font-bold">{col.distinctCount}</span></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Data Preview Table */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Data Grid Preview</h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">First sample records loaded into memory</p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search values in preview..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 shadow-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 max-h-[420px] bg-white dark:bg-slate-950">
          <table className="w-full text-left text-xs text-slate-800 dark:text-slate-300 border-collapse">
            <thead className="bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-400 font-bold uppercase tracking-wider sticky top-0 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3 border-r border-slate-200 dark:border-slate-800">#</th>
                {columns.map((c) => (
                  <th key={c.columnName} className="p-3 border-r border-slate-200 dark:border-slate-800 whitespace-nowrap">
                    {c.columnName}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-mono font-medium">
              {filteredPreview.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="p-3 text-slate-500 dark:text-slate-500 border-r border-slate-200 dark:border-slate-800/80">{idx + 1}</td>
                  {columns.map((c) => (
                    <td key={c.columnName} className="p-3 border-r border-slate-200 dark:border-slate-800/80 whitespace-nowrap">
                      {row[c.columnName] !== null && row[c.columnName] !== undefined ? String(row[c.columnName]) : <span className="text-rose-500 italic font-bold">null</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
