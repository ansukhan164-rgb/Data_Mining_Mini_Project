export interface Book {
  id: number;
  isbn: string;
  title: string;
  author: string;
  category: string;
  publication_year: number;
  copies_total: number;
  copies_available: number;
  shelf_location: string;
  cover_color: string;
  added_date: string;
}

export interface Student {
  id: number;
  student_id: string;
  full_name: string;
  email: string;
  phone: string;
  department: string;
  enrolled_year: number;
  status: 'Active' | 'Suspended';
  created_at?: string;
}

export interface Transaction {
  id: number;
  book_id: number;
  student_id: number;
  issue_date: string;
  due_date: string;
  return_date?: string | null;
  status: 'Issued' | 'Returned' | 'Overdue';
  fine_amount: number;
  notes?: string;
  // Computed / joined fields:
  book_title?: string;
  book_isbn?: string;
  book_category?: string;
  student_name?: string;
  student_code?: string;
  student_department?: string;
}

export interface KPIStats {
  total_titles: number;
  total_copies: number;
  available_copies: number;
  issued_books: number;
  overdue_books: number;
  total_students: number;
}

export interface DatasetMetadata {
  fileName: string | null;
  uploadedAt: string | null;
  totalRecordsLoaded: number;
  sourceType: 'csv' | 'json' | 'empty';
}

export interface StockoutRiskPrediction {
  bookId: number;
  title: string;
  author: string;
  category: string;
  totalCopies: number;
  availableCopies: number;
  utilizationRate: number; // 0 to 1
  stockoutRisk: 'Critical' | 'Elevated' | 'Healthy';
  predictedDemandDays: number; // estimated days until full stockout if borrowing continues
  recommendedAction: string;
}

export interface OverdueRiskPrediction {
  transactionId: number;
  bookTitle: string;
  studentName: string;
  studentDept: string;
  dueDate: string;
  daysRemainingOrOverdue: number;
  riskScore: number; // 0 to 100
  riskLevel: 'High Risk' | 'Medium Risk' | 'Low Risk';
  riskFactors: string[];
}
