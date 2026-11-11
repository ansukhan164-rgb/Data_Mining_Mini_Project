import { Book, Student, Transaction } from '../types/library';

// Zero dummy/sample data by default on initial launch
export const INITIAL_BOOKS: Book[] = [];
export const INITIAL_STUDENTS: Student[] = [];
export const INITIAL_TRANSACTIONS: Transaction[] = [];

// Sample templates for users to download and fill in
export const CSV_TEMPLATES = {
  books: `isbn,title,author,category,publication_year,copies_total,shelf_location
978-0132350884,Clean Code,Robert C. Martin,Computer Science,2008,3,Stack A-01
978-0451524935,1984,George Orwell,Fiction,1949,4,Fiction F-02
978-0743273565,The Great Gatsby,F. Scott Fitzgerald,Literature,1925,2,Lit L-01`,

  students: `student_id,full_name,email,phone,department,enrolled_year
STU-2024-001,Jane Doe,jane.doe@university.edu,+1 555-0101,Computer Science,2024
STU-2024-002,John Smith,john.smith@university.edu,+1 555-0102,Data Science,2024`,

  circulation: `book_id,student_id,issue_date,due_date,return_date,status,fine_amount,notes
1,1,2026-10-20,2026-11-03,2026-11-02,Returned,0.00,Returned on time
1,2,2026-11-05,2026-11-19,,Issued,0.00,Senior project`,

  unifiedDataset: `type,id_code,title_or_name,author_or_dept,category_or_email,year,copies_total,copies_available,shelf_or_phone
book,978-0132350884,Clean Code,Robert C. Martin,Computer Science,2008,4,3,Stack A-01
book,978-0451524935,1984,George Orwell,Fiction,1949,5,4,Fiction F-02
student,STU-2024-001,Alex Rivera,Computer Science,alex.rivera@campus.edu,2024,,,+1 555-0101
student,STU-2024-002,Elena Rostova,Data Science,elena.r@campus.edu,2024,,,+1 555-0102`,
};

// Available downloadable sample datasets located in /public
export const SAMPLE_FILES = [
  {
    name: 'Books Catalog Sample',
    filename: 'sample_books_catalog.csv',
    description: '20 titles across 7 categories with realistic stock levels and shelves',
    type: 'CSV',
    records: 20,
    path: '/sample_books_catalog.csv',
  },
  {
    name: 'Student Roster Sample',
    filename: 'sample_students_roster.csv',
    description: '15 students with department affiliations, contact details, and cohorts',
    type: 'CSV',
    records: 15,
    path: '/sample_students_roster.csv',
  },
  {
    name: 'Circulation & Loans Sample',
    filename: 'sample_circulation_loans.csv',
    description: '15 loan transactions with active loans, overdues, late fines & returns',
    type: 'CSV',
    records: 15,
    path: '/sample_circulation_loans.csv',
  },
  {
    name: 'Unified Catalog & Students',
    filename: 'sample_library_unified.csv',
    description: 'Combined CSV format with both catalog books and student records',
    type: 'CSV',
    records: 27,
    path: '/sample_library_unified.csv',
  },
  {
    name: 'Full University Library JSON',
    filename: 'sample_library_dataset.json',
    description: 'Complete relational dataset (20 books, 15 students, 15 loans) in one file',
    type: 'JSON',
    records: 50,
    path: '/sample_library_dataset.json',
  },
];

