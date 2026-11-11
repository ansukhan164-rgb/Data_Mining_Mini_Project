import React, { useState, useMemo } from 'react';
import { useLibrary } from '../../context/LibraryContext';
import { Search, Download, Filter, FileText, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

export const ActivityTab: React.FC = () => {
  const { enrichedTransactions } = useLibrary();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Issued' | 'Overdue' | 'Returned'>('All');

  const filteredLogs = useMemo(() => {
    return enrichedTransactions.filter((tx) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        tx.student_name?.toLowerCase().includes(q) ||
        tx.student_code?.toLowerCase().includes(q) ||
        tx.book_title?.toLowerCase().includes(q) ||
        tx.book_isbn?.toLowerCase().includes(q);

      const matchStatus = statusFilter === 'All' || tx.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [enrichedTransactions, searchQuery, statusFilter]);

  const handleExportCSV = () => {
    if (enrichedTransactions.length === 0) {
      alert('No activity records available to export.');
      return;
    }

    const headers = [
      'Transaction ID',
      'Student Name',
      'Student ID',
      'Department',
      'Book Title',
      'ISBN',
      'Issue Date',
      'Due Date',
      'Return Date',
      'Status',
      'Fine Amount ($)',
      'Circulation Notes',
    ];

    const rows = filteredLogs.map((tx) => [
      tx.id,
      `"${tx.student_name?.replace(/"/g, '""') || ''}"`,
      `"${tx.student_code || ''}"`,
      `"${tx.student_department || ''}"`,
      `"${tx.book_title?.replace(/"/g, '""') || ''}"`,
      `"${tx.book_isbn || ''}"`,
      tx.issue_date,
      tx.due_date,
      tx.return_date || '',
      tx.status,
      tx.fine_amount.toFixed(2),
      `"${(tx.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `library_activity_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* 1. Header & Controls */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-3">
        {/* Search */}
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative w-full max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by student, ID, book title, or ISBN..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Filters & Export */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">All Statuses</option>
              <option value="Issued">Active (Issued)</option>
              <option value="Overdue">Overdue Alerts</option>
              <option value="Returned">Returned History</option>
            </select>
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export to CSV</span>
          </button>
        </div>
      </div>

      {/* 2. Audit Trail Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
              <tr>
                <th className="py-3 px-4 w-12 text-center">Tx ID</th>
                <th className="py-3 px-3">Student Borrower</th>
                <th className="py-3 px-3">Book Title</th>
                <th className="py-3 px-3 text-center">Issue Date</th>
                <th className="py-3 px-3 text-center">Due Date</th>
                <th className="py-3 px-3 text-center">Return Date</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-right">Fine ($)</th>
                <th className="py-3 px-4">Circulation Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No activity logs match the selected filter.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((tx) => {
                  const isReturned = tx.status === 'Returned';
                  const isOverdue = tx.status === 'Overdue';

                  return (
                    <tr
                      key={tx.id}
                      className={`hover:bg-slate-50 transition-colors ${
                        isOverdue ? 'bg-rose-50/20' : ''
                      }`}
                    >
                      <td className="py-3 px-4 text-center font-mono text-slate-400">{tx.id}</td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900">{tx.student_name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {tx.student_code} • {tx.student_department}
                        </div>
                      </td>
                      <td className="py-3 px-3 max-w-[220px]">
                        <div className="font-bold text-slate-900 truncate">{tx.book_title}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{tx.book_isbn}</div>
                      </td>
                      <td className="py-3 px-3 text-center text-slate-600 font-mono">{tx.issue_date}</td>
                      <td className="py-3 px-3 text-center font-mono font-medium">
                        <span className={isOverdue ? 'text-rose-600 font-bold' : 'text-slate-600'}>
                          {tx.due_date}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-slate-500">
                        {tx.return_date || '-'}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold ${
                            isReturned
                              ? 'bg-emerald-100 text-emerald-800'
                              : isOverdue
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {tx.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold">
                        <span className={tx.fine_amount > 0 ? 'text-rose-600' : 'text-slate-400'}>
                          ${tx.fine_amount.toFixed(2)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-[11px] max-w-[180px] truncate">
                        {tx.notes || '-'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="bg-slate-50 border-t border-slate-200 px-4 py-2.5 text-[11px] text-slate-500 flex items-center justify-between">
          <span>Showing {filteredLogs.length} activity records</span>
          <span>Data persists locally in SQLite / browser storage</span>
        </div>
      </div>
    </div>
  );
};
