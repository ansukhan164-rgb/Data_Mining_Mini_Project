import React, { useState } from 'react';
import { useLibrary } from '../../context/LibraryContext';
import { X, Database, Play, CheckCircle2, Table, Code } from 'lucide-react';

interface SqlInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SqlInspectorModal: React.FC<SqlInspectorModalProps> = ({ isOpen, onClose }) => {
  const { books, students, activeLoans, enrichedTransactions } = useLibrary();

  const [activeTab, setActiveTab] = useState<'queries' | 'schema'>('queries');
  const [selectedQueryIndex, setSelectedQueryIndex] = useState(0);

  if (!isOpen) return null;

  const sampleQueries = [
    {
      title: 'Active Overdue Loans with Computed Fines',
      sql: `SELECT t.id, s.full_name AS student, b.title AS book, t.due_date, t.fine_amount
FROM transactions t
JOIN students s ON t.student_id = s.id
JOIN books b ON t.book_id = b.id
WHERE t.status = 'Overdue'
ORDER BY t.due_date ASC;`,
      results: activeLoans
        .filter((l) => l.status === 'Overdue')
        .map((l) => ({
          'tx_id': l.id,
          'student': l.student_name,
          'book': l.book_title,
          'due_date': l.due_date,
          'fine_amount': `$${l.fine_amount.toFixed(2)}`,
        })),
    },
    {
      title: 'Available Books in Stock by Category',
      sql: `SELECT isbn, title, author, category, copies_available, shelf_location
FROM books
WHERE copies_available > 0
ORDER BY category, title;`,
      results: books
        .filter((b) => b.copies_available > 0)
        .slice(0, 8)
        .map((b) => ({
          'isbn': b.isbn,
          'title': b.title,
          'author': b.author,
          'category': b.category,
          'available': b.copies_available,
          'shelf': b.shelf_location,
        })),
    },
    {
      title: 'Student Borrowing Summary',
      sql: `SELECT s.student_id, s.full_name, s.department,
       COUNT(t.id) AS total_loans,
       SUM(CASE WHEN t.status IN ('Issued', 'Overdue') THEN 1 ELSE 0 END) AS active_loans
FROM students s
LEFT JOIN transactions t ON s.id = t.student_id
GROUP BY s.id
ORDER BY active_loans DESC;`,
      results: students.map((s) => {
        const studentTxs = enrichedTransactions.filter((tx) => tx.student_id === s.id);
        const active = studentTxs.filter((tx) => tx.status === 'Issued' || tx.status === 'Overdue').length;
        return {
          'student_id': s.student_id,
          'full_name': s.full_name,
          'department': s.department,
          'total_loans': studentTxs.length,
          'active_loans': active,
        };
      }),
    },
  ];

  const schemaSql = `-- 1. Users
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'Librarian',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Books Catalog
CREATE TABLE IF NOT EXISTS books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    isbn TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    category TEXT NOT NULL,
    publication_year INTEGER,
    copies_total INTEGER NOT NULL DEFAULT 1,
    copies_available INTEGER NOT NULL DEFAULT 1,
    shelf_location TEXT,
    cover_color TEXT DEFAULT '#2563eb',
    added_date DATE DEFAULT (DATE('now'))
);

-- 3. Students Directory
CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    department TEXT NOT NULL,
    enrolled_year INTEGER,
    status TEXT DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Transactions (Issue & Return Desk)
CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    book_id INTEGER NOT NULL,
    student_id INTEGER NOT NULL,
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    return_date DATE,
    status TEXT NOT NULL DEFAULT 'Issued', -- 'Issued', 'Returned', 'Overdue'
    fine_amount REAL DEFAULT 0.0,
    notes TEXT,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE RESTRICT,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE RESTRICT
);`;

  const activeQuery = sampleQueries[selectedQueryIndex];
  const resultCols = activeQuery.results.length > 0 ? Object.keys(activeQuery.results[0]) : [];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl h-[82vh] flex flex-col overflow-hidden text-slate-900">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">SQLite Relational Database Inspector</h3>
              <p className="text-[11px] text-slate-400">Underlying SQL tables and live queries in Python app</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex rounded-lg bg-slate-800 p-1 text-xs">
              <button
                onClick={() => setActiveTab('queries')}
                className={`px-3 py-1 rounded-md font-bold transition-colors cursor-pointer ${
                  activeTab === 'queries' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Sample Queries
              </button>
              <button
                onClick={() => setActiveTab('schema')}
                className={`px-3 py-1 rounded-md font-bold transition-colors cursor-pointer ${
                  activeTab === 'schema' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                DDL Schema
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        {activeTab === 'queries' ? (
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Query Selector Sidebar */}
            <div className="w-full md:w-64 bg-slate-50 border-r border-slate-200 p-4 space-y-2 shrink-0">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Pre-configured SQL Queries
              </div>
              {sampleQueries.map((q, idx) => (
                <button
                  key={q.title}
                  onClick={() => setSelectedQueryIndex(idx)}
                  className={`w-full text-left p-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    selectedQueryIndex === idx
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                  }`}
                >
                  {q.title}
                </button>
              ))}
            </div>

            {/* Query Preview & Results */}
            <div className="flex-1 flex flex-col overflow-hidden p-6 space-y-4">
              {/* SQL box */}
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
                  <Code className="w-3.5 h-3.5" />
                  <span>SQL Statement</span>
                </div>
                <div className="p-3 bg-slate-900 rounded-lg text-emerald-400 font-mono text-xs overflow-x-auto shadow-inner">
                  <pre>{activeQuery.sql}</pre>
                </div>
              </div>

              {/* Live Results Table */}
              <div className="flex-1 flex flex-col min-h-0">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center justify-between">
                  <span>Query Results ({activeQuery.results.length} rows)</span>
                  <span className="text-emerald-600 font-semibold">● Executed against current state</span>
                </div>

                <div className="flex-1 border border-slate-200 rounded-lg overflow-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold sticky top-0">
                      <tr>
                        {resultCols.map((col) => (
                          <th key={col} className="py-2 px-3 uppercase text-[10px]">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {activeQuery.results.map((row, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          {resultCols.map((col) => (
                            <td key={col} className="py-2 px-3 text-[11px]">
                              {(row as any)[col]}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 p-6 overflow-auto font-mono text-xs bg-slate-950 text-slate-300">
            <pre className="whitespace-pre-wrap">{schemaSql}</pre>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between shrink-0">
          <span>Relational integrity enforced with foreign keys in SQLite</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
