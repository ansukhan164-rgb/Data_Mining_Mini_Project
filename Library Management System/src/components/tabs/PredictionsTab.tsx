import React, { useMemo } from 'react';
import { useLibrary } from '../../context/LibraryContext';
import { generatePredictions } from '../../utils/predictionEngine';
import {
  Sparkles,
  AlertTriangle,
  Clock,
  ShieldCheck,
  TrendingDown,
  Upload,
  BookPlus,
  Compass,
  CheckCircle2,
} from 'lucide-react';

interface PredictionsTabProps {
  onOpenUpload: () => void;
}

export const PredictionsTab: React.FC<PredictionsTabProps> = ({ onOpenUpload }) => {
  const { books, students, transactions, datasetMeta, uploadDataset } = useLibrary();

  const predictions = useMemo(() => {
    return generatePredictions(books, students, transactions);
  }, [books, students, transactions]);

  const totalRecords = books.length + students.length + transactions.length;

  if (totalRecords === 0) {
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
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-inner">
          <Sparkles className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">Upload Dataset to Run Predictions</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
          The prediction engine operates strictly on your uploaded data. Load a CSV or JSON file to
          forecast catalog stockout risks, score overdue probabilities, and generate acquisition
          recommendations.
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

  const criticalStockouts = predictions.stockoutPredictions.filter((p) => p.stockoutRisk === 'Critical');
  const elevatedStockouts = predictions.stockoutPredictions.filter((p) => p.stockoutRisk === 'Elevated');
  const highRiskLoans = predictions.overduePredictions.filter((p) => p.riskLevel === 'High Risk');

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-xl shadow-sm p-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">Data-Driven Predictions & Forecasting</h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                Local Heuristic Models
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Stockout depletion forecasting, loan overdue risk scoring, and catalog optimization
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <div className="px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300">
            Based on <span className="font-bold text-white">{totalRecords}</span> uploaded records
          </div>
        </div>
      </div>

      {/* 2. Top Prediction Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase tracking-wider">
            <span>Critical Stockout Risk</span>
            <AlertTriangle className={`w-4 h-4 ${criticalStockouts.length > 0 ? 'text-rose-600' : 'text-slate-400'}`} />
          </div>
          <div className={`text-2xl font-black mt-1 ${criticalStockouts.length > 0 ? 'text-rose-600' : 'text-slate-800'}`}>
            {criticalStockouts.length} Titles
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            0 copies currently available on shelf
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase tracking-wider">
            <span>Elevated Depletion Risk</span>
            <TrendingDown className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-600 mt-1">
            {elevatedStockouts.length} Titles
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Predicted to reach zero stock within 5–9 days
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase tracking-wider">
            <span>High Overdue Risk</span>
            <Clock className={`w-4 h-4 ${highRiskLoans.length > 0 ? 'text-rose-600' : 'text-slate-400'}`} />
          </div>
          <div className={`text-2xl font-black mt-1 ${highRiskLoans.length > 0 ? 'text-rose-600' : 'text-slate-800'}`}>
            {highRiskLoans.length} Loans
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Probability &gt; 70% of incurring late fines
          </div>
        </div>
      </div>

      {/* 3. Stockout Risk Predictions Grid */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-rose-600" />
            <span>Catalog Depletion & Stockout Risk Predictions</span>
          </h3>
          <span className="text-xs text-slate-400">
            Sorted by urgency of replenishment
          </span>
        </div>

        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Title & Author</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3 text-center">Stock Level</th>
                <th className="py-2.5 px-3 text-center">Utilization</th>
                <th className="py-2.5 px-3 text-center">Risk Level</th>
                <th className="py-2.5 px-3">Forecasted Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {predictions.stockoutPredictions.slice(0, 8).map((p) => {
                const isCritical = p.stockoutRisk === 'Critical';
                const isElevated = p.stockoutRisk === 'Elevated';

                return (
                  <tr
                    key={p.bookId}
                    className={`hover:bg-slate-50 transition-colors ${
                      isCritical ? 'bg-rose-50/20' : isElevated ? 'bg-amber-50/20' : ''
                    }`}
                  >
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-900">{p.title}</div>
                      <div className="text-[10px] text-slate-500">{p.author}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700 font-semibold">
                        {p.category}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold text-slate-800">
                      {p.availableCopies} / {p.totalCopies}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono">
                      {p.utilizationRate}%
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          isCritical
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : isElevated
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {p.stockoutRisk}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 text-[11px]">
                      {p.recommendedAction}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Overdue Probability Assessment */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Overdue Risk Scoring Table (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>Active Loans Overdue Risk Scoring</span>
            </h3>
            <span className="text-xs text-slate-400">
              {predictions.overduePredictions.length} Active Loans Evaluated
            </span>
          </div>

          {predictions.overduePredictions.length === 0 ? (
            <p className="text-center py-8 text-slate-400 text-xs">
              No active loans in uploaded dataset.
            </p>
          ) : (
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Borrower & Book</th>
                    <th className="py-2.5 px-3 text-center">Due Date</th>
                    <th className="py-2.5 px-3 text-center">Risk Score</th>
                    <th className="py-2.5 px-3">Risk Assessment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {predictions.overduePredictions.map((loan) => {
                    const isHigh = loan.riskLevel === 'High Risk';
                    const isMed = loan.riskLevel === 'Medium Risk';

                    return (
                      <tr key={loan.transactionId} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-900">{loan.studentName}</div>
                          <div className="text-[10px] text-slate-500 truncate max-w-[200px]">
                            {loan.bookTitle}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono">
                          {loan.dueDate}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                              isHigh
                                ? 'bg-rose-100 text-rose-800 font-bold'
                                : isMed
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {loan.riskScore}%
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-[11px] text-slate-600">
                          <ul className="list-disc list-inside space-y-0.5">
                            {loan.riskFactors.map((f, idx) => (
                              <li key={idx} className="truncate">
                                {f}
                              </li>
                            ))}
                          </ul>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right: Policy & Acquisition Recommendations (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Acquisition Recommendations */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <BookPlus className="w-4 h-4 text-blue-600" />
              <span>Recommended Acquisitions</span>
            </h3>

            {predictions.recommendedAcquisitions.length === 0 ? (
              <p className="text-slate-500 text-xs py-4 text-center">
                Inventory levels across all categories satisfy current demand velocity.
              </p>
            ) : (
              <div className="space-y-2.5">
                {predictions.recommendedAcquisitions.map((acq) => (
                  <div
                    key={acq.category}
                    className="p-3 rounded-lg border border-slate-200 bg-slate-50/60 space-y-1 text-xs"
                  >
                    <div className="flex items-center justify-between font-bold text-slate-900">
                      <span>{acq.category}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] bg-blue-100 text-blue-800 font-mono">
                        +{acq.suggestedCopies} copies
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600">{acq.reason}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Circulation Duration Recommendation */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Compass className="w-4 h-4 text-indigo-600" />
              <span>Loan Duration Optimization</span>
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {predictions.turnoverRecommendation}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
