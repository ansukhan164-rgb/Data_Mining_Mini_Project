import React, { useState, useMemo } from 'react';
import { useLibrary } from '../../context/LibraryContext';
import { Student } from '../../types/library';
import { Search, UserPlus, Edit2, Trash2, History, GraduationCap, X, Mail, Phone, BookOpen, AlertTriangle } from 'lucide-react';

export const StudentsTab: React.FC = () => {
  const { students, enrichedTransactions, addStudent, updateStudent, deleteStudent } = useLibrary();

  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [viewingHistoryStudent, setViewingHistoryStudent] = useState<Student | null>(null);

  // Form input state
  const [formData, setFormData] = useState({
    student_id: '',
    full_name: '',
    email: '',
    phone: '',
    department: 'Computer Science',
    enrolled_year: 2024,
  });

  // Count active loans per student
  const studentActiveLoansMap = useMemo(() => {
    const map = new Map<number, number>();
    enrichedTransactions.forEach((tx) => {
      if (tx.status === 'Issued' || tx.status === 'Overdue') {
        map.set(tx.student_id, (map.get(tx.student_id) || 0) + 1);
      }
    });
    return map;
  }, [enrichedTransactions]);

  const filteredStudents = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return students;
    return students.filter(
      (s) =>
        s.full_name.toLowerCase().includes(q) ||
        s.student_id.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.department.toLowerCase().includes(q)
    );
  }, [students, searchQuery]);

  const openAddModal = () => {
    setEditingStudent(null);
    setFormData({
      student_id: `STU-2024-${Math.floor(100 + Math.random() * 900)}`,
      full_name: '',
      email: '',
      phone: '+1 (555) 234-8900',
      department: 'Computer Science',
      enrolled_year: 2024,
    });
    setIsFormOpen(true);
  };

  const openEditModal = (s: Student) => {
    setEditingStudent(s);
    setFormData({
      student_id: s.student_id,
      full_name: s.full_name,
      email: s.email,
      phone: s.phone,
      department: s.department,
      enrolled_year: s.enrolled_year,
    });
    setIsFormOpen(true);
  };

  const handleDelete = (s: Student) => {
    if (confirm(`Are you sure you want to delete student '${s.full_name}' (${s.student_id})?`)) {
      const res = deleteStudent(s.id);
      if (!res.success) {
        alert(res.message);
      }
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.student_id.trim() || !formData.full_name.trim() || !formData.email.trim()) {
      alert('Please fill in Student ID, Full Name, and Email.');
      return;
    }

    if (editingStudent) {
      const res = updateStudent(editingStudent.id, formData);
      if (res.success) {
        setIsFormOpen(false);
      } else {
        alert(res.message);
      }
    } else {
      const res = addStudent(formData);
      if (res.success) {
        setIsFormOpen(false);
      } else {
        alert(res.message);
      }
    }
  };

  // Student specific history
  const studentHistoryList = useMemo(() => {
    if (!viewingHistoryStudent) return [];
    return enrichedTransactions.filter((tx) => tx.student_id === viewingHistoryStudent.id);
  }, [viewingHistoryStudent, enrichedTransactions]);

  const studentTotalFines = useMemo(() => {
    return studentHistoryList.reduce((sum, tx) => sum + (tx.fine_amount || 0), 0);
  }, [studentHistoryList]);

  return (
    <div className="space-y-4">
      {/* 1. Header Toolbar */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative w-full max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Student ID, Name, Email, or Department..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow transition-colors cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Register New Student</span>
        </button>
      </div>

      {/* 2. Students Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
              <tr>
                <th className="py-3 px-4 w-12 text-center">ID</th>
                <th className="py-3 px-3">Student ID</th>
                <th className="py-3 px-3">Student Name</th>
                <th className="py-3 px-3">Email Address</th>
                <th className="py-3 px-3">Phone</th>
                <th className="py-3 px-3">Department</th>
                <th className="py-3 px-3 text-center">Enrolled</th>
                <th className="py-3 px-3 text-center">Active Loans</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    {students.length === 0
                      ? 'No students registered. Upload a student roster dataset or register a student.'
                      : 'No students found matching your search.'}
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s) => {
                  const activeCount = studentActiveLoansMap.get(s.id) || 0;
                  return (
                    <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 text-center font-mono text-slate-400">{s.id}</td>
                      <td className="py-3 px-3 font-mono font-bold text-slate-800">{s.student_id}</td>
                      <td className="py-3 px-3">
                        <div
                          className="font-bold text-slate-900 hover:text-blue-600 cursor-pointer flex items-center gap-1.5"
                          onClick={() => setViewingHistoryStudent(s)}
                        >
                          <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[10px] font-bold">
                            {s.full_name.charAt(0)}
                          </div>
                          <span>{s.full_name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-500">{s.email}</td>
                      <td className="py-3 px-3 text-slate-500">{s.phone || '-'}</td>
                      <td className="py-3 px-3">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                          {s.department}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center text-slate-500">{s.enrolled_year}</td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                            activeCount > 0
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {activeCount} {activeCount === 1 ? 'book' : 'books'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setViewingHistoryStudent(s)}
                            className="p-1.5 rounded hover:bg-slate-100 text-slate-600 transition-colors"
                            title="View Borrowing History"
                          >
                            <History className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => openEditModal(s)}
                            className="p-1.5 rounded hover:bg-blue-50 text-blue-600 transition-colors"
                            title="Edit Student"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(s)}
                            className="p-1.5 rounded hover:bg-rose-50 text-rose-600 transition-colors"
                            title="Delete Student"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="bg-slate-50 border-t border-slate-200 px-4 py-2 text-[11px] text-slate-500 flex items-center justify-between">
          <span>Total registered students: {students.length}</span>
          <span>Click on student name or clock icon to view full loan activity</span>
        </div>
      </div>

      {/* 3. Add / Edit Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold">
                  {editingStudent ? 'Edit Student Profile' : 'Register New Student'}
                </h3>
                <p className="text-[11px] text-slate-400">Library borrowing privileges & contact info</p>
              </div>
              <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Student ID Code *
                </label>
                <input
                  type="text"
                  required
                  value={formData.student_id}
                  onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  placeholder="e.g. STU-2024-001"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Full name of student"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="student@campus.edu"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="+1 (555)..."
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Enrolled Year
                  </label>
                  <input
                    type="number"
                    value={formData.enrolled_year}
                    onChange={(e) => setFormData({ ...formData, enrolled_year: parseInt(e.target.value) || 2024 })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Department / Major *
                </label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Computer Science">Computer Science</option>
                  <option value="Data Science">Data Science</option>
                  <option value="Software Engineering">Software Engineering</option>
                  <option value="Mathematics">Mathematics</option>
                  <option value="Literature & Arts">Literature & Arts</option>
                  <option value="History & Philosophy">History & Philosophy</option>
                  <option value="Physics & Science">Physics & Science</option>
                  <option value="Business Administration">Business Administration</option>
                </select>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow cursor-pointer"
                >
                  {editingStudent ? 'Save Profile' : 'Register Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Student Borrowing History Modal */}
      {viewingHistoryStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-slate-900 text-white p-6 relative">
              <button
                onClick={() => setViewingHistoryStudent(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-purple-600 flex items-center justify-center font-bold text-lg text-white shadow-md">
                  {viewingHistoryStudent.full_name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white leading-tight">
                    {viewingHistoryStudent.full_name}
                  </h3>
                  <div className="flex flex-wrap gap-2 text-xs text-slate-400 mt-1">
                    <span className="font-mono text-purple-300 font-semibold">{viewingHistoryStudent.student_id}</span>
                    <span>•</span>
                    <span>{viewingHistoryStudent.department}</span>
                    <span>•</span>
                    <span>{viewingHistoryStudent.email}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Content Table */}
            <div className="p-6 space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                  Circulation History & Active Borrowed Books
                </h4>
                <div className="text-xs font-semibold text-slate-600">
                  Total Accumulated Fines:{' '}
                  <span className="font-bold text-rose-600">${studentTotalFines.toFixed(2)}</span>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Book Title</th>
                      <th className="py-2.5 px-3 text-center">Issued</th>
                      <th className="py-2.5 px-3 text-center">Due Date</th>
                      <th className="py-2.5 px-3 text-center">Returned</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                      <th className="py-2.5 px-3 text-right">Fine</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {studentHistoryList.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400">
                          This student has not borrowed any books yet.
                        </td>
                      </tr>
                    ) : (
                      studentHistoryList.map((tx) => (
                        <tr key={tx.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-bold text-slate-900">{tx.book_title}</td>
                          <td className="py-2.5 px-3 text-center text-slate-500">{tx.issue_date}</td>
                          <td className="py-2.5 px-3 text-center text-slate-500">{tx.due_date}</td>
                          <td className="py-2.5 px-3 text-center text-slate-500">{tx.return_date || '-'}</td>
                          <td className="py-2.5 px-3 text-center">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                                tx.status === 'Returned'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : tx.status === 'Overdue'
                                  ? 'bg-rose-100 text-rose-700'
                                  : 'bg-blue-100 text-blue-700'
                              }`}
                            >
                              {tx.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800">
                            ${(tx.fine_amount || 0).toFixed(2)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setViewingHistoryStudent(null)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg cursor-pointer transition-colors"
                >
                  Close Record
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
