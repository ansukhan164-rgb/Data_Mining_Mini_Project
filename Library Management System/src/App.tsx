import React, { useState } from 'react';
import { LibraryProvider, useLibrary } from './context/LibraryContext';
import { TopNav } from './components/TopNav';
import { AnalysisTab } from './components/tabs/AnalysisTab';
import { PredictionsTab } from './components/tabs/PredictionsTab';
import { BooksTab } from './components/tabs/BooksTab';
import { StudentsTab } from './components/tabs/StudentsTab';
import { CirculationTab } from './components/tabs/CirculationTab';
import { ActivityTab } from './components/tabs/ActivityTab';
import { SettingsTab } from './components/tabs/SettingsTab';
import { UploadDatasetModal } from './components/UploadDatasetModal';
import { PythonCodeModal } from './components/modals/PythonCodeModal';
import { SqlInspectorModal } from './components/modals/SqlInspectorModal';
import {
  BarChart3,
  Sparkles,
  BookOpen,
  GraduationCap,
  ArrowRightLeft,
  FileText,
  Settings,
} from 'lucide-react';

function LibraryWorkspace() {
  const { books, students, activeLoans, datasetMeta } = useLibrary();

  const [activeTab, setActiveTab] = useState<'analysis' | 'predictions' | 'books' | 'students' | 'circulation' | 'activity' | 'settings'>('analysis');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isPythonModalOpen, setIsPythonModalOpen] = useState(false);
  const [isSqlModalOpen, setIsSqlModalOpen] = useState(false);

  interface NavTab {
    id: 'analysis' | 'predictions' | 'books' | 'students' | 'circulation' | 'activity' | 'settings';
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number | string;
  }

  const tabs: NavTab[] = [
    { id: 'analysis', label: 'Analysis & Metrics', icon: BarChart3 },
    { id: 'predictions', label: 'Predictions & Forecasts', icon: Sparkles, badge: 'AI/Rules' },
    { id: 'books', label: 'Book Catalog', icon: BookOpen, badge: books.length },
    { id: 'students', label: 'Student Directory', icon: GraduationCap, badge: students.length },
    { id: 'circulation', label: 'Issue & Return Desk', icon: ArrowRightLeft, badge: activeLoans.length },
    { id: 'activity', label: 'Circulation Logs', icon: FileText },
    { id: 'settings', label: 'Export & Python Script', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-950 p-2 sm:p-4 md:p-6 flex flex-col items-center justify-start font-sans">
      {/* Main Desktop Window Frame */}
      <div className="w-full max-w-6xl rounded-2xl overflow-hidden shadow-2xl border border-slate-700/80 bg-slate-100 flex flex-col min-h-[820px]">
        {/* Window Titlebar */}
        <div className="bg-slate-950 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between select-none">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-rose-500 hover:opacity-80 cursor-pointer" />
            <div className="w-3 h-3 rounded-full bg-amber-500 hover:opacity-80 cursor-pointer" />
            <div className="w-3 h-3 rounded-full bg-emerald-500 hover:opacity-80 cursor-pointer" />
            <span className="ml-2 font-mono text-xs text-slate-300 font-semibold">
              Athenaeum Library Desktop — [Upload & Analyze Local Datasets]
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
              Dataset: {datasetMeta.fileName ? datasetMeta.fileName : 'Empty / Ready for upload'}
            </span>
          </div>
        </div>

        {/* Top Navbar & KPIs inside the window */}
        <TopNav
          onOpenUpload={() => setIsUploadModalOpen(true)}
          onOpenPythonModal={() => setIsPythonModalOpen(true)}
          onOpenSqlModal={() => setIsSqlModalOpen(true)}
        />

        {/* Tab Navigation Notebook Header */}
        <div className="bg-white border-b border-slate-200 px-6 pt-2 flex items-center justify-between gap-2 overflow-x-auto select-none">
          <div className="flex items-center space-x-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                      : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                        isActive
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="text-[11px] text-slate-400 font-medium hidden md:block">
            {datasetMeta.uploadedAt ? `Updated at ${datasetMeta.uploadedAt}` : 'No auth needed'}
          </div>
        </div>

        {/* Main Tab Content Panel */}
        <div className="flex-1 p-6 overflow-auto bg-slate-50">
          {activeTab === 'analysis' && (
            <AnalysisTab onOpenUpload={() => setIsUploadModalOpen(true)} />
          )}

          {activeTab === 'predictions' && (
            <PredictionsTab onOpenUpload={() => setIsUploadModalOpen(true)} />
          )}

          {activeTab === 'books' && <BooksTab />}

          {activeTab === 'students' && <StudentsTab />}

          {activeTab === 'circulation' && <CirculationTab />}

          {activeTab === 'activity' && <ActivityTab />}

          {activeTab === 'settings' && (
            <SettingsTab
              onOpenPythonModal={() => setIsPythonModalOpen(true)}
              onOpenSqlModal={() => setIsSqlModalOpen(true)}
            />
          )}
        </div>

        {/* Desktop Window Status Bar */}
        <div className="bg-slate-900 border-t border-slate-800 px-6 py-2 text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-3 select-none">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-slate-300 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Analysis Engine: Active (Strictly using uploaded records)
            </span>
            <span>•</span>
            <span>Books: {books.length}</span>
            <span>•</span>
            <span>Students: {students.length}</span>
            <span>•</span>
            <span>Active Loans: {activeLoans.length}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500">Run Desktop App:</span>
            <code className="text-emerald-400 font-mono font-bold bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
              python library_app.py
            </code>
          </div>
        </div>
      </div>

      {/* Modals */}
      <UploadDatasetModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
      />
      <PythonCodeModal
        isOpen={isPythonModalOpen}
        onClose={() => setIsPythonModalOpen(false)}
      />
      <SqlInspectorModal
        isOpen={isSqlModalOpen}
        onClose={() => setIsSqlModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <LibraryProvider>
      <LibraryWorkspace />
    </LibraryProvider>
  );
}
