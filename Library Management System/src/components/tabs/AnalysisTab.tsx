import React, { useMemo } from 'react';
import { useLibrary } from '../../context/LibraryContext';
import { generateAnalysis } from '../../utils/predictionEngine';
import {
  BarChart3,
  Layers,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Upload,
  ArrowRightLeft,
  GraduationCap,
  TrendingUp,
  FileSpreadsheet,
} from 'lucide-react';

interface AnalysisTabProps {
  onOpenUpload: () => void;
}

export const AnalysisTab: React.FC<AnalysisTabProps> = ({ onOpenUpload }) => {
  const { books, students, transactions, datasetMeta, uploadDataset } = useLibrary();

  const analysis = useMemo(() => {
    return generateAnalysis(books, students, transactions);
  }, [books, students, transactions]);

  // Empty state if no data uploaded yet
  if (analysis.totalRecords === 0) {
    const handleLoadSample = async () => {
      try {
        const resp = await fetch('/sample_library_dataset.json');
        if (resp.ok) {
          const text = await resp.text();
          uploadDataset('sample_library_dataset.json', text);
        }
      } catch (e) {
        onOpenUpload();
      }
    };

    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-xl mx-auto shadow-sm my-6 space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-inner">
          <Upload className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">No Dataset Loaded Yet</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
          The app starts clean with zero dummy data. Upload your own library, inventory, or circulation
          spreadsheet from your device, or load the generated university sample dataset.
        </p>

        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={onOpenUpload}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>Upload File (CSV / JSON)</span>
          </button>
          <button
            onClick={handleLoadSample}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer border border-slate-700"
          >
            <span>⚡ Load Sample Dataset (50 records)</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Header Banner & Data Source Info */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">Dataset Analysis & Inventory Health</h2>
              {datasetMeta.fileName && (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                  {datasetMeta.fileName}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Descriptive statistics computed strictly from your uploaded {analysis.totalRecords} records
            </p>
          </div>
        </div>

        <button
          onClick={onOpenUpload}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Upload Another Dataset</span>
        </button>
      </div>

      {/* 2. Primary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase tracking-wider">
            <span>Catalog Size</span>
            <BookOpen className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">{analysis.catalogSize}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {analysis.totalCopies} physical copies total
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase tracking-wider">
            <span>Inventory Utilization</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-1">
            {analysis.inventoryUtilizationRate}%
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {analysis.borrowedCopies} of {analysis.totalCopies} copies in active circulation
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase tracking-wider">
            <span>Registered Students</span>
            <GraduationCap className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-purple-600 mt-1">{analysis.totalStudents}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {analysis.activeBorrowersCount} active borrowers recorded
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase tracking-wider">
            <span>Overdue Exposure</span>
            <AlertTriangle className={`w-4 h-4 ${analysis.overdueLoansCount > 0 ? 'text-rose-600' : 'text-slate-400'}`} />
          </div>
          <div className={`text-2xl font-black mt-1 ${analysis.overdueLoansCount > 0 ? 'text-rose-600' : 'text-slate-800'}`}>
            {analysis.overduePercentage}%
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {analysis.overdueLoansCount} overdue loans • ${analysis.totalAccruedFines.toFixed(2)} fines
          </div>
        </div>
      </div>

      {/* 3. Category Distribution Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Category Breakdown Table (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>Category & Genre Breakdown</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-medium">
              {analysis.categoryBreakdown.length} unique categories
            </span>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Discipline</th>
                  <th className="py-2.5 px-3 text-center">Titles</th>
                  <th className="py-2.5 px-3 text-center">Total Copies</th>
                  <th className="py-2.5 px-3 text-center">Available</th>
                  <th className="py-2.5 px-3 text-right">Circulation Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {analysis.categoryBreakdown.map((cat) => (
                  <tr key={cat.category} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-bold text-slate-900">{cat.category}</td>
                    <td className="py-2.5 px-3 text-center text-slate-600">{cat.titlesCount}</td>
                    <td className="py-2.5 px-3 text-center font-bold text-slate-800">{cat.totalCopies}</td>
                    <td className="py-2.5 px-3 text-center text-emerald-600 font-bold">
                      {cat.availableCopies}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-blue-600 h-1.5 rounded-full"
                            style={{ width: `${cat.utilizationRate}%` }}
                          />
                        </div>
                        <span className="font-mono text-[11px] font-bold text-slate-800 w-8 text-right">
                          {cat.utilizationRate}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Departmental Reach & Circulation Velocity (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Department breakdown */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-purple-600" />
              <span>Departmental Borrowing Distribution</span>
            </h3>

            {analysis.departmentBreakdown.length === 0 ? (
              <p className="text-slate-400 text-xs py-4 text-center">
                No student or department records found in dataset.
              </p>
            ) : (
              <div className="space-y-2.5">
                {analysis.departmentBreakdown.slice(0, 5).map((dept) => (
                  <div key={dept.department} className="space-y-1 text-xs">
                    <div className="flex justify-between font-semibold">
                      <span className="text-slate-800">{dept.department}</span>
                      <span className="text-slate-500 font-mono text-[11px]">
                        {dept.activeLoansCount} active loans ({dept.studentsCount} students)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-purple-600 h-1.5 rounded-full"
                        style={{
                          width: `${Math.min(100, (dept.activeLoansCount / (analysis.activeLoansCount || 1)) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top Borrowed Titles */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>Highest Velocity Titles</span>
            </h3>

            {analysis.topBorrowedBooks.length === 0 ? (
              <p className="text-slate-400 text-xs py-4 text-center">No book titles in dataset.</p>
            ) : (
              <div className="space-y-2">
                {analysis.topBorrowedBooks.map((book, i) => (
                  <div
                    key={book.title}
                    className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="font-bold text-slate-900 truncate">
                        {i + 1}. {book.title}
                      </div>
                      <div className="text-[10px] text-slate-500">{book.author}</div>
                    </div>
                    <span className="shrink-0 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 font-mono">
                      {book.currentAvailable} left
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
