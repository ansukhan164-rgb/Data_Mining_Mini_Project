import { Book, Student, Transaction, StockoutRiskPrediction, OverdueRiskPrediction } from '../types/library';

export interface ComprehensiveAnalysis {
  totalRecords: number;
  catalogSize: number;
  totalCopies: number;
  availableCopies: number;
  borrowedCopies: number;
  inventoryUtilizationRate: number; // percentage (0 to 100)
  totalStudents: number;
  activeBorrowersCount: number;
  activeLoansCount: number;
  overdueLoansCount: number;
  overduePercentage: number;
  totalAccruedFines: number;
  categoryBreakdown: Array<{
    category: string;
    titlesCount: number;
    totalCopies: number;
    availableCopies: number;
    borrowedCopies: number;
    utilizationRate: number;
  }>;
  departmentBreakdown: Array<{
    department: string;
    studentsCount: number;
    activeLoansCount: number;
  }>;
  topBorrowedBooks: Array<{
    title: string;
    author: string;
    category: string;
    borrowCount: number;
    currentAvailable: number;
  }>;
}

export function generateAnalysis(
  books: Book[],
  students: Student[],
  transactions: Transaction[]
): ComprehensiveAnalysis {
  const totalCopies = books.reduce((acc, b) => acc + b.copies_total, 0);
  const availableCopies = books.reduce((acc, b) => acc + b.copies_available, 0);
  const borrowedCopies = totalCopies - availableCopies;
  const inventoryUtilizationRate = totalCopies > 0 ? Math.round((borrowedCopies / totalCopies) * 100) : 0;

  const activeLoans = transactions.filter((t) => t.status === 'Issued' || t.status === 'Overdue');
  const overdueLoans = transactions.filter((t) => t.status === 'Overdue');
  const overduePercentage = activeLoans.length > 0 ? Math.round((overdueLoans.length / activeLoans.length) * 100) : 0;
  const totalAccruedFines = transactions.reduce((acc, t) => acc + (t.fine_amount || 0), 0);

  // Unique borrowers
  const activeBorrowerIds = new Set(activeLoans.map((t) => t.student_id));

  // Category breakdown
  const catMap = new Map<string, { titles: number; total: number; avail: number }>();
  books.forEach((b) => {
    const existing = catMap.get(b.category) || { titles: 0, total: 0, avail: 0 };
    catMap.set(b.category, {
      titles: existing.titles + 1,
      total: existing.total + b.copies_total,
      avail: existing.avail + b.copies_available,
    });
  });

  const categoryBreakdown = Array.from(catMap.entries()).map(([category, data]) => {
    const borrowed = data.total - data.avail;
    const util = data.total > 0 ? Math.round((borrowed / data.total) * 100) : 0;
    return {
      category,
      titlesCount: data.titles,
      totalCopies: data.total,
      availableCopies: data.avail,
      borrowedCopies: borrowed,
      utilizationRate: util,
    };
  }).sort((a, b) => b.utilizationRate - a.utilizationRate || b.totalCopies - a.totalCopies);

  // Department breakdown
  const deptMap = new Map<string, { students: number; activeLoans: number }>();
  students.forEach((s) => {
    const existing = deptMap.get(s.department) || { students: 0, activeLoans: 0 };
    deptMap.set(s.department, {
      students: existing.students + 1,
      activeLoans: existing.activeLoans,
    });
  });

  activeLoans.forEach((l) => {
    const s = students.find((x) => x.id === l.student_id);
    if (s) {
      const existing = deptMap.get(s.department) || { students: 0, activeLoans: 0 };
      deptMap.set(s.department, {
        students: existing.students,
        activeLoans: existing.activeLoans + 1,
      });
    }
  });

  const departmentBreakdown = Array.from(deptMap.entries()).map(([department, data]) => ({
    department,
    studentsCount: data.students,
    activeLoansCount: data.activeLoans,
  })).sort((a, b) => b.activeLoansCount - a.activeLoansCount);

  // Top borrowed books
  const borrowCountMap = new Map<number, number>();
  transactions.forEach((t) => {
    borrowCountMap.set(t.book_id, (borrowCountMap.get(t.book_id) || 0) + 1);
  });

  const topBorrowedBooks = books.map((b) => ({
    title: b.title,
    author: b.author,
    category: b.category,
    borrowCount: borrowCountMap.get(b.id) || (b.copies_total - b.copies_available),
    currentAvailable: b.copies_available,
  })).sort((a, b) => b.borrowCount - a.borrowCount).slice(0, 5);

  return {
    totalRecords: books.length + students.length + transactions.length,
    catalogSize: books.length,
    totalCopies,
    availableCopies,
    borrowedCopies,
    inventoryUtilizationRate,
    totalStudents: students.length,
    activeBorrowersCount: activeBorrowerIds.size,
    activeLoansCount: activeLoans.length,
    overdueLoansCount: overdueLoans.length,
    overduePercentage,
    totalAccruedFines,
    categoryBreakdown,
    departmentBreakdown,
    topBorrowedBooks,
  };
}

export function generatePredictions(
  books: Book[],
  students: Student[],
  transactions: Transaction[]
): {
  stockoutPredictions: StockoutRiskPrediction[];
  overduePredictions: OverdueRiskPrediction[];
  turnoverRecommendation: string;
  recommendedAcquisitions: Array<{ category: string; suggestedCopies: number; reason: string }>;
} {
  const today = new Date();

  // 1. Stockout Predictions for Books
  const stockoutPredictions: StockoutRiskPrediction[] = books.map((b) => {
    const borrowed = b.copies_total - b.copies_available;
    const util = b.copies_total > 0 ? borrowed / b.copies_total : 0;

    let risk: 'Critical' | 'Elevated' | 'Healthy' = 'Healthy';
    let demandDays = 30;
    let action = 'Stock levels are sufficient.';

    if (b.copies_available === 0) {
      risk = 'Critical';
      demandDays = 0;
      action = `Full stockout! Recommended to acquire at least ${Math.max(2, Math.ceil(b.copies_total * 0.5))} additional copies.`;
    } else if (b.copies_available === 1 && b.copies_total > 1) {
      risk = 'Elevated';
      demandDays = 5;
      action = 'Only 1 copy left in stock. Place on short-loan circulation or reserve additional copies.';
    } else if (util >= 0.75) {
      risk = 'Elevated';
      demandDays = 9;
      action = 'High circulation demand. Monitor inventory closely over the next week.';
    }

    return {
      bookId: b.id,
      title: b.title,
      author: b.author,
      category: b.category,
      totalCopies: b.copies_total,
      availableCopies: b.copies_available,
      utilizationRate: Math.round(util * 100),
      stockoutRisk: risk,
      predictedDemandDays: demandDays,
      recommendedAction: action,
    };
  }).sort((a, b) => {
    const rank = { Critical: 3, Elevated: 2, Healthy: 1 };
    return rank[b.stockoutRisk] - rank[a.stockoutRisk] || b.utilizationRate - a.utilizationRate;
  });

  // 2. Overdue Risk Predictions for Active Loans
  const activeLoans = transactions.filter((t) => t.status === 'Issued' || t.status === 'Overdue');
  const overduePredictions: OverdueRiskPrediction[] = activeLoans.map((tx) => {
    const b = books.find((x) => x.id === tx.book_id);
    const s = students.find((x) => x.id === tx.student_id);

    const dueDate = new Date(tx.due_date);
    const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 3600 * 24));

    let riskScore = 15;
    const factors: string[] = [];

    if (tx.status === 'Overdue' || diffDays < 0) {
      riskScore = 95;
      factors.push(`Already overdue by ${Math.abs(diffDays)} days`);
    } else if (diffDays <= 2) {
      riskScore = 75;
      factors.push(`Due in ${diffDays} day${diffDays === 1 ? '' : 's'}`);
    } else if (diffDays <= 5) {
      riskScore = 45;
      factors.push(`Approaching due date in ${diffDays} days`);
    }

    // Historical borrower check
    const pastOverdues = transactions.filter(
      (t) => t.student_id === tx.student_id && t.status === 'Overdue'
    ).length;
    if (pastOverdues > 0) {
      riskScore = Math.min(100, riskScore + 20);
      factors.push(`Borrower has ${pastOverdues} overdue record(s) on file`);
    }

    let riskLevel: 'High Risk' | 'Medium Risk' | 'Low Risk' = 'Low Risk';
    if (riskScore >= 70) riskLevel = 'High Risk';
    else if (riskScore >= 40) riskLevel = 'Medium Risk';

    return {
      transactionId: tx.id,
      bookTitle: b?.title || tx.book_title || 'Unknown Title',
      studentName: s?.full_name || tx.student_name || 'Borrower',
      studentDept: s?.department || tx.student_department || 'Student',
      dueDate: tx.due_date,
      daysRemainingOrOverdue: diffDays,
      riskScore,
      riskLevel,
      riskFactors: factors.length > 0 ? factors : ['Loan is in good standing with standard return window.'],
    };
  }).sort((a, b) => b.riskScore - a.riskScore);

  // 3. Recommended Acquisitions based on Category Demand
  const catDemands = new Map<string, { total: number; avail: number }>();
  books.forEach((b) => {
    const cur = catDemands.get(b.category) || { total: 0, avail: 0 };
    catDemands.set(b.category, { total: cur.total + b.copies_total, avail: cur.avail + b.copies_available });
  });

  const recommendedAcquisitions = Array.from(catDemands.entries())
    .filter(([_, data]) => data.total > 0 && (data.total - data.avail) / data.total >= 0.6)
    .map(([cat, data]) => {
      const needed = Math.max(2, Math.ceil(data.total * 0.4));
      return {
        category: cat,
        suggestedCopies: needed,
        reason: `${Math.round(((data.total - data.avail) / data.total) * 100)}% of titles currently checked out in this discipline.`,
      };
    });

  const turnoverRecommendation =
    activeLoans.length > 0
      ? `Based on ${activeLoans.length} active loans and catalog circulation, optimal standard checkout length is 14 days with 3-day automated reminder alerts to minimize late returns.`
      : 'Upload a circulation log or issue books to generate adaptive loan duration models.';

  return {
    stockoutPredictions,
    overduePredictions,
    turnoverRecommendation,
    recommendedAcquisitions,
  };
}
