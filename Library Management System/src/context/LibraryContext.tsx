import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { Book, Student, Transaction, KPIStats, DatasetMetadata } from '../types/library';
import { INITIAL_BOOKS, INITIAL_STUDENTS, INITIAL_TRANSACTIONS } from '../data/initialData';
import { parseUploadedContent } from '../utils/datasetParser';

interface LibraryContextType {
  books: Book[];
  students: Student[];
  transactions: Transaction[];
  stats: KPIStats;
  datasetMeta: DatasetMetadata;
  uploadDataset: (fileName: string, content: string) => { success: boolean; message: string; count: number };
  clearDataset: () => void;
  addBook: (book: Omit<Book, 'id' | 'copies_available' | 'added_date'>) => { success: boolean; message: string };
  updateBook: (id: number, book: Partial<Book>) => { success: boolean; message: string };
  deleteBook: (id: number) => { success: boolean; message: string };
  addStudent: (student: Omit<Student, 'id' | 'status' | 'created_at'>) => { success: boolean; message: string };
  updateStudent: (id: number, student: Partial<Student>) => { success: boolean; message: string };
  deleteStudent: (id: number) => { success: boolean; message: string };
  issueBook: (bookId: number, studentId: number, loanDays: number, notes?: string) => { success: boolean; message: string };
  returnBook: (transactionId: number) => { success: boolean; message: string; fine: number };
  activeLoans: Transaction[];
  enrichedTransactions: Transaction[];
}

const LibraryContext = createContext<LibraryContextType | undefined>(undefined);

const STORAGE_KEYS = {
  BOOKS: 'athenaeum_clean_books_v2',
  STUDENTS: 'athenaeum_clean_students_v2',
  TXS: 'athenaeum_clean_txs_v2',
  META: 'athenaeum_clean_meta_v2',
};

export const LibraryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // 1. Books State - empty by default unless saved
  const [books, setBooks] = useState<Book[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.BOOKS);
      return saved ? JSON.parse(saved) : INITIAL_BOOKS;
    } catch {
      return INITIAL_BOOKS;
    }
  });

  // 2. Students State - empty by default unless saved
  const [students, setStudents] = useState<Student[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.STUDENTS);
      return saved ? JSON.parse(saved) : INITIAL_STUDENTS;
    } catch {
      return INITIAL_STUDENTS;
    }
  });

  // 3. Transactions State - empty by default unless saved
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TXS);
      return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
    } catch {
      return INITIAL_TRANSACTIONS;
    }
  });

  // 4. Dataset Metadata
  const [datasetMeta, setDatasetMeta] = useState<DatasetMetadata>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.META);
      return saved
        ? JSON.parse(saved)
        : {
            fileName: null,
            uploadedAt: null,
            totalRecordsLoaded: 0,
            sourceType: 'empty',
          };
    } catch {
      return {
        fileName: null,
        uploadedAt: null,
        totalRecordsLoaded: 0,
        sourceType: 'empty',
      };
    }
  });

  // Sync with LocalStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BOOKS, JSON.stringify(books));
  }, [books]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TXS, JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.META, JSON.stringify(datasetMeta));
  }, [datasetMeta]);

  // Recalculate overdue loans from today's date
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    let changed = false;

    const updated = transactions.map((t) => {
      if (t.status === 'Issued' && t.due_date < today) {
        const dueDate = new Date(t.due_date);
        const currDate = new Date();
        const diffDays = Math.max(0, Math.floor((currDate.getTime() - dueDate.getTime()) / (1000 * 3600 * 24)));
        const fine = Math.round(diffDays * 0.5 * 100) / 100;
        changed = true;
        return {
          ...t,
          status: 'Overdue' as const,
          fine_amount: fine,
        };
      }
      return t;
    });

    if (changed) {
      setTransactions(updated);
    }
  }, []);

  // Enriched Transactions with Book & Student metadata
  const enrichedTransactions = useMemo(() => {
    const bookMap = new Map<number, Book>(books.map((b) => [b.id, b]));
    const studentMap = new Map<number, Student>(students.map((s) => [s.id, s]));

    return transactions.map((tx) => {
      const b = bookMap.get(tx.book_id);
      const s = studentMap.get(tx.student_id);
      return {
        ...tx,
        book_title: b?.title || tx.book_title || 'Unknown Title',
        book_isbn: b?.isbn || tx.book_isbn || '',
        book_category: b?.category || tx.book_category || '',
        student_name: s?.full_name || tx.student_name || 'Borrower',
        student_code: s?.student_id || tx.student_code || '',
        student_department: s?.department || tx.student_department || '',
      };
    });
  }, [transactions, books, students]);

  // Active unreturned loans
  const activeLoans = useMemo(() => {
    return enrichedTransactions.filter((tx) => tx.status === 'Issued' || tx.status === 'Overdue');
  }, [enrichedTransactions]);

  // Computed KPI Stats strictly from uploaded data
  const stats: KPIStats = useMemo(() => {
    const totalTitles = books.length;
    const totalCopies = books.reduce((sum, b) => sum + b.copies_total, 0);
    const availableCopies = books.reduce((sum, b) => sum + b.copies_available, 0);
    const issuedBooks = activeLoans.length;
    const overdueBooks = activeLoans.filter((tx) => tx.status === 'Overdue').length;
    const totalStudents = students.filter((s) => s.status === 'Active').length;

    return {
      total_titles: totalTitles,
      total_copies: totalCopies,
      available_copies: availableCopies,
      issued_books: issuedBooks,
      overdue_books: overdueBooks,
      total_students: totalStudents,
    };
  }, [books, students, activeLoans]);

  // Upload Local Dataset (CSV / JSON)
  const uploadDataset = (fileName: string, content: string) => {
    const parsed = parseUploadedContent(fileName, content);

    if (parsed.rowCount === 0) {
      return { success: false, message: 'No valid data rows found in uploaded file.', count: 0 };
    }

    if (parsed.detectedType === 'books') {
      setBooks(parsed.books);
    } else if (parsed.detectedType === 'students') {
      setStudents(parsed.students);
    } else if (parsed.detectedType === 'circulation') {
      setTransactions(parsed.transactions);
    } else {
      // Unified or JSON
      if (parsed.books.length > 0) setBooks(parsed.books);
      if (parsed.students.length > 0) setStudents(parsed.students);
      if (parsed.transactions.length > 0) setTransactions(parsed.transactions);
    }

    const totalLoaded = parsed.rowCount;
    const newMeta: DatasetMetadata = {
      fileName,
      uploadedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      totalRecordsLoaded: totalLoaded,
      sourceType: fileName.endsWith('.json') ? 'json' : 'csv',
    };
    setDatasetMeta(newMeta);

    return {
      success: true,
      message: `Successfully loaded ${totalLoaded} records from "${fileName}".`,
      count: totalLoaded,
    };
  };

  // Clear Dataset
  const clearDataset = () => {
    setBooks([]);
    setStudents([]);
    setTransactions([]);
    setDatasetMeta({
      fileName: null,
      uploadedAt: null,
      totalRecordsLoaded: 0,
      sourceType: 'empty',
    });
    localStorage.removeItem(STORAGE_KEYS.BOOKS);
    localStorage.removeItem(STORAGE_KEYS.STUDENTS);
    localStorage.removeItem(STORAGE_KEYS.TXS);
    localStorage.removeItem(STORAGE_KEYS.META);
  };

  // CRUD for Books
  const addBook = (bookData: Omit<Book, 'id' | 'copies_available' | 'added_date'>) => {
    if (books.some((b) => b.isbn.trim().toLowerCase() === bookData.isbn.trim().toLowerCase())) {
      return { success: false, message: `A book with ISBN '${bookData.isbn}' already exists.` };
    }

    const newId = books.length > 0 ? Math.max(...books.map((b) => b.id)) + 1 : 1;
    const newBook: Book = {
      ...bookData,
      id: newId,
      copies_available: bookData.copies_total,
      added_date: new Date().toISOString().split('T')[0],
    };

    setBooks((prev) => [newBook, ...prev]);
    return { success: true, message: `Book '${newBook.title}' added to catalog.` };
  };

  const updateBook = (id: number, data: Partial<Book>) => {
    const current = books.find((b) => b.id === id);
    if (!current) return { success: false, message: 'Book not found.' };

    if (data.isbn && books.some((b) => b.id !== id && b.isbn.trim() === data.isbn?.trim())) {
      return { success: false, message: `Another book already uses ISBN '${data.isbn}'.` };
    }

    let newAvail = current.copies_available;
    if (data.copies_total !== undefined) {
      const activeBorrowed = current.copies_total - current.copies_available;
      if (data.copies_total < activeBorrowed) {
        return {
          success: false,
          message: `Cannot lower total copies to ${data.copies_total} because ${activeBorrowed} copies are currently checked out.`,
        };
      }
      newAvail = data.copies_total - activeBorrowed;
    }

    setBooks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...data, copies_available: newAvail } : b))
    );
    return { success: true, message: 'Book record updated.' };
  };

  const deleteBook = (id: number) => {
    const active = transactions.some(
      (t) => t.book_id === id && (t.status === 'Issued' || t.status === 'Overdue')
    );
    if (active) {
      return { success: false, message: 'Cannot delete book while physical copies are currently checked out.' };
    }

    setBooks((prev) => prev.filter((b) => b.id !== id));
    setTransactions((prev) => prev.filter((t) => t.book_id !== id));
    return { success: true, message: 'Book removed from catalog.' };
  };

  // CRUD for Students
  const addStudent = (stuData: Omit<Student, 'id' | 'status' | 'created_at'>) => {
    if (students.some((s) => s.student_id.trim().toLowerCase() === stuData.student_id.trim().toLowerCase())) {
      return { success: false, message: `Student ID '${stuData.student_id}' is already registered.` };
    }

    const newId = students.length > 0 ? Math.max(...students.map((s) => s.id)) + 1 : 1;
    const newStudent: Student = {
      ...stuData,
      id: newId,
      status: 'Active',
      created_at: new Date().toISOString(),
    };

    setStudents((prev) => [newStudent, ...prev]);
    return { success: true, message: `Student '${newStudent.full_name}' registered successfully.` };
  };

  const updateStudent = (id: number, data: Partial<Student>) => {
    if (data.student_id && students.some((s) => s.id !== id && s.student_id === data.student_id)) {
      return { success: false, message: `Student ID '${data.student_id}' is assigned to another student.` };
    }

    setStudents((prev) => prev.map((s) => (s.id === id ? { ...s, ...data } : s)));
    return { success: true, message: 'Student record updated.' };
  };

  const deleteStudent = (id: number) => {
    const hasActive = transactions.some(
      (t) => t.student_id === id && (t.status === 'Issued' || t.status === 'Overdue')
    );
    if (hasActive) {
      return { success: false, message: 'Cannot remove student with unreturned library books.' };
    }

    setStudents((prev) => prev.filter((s) => s.id !== id));
    setTransactions((prev) => prev.filter((t) => t.student_id !== id));
    return { success: true, message: 'Student removed from directory.' };
  };

  // Issue Book
  const issueBook = (bookId: number, studentId: number, loanDays: number = 14, notes?: string) => {
    const book = books.find((b) => b.id === bookId);
    const student = students.find((s) => s.id === studentId);

    if (!book) return { success: false, message: 'Book not found in dataset.' };
    if (!student) return { success: false, message: 'Student not found in dataset.' };
    if (book.copies_available <= 0) {
      return { success: false, message: `All copies of '${book.title}' are currently checked out.` };
    }

    const today = new Date();
    const issueDateStr = today.toISOString().split('T')[0];
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + loanDays);
    const dueDateStr = dueDate.toISOString().split('T')[0];

    const newTxId = transactions.length > 0 ? Math.max(...transactions.map((t) => t.id)) + 1 : 1;
    const newTx: Transaction = {
      id: newTxId,
      book_id: bookId,
      student_id: studentId,
      issue_date: issueDateStr,
      due_date: dueDateStr,
      return_date: null,
      status: 'Issued',
      fine_amount: 0,
      notes: notes || '',
    };

    setBooks((prev) =>
      prev.map((b) => (b.id === bookId ? { ...b, copies_available: b.copies_available - 1 } : b))
    );
    setTransactions((prev) => [newTx, ...prev]);

    return {
      success: true,
      message: `'${book.title}' issued to ${student.full_name}. Due on ${dueDateStr}.`,
    };
  };

  // Return Book
  const returnBook = (transactionId: number) => {
    const tx = transactions.find((t) => t.id === transactionId);
    if (!tx) return { success: false, message: 'Transaction record not found.', fine: 0 };
    if (tx.status === 'Returned') {
      return { success: false, message: 'This book has already been returned.', fine: 0 };
    }

    const today = new Date();
    const returnDateStr = today.toISOString().split('T')[0];
    const dueDate = new Date(tx.due_date);
    const diffDays = Math.max(0, Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 3600 * 24)));
    const fine = Math.round(diffDays * 0.5 * 100) / 100;

    setBooks((prev) =>
      prev.map((b) => (b.id === tx.book_id ? { ...b, copies_available: b.copies_available + 1 } : b))
    );

    setTransactions((prev) =>
      prev.map((t) =>
        t.id === transactionId
          ? {
              ...t,
              status: 'Returned',
              return_date: returnDateStr,
              fine_amount: fine,
            }
          : t
      )
    );

    const b = books.find((x) => x.id === tx.book_id);
    const s = students.find((x) => x.id === tx.student_id);
    let msg = `'${b?.title || 'Book'}' returned by ${s?.full_name || 'student'}.`;
    if (fine > 0) {
      msg += ` Assessed overdue fine: $${fine.toFixed(2)} (${diffDays} days late).`;
    }

    return { success: true, message: msg, fine };
  };

  return (
    <LibraryContext.Provider
      value={{
        books,
        students,
        transactions,
        stats,
        datasetMeta,
        uploadDataset,
        clearDataset,
        addBook,
        updateBook,
        deleteBook,
        addStudent,
        updateStudent,
        deleteStudent,
        issueBook,
        returnBook,
        activeLoans,
        enrichedTransactions,
      }}
    >
      {children}
    </LibraryContext.Provider>
  );
};

export const useLibrary = () => {
  const context = useContext(LibraryContext);
  if (!context) {
    throw new Error('useLibrary must be used within a LibraryProvider');
  }
  return context;
};
