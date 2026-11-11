import { Book, Student, Transaction } from '../types/library';

// Robust CSV parser handling quotes, commas, and multiline text
export function parseCSV(csvText: string): Array<Record<string, string>> {
  const lines: string[] = [];
  let currentLine = '';
  let insideQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentLine += '"';
        i++; // skip escaped quote
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if ((char === '\r' && nextChar === '\n') || char === '\n' || char === '\r') {
      if (insideQuotes) {
        currentLine += '\n';
      } else {
        if (currentLine.trim()) lines.push(currentLine);
        currentLine = '';
        if (char === '\r' && nextChar === '\n') i++;
      }
    } else {
      currentLine += char;
    }
  }
  if (currentLine.trim()) lines.push(currentLine);

  if (lines.length < 2) return [];

  // Parse header
  const headers = splitCSVRow(lines[0]).map((h) => h.toLowerCase().trim().replace(/[^a-z0-9_]/g, '_'));

  const rows: Array<Record<string, string>> = [];
  for (let i = 1; i < lines.length; i++) {
    const values = splitCSVRow(lines[i]);
    if (values.length === 0 || (values.length === 1 && !values[0])) continue;

    const rowObj: Record<string, string> = {};
    headers.forEach((header, idx) => {
      rowObj[header] = values[idx]?.trim() || '';
    });
    rows.push(rowObj);
  }

  return rows;
}

function splitCSVRow(rowText: string): string[] {
  const result: string[] = [];
  let currentVal = '';
  let inQuotes = false;

  for (let i = 0; i < rowText.length; i++) {
    const char = rowText[i];
    const nextChar = rowText[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentVal += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(currentVal.trim());
      currentVal = '';
    } else {
      currentVal += char;
    }
  }
  result.push(currentVal.trim());
  return result;
}

// Random aesthetic book cover color palette
const COVER_PALETTE = ['#2563eb', '#0284c7', '#059669', '#d97706', '#dc2626', '#7c3aed', '#475569', '#0891b2'];

export interface ParsedDatasetResult {
  books: Book[];
  students: Student[];
  transactions: Transaction[];
  detectedType: 'books' | 'students' | 'circulation' | 'unified' | 'json';
  rowCount: number;
}

export function parseUploadedContent(fileName: string, content: string): ParsedDatasetResult {
  // Check if JSON
  if (fileName.toLowerCase().endsWith('.json') || content.trim().startsWith('{') || content.trim().startsWith('[')) {
    try {
      const parsed = JSON.parse(content);
      return parseJSONContent(parsed);
    } catch (err) {
      // Fallback to CSV if json parse failed
    }
  }

  // Parse CSV
  const rows = parseCSV(content);
  if (rows.length === 0) {
    return { books: [], students: [], transactions: [], detectedType: 'books', rowCount: 0 };
  }

  const firstRowKeys = Object.keys(rows[0]);

  // Check if Unified dataset (contains 'type' column with 'book' / 'student' / 'loan')
  if (firstRowKeys.includes('type')) {
    const books: Book[] = [];
    const students: Student[] = [];
    const transactions: Transaction[] = [];

    rows.forEach((r, idx) => {
      const type = (r.type || '').toLowerCase();
      if (type.includes('book')) {
        books.push({
          id: idx + 1,
          isbn: r.isbn || r.id_code || `ISBN-${1000 + idx}`,
          title: r.title || r.title_or_name || `Untitled Book ${idx + 1}`,
          author: r.author || r.author_or_dept || 'Unknown Author',
          category: r.category || r.category_or_email || 'General',
          publication_year: parseInt(r.year || r.publication_year) || 2024,
          copies_total: parseInt(r.copies_total || r.copies || '1') || 1,
          copies_available: parseInt(r.copies_available || r.copies_total || '1') || 1,
          shelf_location: r.shelf_location || r.shelf_or_phone || 'Shelf 1',
          cover_color: COVER_PALETTE[idx % COVER_PALETTE.length],
          added_date: new Date().toISOString().split('T')[0],
        });
      } else if (type.includes('student') || type.includes('user') || type.includes('borrower')) {
        students.push({
          id: idx + 1,
          student_id: r.student_id || r.id_code || `STU-${1000 + idx}`,
          full_name: r.full_name || r.name || r.title_or_name || 'Anonymous Student',
          email: r.email || r.category_or_email || 'student@university.edu',
          phone: r.phone || r.shelf_or_phone || '',
          department: r.department || r.author_or_dept || 'General Studies',
          enrolled_year: parseInt(r.enrolled_year || r.year) || 2024,
          status: 'Active',
        });
      }
    });

    return { books, students, transactions, detectedType: 'unified', rowCount: rows.length };
  }

  // Check if Student dataset (has student_id or email & department)
  const isStudentDataset = firstRowKeys.some((k) => k.includes('student') || k.includes('enrolled')) ||
    (firstRowKeys.includes('department') && firstRowKeys.some((k) => k.includes('name')));

  if (isStudentDataset) {
    const students: Student[] = rows.map((r, idx) => ({
      id: idx + 1,
      student_id: r.student_id || r.id || r.student_code || `STU-2024-${String(idx + 1).padStart(3, '0')}`,
      full_name: r.full_name || r.name || r.student_name || `Student ${idx + 1}`,
      email: r.email || r.email_address || `student${idx + 1}@campus.edu`,
      phone: r.phone || r.phone_number || r.contact || '',
      department: r.department || r.major || r.program || 'General Academic',
      enrolled_year: parseInt(r.enrolled_year || r.year || r.batch) || 2024,
      status: 'Active',
      created_at: new Date().toISOString(),
    }));

    return { books: [], students, transactions: [], detectedType: 'students', rowCount: rows.length };
  }

  // Check if Circulation / Transactions dataset
  const isCirculationDataset = firstRowKeys.some((k) => k.includes('issue') || k.includes('due') || k.includes('return_date') || k.includes('loan'));
  if (isCirculationDataset) {
    const transactions: Transaction[] = rows.map((r, idx) => ({
      id: idx + 1,
      book_id: parseInt(r.book_id) || 1,
      student_id: parseInt(r.student_id) || 1,
      issue_date: r.issue_date || new Date().toISOString().split('T')[0],
      due_date: r.due_date || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      return_date: r.return_date || null,
      status: (r.status as any) || (r.return_date ? 'Returned' : 'Issued'),
      fine_amount: parseFloat(r.fine_amount || r.fine || '0') || 0,
      notes: r.notes || r.reason || '',
      book_title: r.book_title || r.title,
      student_name: r.student_name || r.name,
      student_code: r.student_code || r.student_id,
    }));

    return { books: [], students: [], transactions, detectedType: 'circulation', rowCount: rows.length };
  }

  // Default: Treat as Books dataset
  const books: Book[] = rows.map((r, idx) => {
    // Find title column
    const title = r.title || r.book_title || r.name || r.item || `Item ${idx + 1}`;
    const author = r.author || r.authors || r.writer || r.creator || 'Unknown Author';
    const isbn = r.isbn || r.code || r.isbn_code || r.id || `978-0${Math.floor(100000000 + idx)}`;
    const category = r.category || r.genre || r.subject || r.classification || 'General';
    const year = parseInt(r.publication_year || r.year || r.published) || 2024;
    const copiesTotal = Math.max(1, parseInt(r.copies_total || r.total_copies || r.copies || r.stock || r.quantity || '1') || 1);
    const copiesAvail = r.copies_available !== undefined
      ? Math.min(copiesTotal, Math.max(0, parseInt(r.copies_available) || copiesTotal))
      : copiesTotal;
    const shelf = r.shelf_location || r.shelf || r.location || `Shelf ${Math.floor(idx / 5) + 1}`;

    return {
      id: idx + 1,
      isbn,
      title,
      author,
      category,
      publication_year: year,
      copies_total: copiesTotal,
      copies_available: copiesAvail,
      shelf_location: shelf,
      cover_color: COVER_PALETTE[idx % COVER_PALETTE.length],
      added_date: r.added_date || new Date().toISOString().split('T')[0],
    };
  });

  return { books, students: [], transactions: [], detectedType: 'books', rowCount: rows.length };
}

function parseJSONContent(data: any): ParsedDatasetResult {
  if (Array.isArray(data)) {
    // Array of objects
    return parseUploadedContent('data.csv', convertArrayToCSV(data));
  }

  if (typeof data === 'object' && data !== null) {
    const books: Book[] = Array.isArray(data.books) ? data.books : [];
    const students: Student[] = Array.isArray(data.students) ? data.students : [];
    const transactions: Transaction[] = Array.isArray(data.transactions) ? data.transactions : [];

    return {
      books,
      students,
      transactions,
      detectedType: 'json',
      rowCount: books.length + students.length + transactions.length,
    };
  }

  return { books: [], students: [], transactions: [], detectedType: 'json', rowCount: 0 };
}

function convertArrayToCSV(arr: Array<Record<string, any>>): string {
  if (arr.length === 0) return '';
  const headers = Object.keys(arr[0]);
  const rows = arr.map((item) =>
    headers.map((h) => `"${String(item[h] ?? '').replace(/"/g, '""')}"`).join(',')
  );
  return [headers.join(','), ...rows].join('\n');
}
