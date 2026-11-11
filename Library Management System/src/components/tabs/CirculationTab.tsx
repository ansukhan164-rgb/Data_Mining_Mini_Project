import React, { useState } from 'react';
import { useLibrary } from '../../context/LibraryContext';
import { ArrowRightLeft, Undo2, Calendar, Clock, AlertTriangle, CheckCircle2, DollarSign } from 'lucide-react';

export const CirculationTab: React.FC = () => {
  const { books, students, activeLoans, issueBook, returnBook } = useLibrary();

  // Issue Form state
  const [selectedBookId, setSelectedBookId] = useState<number>(() => {
    const avail = books.find((b) => b.copies_available > 0);
    return avail ? avail.id : books[0]?.id || 1;
  });
  const [selectedStudentId, setSelectedStudentId] = useState<number>(() => {
    return students[0]?.id || 1;
  });
  const [loanDays, setLoanDays] = useState<number>(14);
  const [notes, setNotes] = useState('');
  const [issueNotice, setIssueNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Return Desk state
  const [selectedTxId, setSelectedTxId] = useState<number | null>(null);
  const [returnNotice, setReturnNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const availableBooks = books.filter((b) => b.copies_available > 0);

  const handleIssueSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookId || !selectedStudentId) {
      setIssueNotice({ type: 'error', text: 'Please select both an available book and a student.' });
      return;
    }

    const res = issueBook(selectedBookId, selectedStudentId, loanDays, notes);
    if (res.success) {
      setIssueNotice({ type: 'success', text: res.message });
      setNotes('');
    } else {
      setIssueNotice({ type: 'error', text: res.message });
    }
  };

  const handleProcessReturn = (txId: number) => {
    const res = returnBook(txId);
    if (res.success) {
      setReturnNotice({ type: 'success', text: res.message });
      if (selectedTxId === txId) setSelectedTxId(null);
    } else {
      setReturnNotice({ type: 'error', text: res.message });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* ----------------- LEFT PANE: ISSUE BOOK (5 Cols) ----------------- */}
      <div className="lg:col-span-5 bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
            <ArrowRightLeft className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Issue Book to Student</h3>
            <p className="text-[11px] text-slate-500">Check out a physical copy with auto inventory update</p>
          </div>
        </div>

        {issueNotice && (
          <div
            className={`p-3 rounded-lg text-xs font-semibold flex items-center gap-2 ${
              issueNotice.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            {issueNotice.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{issueNotice.text}</span>
          </div>
        )}

        <form onSubmit={handleIssueSubmit} className="space-y-4 text-xs">
          {/* Select Book */}
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              1. Select Book ({availableBooks.length} titles available) *
            </label>
            {availableBooks.length === 0 ? (
              <div className="p-2.5 rounded-lg bg-rose-50 text-rose-700 text-xs font-medium border border-rose-200">
                All library books are currently checked out.
              </div>
            ) : (
              <select
                value={selectedBookId}
                onChange={(e) => setSelectedBookId(parseInt(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              >
                {availableBooks.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.title} ({b.copies_available} left) — [{b.isbn}]
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Select Student */}
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              2. Select Student Borrower *
            </label>
            {students.length === 0 ? (
              <div className="p-2.5 rounded-lg bg-amber-50 text-amber-800 text-xs font-medium border border-amber-200">
                No students in dataset. Register a student or upload a student roster to issue books.
              </div>
            ) : (
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(parseInt(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.full_name} ({s.student_id}) — {s.department}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Loan Duration */}
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              3. Loan Duration Period
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { days: 7, label: '7 Days (1 Wk)' },
                { days: 14, label: '14 Days (Std)' },
                { days: 21, label: '21 Days (3 Wk)' },
                { days: 30, label: '30 Days (Mon)' },
              ].map((opt) => (
                <button
                  key={opt.days}
                  type="button"
                  onClick={() => setLoanDays(opt.days)}
                  className={`py-2 px-1 text-center rounded-lg border font-bold text-[11px] transition-colors cursor-pointer ${
                    loanDays === opt.days
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Circulation Notes */}
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              4. Circulation Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Research thesis, exam prep, course reference"
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={availableBooks.length === 0}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white font-bold rounded-lg shadow transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>Confirm & Issue Book</span>
          </button>
        </form>
      </div>

      {/* ----------------- RIGHT PANE: ACTIVE LOANS & RETURN DESK (7 Cols) ----------------- */}
      <div className="lg:col-span-7 bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <Undo2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Return Book Desk</h3>
              <p className="text-[11px] text-slate-500">
                Active loans, automated overdue calculation & fine settlement ($0.50/day)
              </p>
            </div>
          </div>

          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 font-mono">
            {activeLoans.length} Active Loans
          </span>
        </div>

        {returnNotice && (
          <div
            className={`p-3 rounded-lg text-xs font-semibold flex items-center gap-2 ${
              returnNotice.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{returnNotice.text}</span>
          </div>
        )}

        {/* Table of active unreturned loans */}
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-bold sticky top-0 z-10">
                <tr>
                  <th className="py-2.5 px-3">Borrower</th>
                  <th className="py-2.5 px-3">Book Title</th>
                  <th className="py-2.5 px-3 text-center">Due Date</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-right">Fine</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {activeLoans.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      No active book loans at this moment.
                    </td>
                  </tr>
                ) : (
                  activeLoans.map((loan) => {
                    const isOverdue = loan.status === 'Overdue';
                    const isSelected = selectedTxId === loan.id;

                    return (
                      <tr
                        key={loan.id}
                        onClick={() => setSelectedTxId(loan.id)}
                        className={`transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50/80 ring-1 ring-blue-300'
                            : isOverdue
                            ? 'bg-rose-50/40 hover:bg-rose-50'
                            : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-900">{loan.student_name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{loan.student_code}</div>
                        </td>
                        <td className="py-2.5 px-3 max-w-[170px] truncate">
                          <div className="text-slate-800 font-medium truncate">{loan.book_title}</div>
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono text-[11px]">
                          <span className={isOverdue ? 'text-rose-600 font-bold' : 'text-slate-600'}>
                            {loan.due_date}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                              isOverdue
                                ? 'bg-rose-100 text-rose-700 border border-rose-200'
                                : 'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}
                          >
                            {loan.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold">
                          <span className={loan.fine_amount > 0 ? 'text-rose-600' : 'text-slate-400'}>
                            ${loan.fine_amount.toFixed(2)}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleProcessReturn(loan.id);
                            }}
                            className={`px-3 py-1 text-[11px] font-bold rounded shadow-xs transition-colors cursor-pointer ${
                              isOverdue
                                ? 'bg-rose-600 hover:bg-rose-700 text-white'
                                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            }`}
                          >
                            Return
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
          <span>Click on any row to highlight details • Fine rate: $0.50/day overdue</span>
          <span>Automatic stock replenishment upon return</span>
        </div>
      </div>
    </div>
  );
};
