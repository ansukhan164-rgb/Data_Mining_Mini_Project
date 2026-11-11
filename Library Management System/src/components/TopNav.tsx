import React, { useState, useEffect } from 'react';
import { useLibrary } from '../context/LibraryContext';
import {
  BookOpen,
  Layers,
  CheckCircle2,
  ArrowLeftRight,
  AlertTriangle,
  GraduationCap,
  Clock,
  Database,
  Upload,
  Download,
  Trash2,
  FileSpreadsheet,
} from 'lucide-react';

interface TopNavProps {
  onOpenUpload: () => void;
  onOpenPythonModal: () => void;
  onOpenSqlModal: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  onOpenUpload,
  onOpenPythonModal,
  onOpenSqlModal,
}) => {
  const { stats, datasetMeta, clearDataset, books, students, transactions } = useLibrary();
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const totalLoaded = books.length + students.length + transactions.length;

  return (
    <div className="flex flex-col bg-slate-900 border-b border-slate-800 text-white select-none">
      {/* 1. Main Header Strip */}
      <div className="flex flex-wrap items-center justify-between px-5 py-3 gap-3">
        {/* Left: Brand & Loaded Dataset Pill */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center shadow-md shadow-blue-500/20 ring-1 ring-blue-400/30 overflow-hidden">
            <img
              src="/library_logo.jpg"
              alt="Logo"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLElement).style.display = 'none';
              }}
            />
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm tracking-wider uppercase text-white">
                Athenaeum
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                Desktop Library & Analysis
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5 text-[11px]">
              {totalLoaded > 0 ? (
                <span className="flex items-center gap-1 text-emerald-400 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse" />
                  {datasetMeta.fileName || 'Local Dataset'} ({totalLoaded} records)
                </span>
              ) : (
                <span className="flex items-center gap-1 text-amber-400 font-medium">
                  <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                  No dataset loaded (Ready for upload)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Upload Button */}
          <button
            onClick={onOpenUpload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Dataset</span>
          </button>

          {/* Clear Dataset if data loaded */}
          {totalLoaded > 0 && (
            <button
              onClick={() => {
                if (confirm('Clear currently loaded dataset and start fresh?')) {
                  clearDataset();
                }
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/40 text-slate-300 hover:text-rose-300 text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
              title="Clear data to upload another file"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Data</span>
            </button>
          )}

          {/* Python Script Modal */}
          <button
            onClick={onOpenPythonModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-blue-300 font-semibold border border-slate-700 transition-colors cursor-pointer"
            title="View complete Python desktop script"
          >
            <span className="text-yellow-400 font-mono font-bold">🐍</span>
            <span>Python Script</span>
          </button>

          {/* SQL Schema Modal */}
          <button
            onClick={onOpenSqlModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-medium border border-slate-700 transition-colors cursor-pointer"
            title="Inspect relational SQL schema"
          >
            <Database className="w-3.5 h-3.5 text-slate-400" />
            <span>SQL Schema</span>
          </button>

          {/* Clock */}
          <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-400 font-mono bg-slate-950/60 px-2.5 py-1.5 rounded-lg border border-slate-800">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>{timeStr}</span>
          </div>
        </div>
      </div>

      {/* 2. KPI Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 px-5 py-2.5 bg-slate-950/70 border-t border-slate-800/80">
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg px-3 py-2 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Titles</div>
            <div className="text-lg font-black text-white">{stats.total_titles}</div>
          </div>
          <div className="w-8 h-8 rounded-md bg-blue-500/10 text-blue-400 flex items-center justify-center">
            <BookOpen className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-lg px-3 py-2 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Copies</div>
            <div className="text-lg font-black text-sky-400">{stats.total_copies}</div>
          </div>
          <div className="w-8 h-8 rounded-md bg-sky-500/10 text-sky-400 flex items-center justify-center">
            <Layers className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-lg px-3 py-2 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Available</div>
            <div className="text-lg font-black text-emerald-400">{stats.available_copies}</div>
          </div>
          <div className="w-8 h-8 rounded-md bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-lg px-3 py-2 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Borrowed</div>
            <div className="text-lg font-black text-amber-400">{stats.issued_books}</div>
          </div>
          <div className="w-8 h-8 rounded-md bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <ArrowLeftRight className="w-4 h-4" />
          </div>
        </div>

        <div
          className={`border rounded-lg px-3 py-2 flex items-center justify-between ${
            stats.overdue_books > 0
              ? 'bg-rose-950/40 border-rose-800/80'
              : 'bg-slate-900/90 border-slate-800'
          }`}
        >
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <span>Overdue</span>
              {stats.overdue_books > 0 && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />}
            </div>
            <div className={`text-lg font-black ${stats.overdue_books > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
              {stats.overdue_books}
            </div>
          </div>
          <div
            className={`w-8 h-8 rounded-md flex items-center justify-center ${
              stats.overdue_books > 0 ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-800 text-slate-500'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-lg px-3 py-2 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Students</div>
            <div className="text-lg font-black text-purple-400">{stats.total_students}</div>
          </div>
          <div className="w-8 h-8 rounded-md bg-purple-500/10 text-purple-400 flex items-center justify-center">
            <GraduationCap className="w-4 h-4" />
          </div>
        </div>
      </div>
    </div>
  );
};
