import React, { useState, useRef } from 'react';
import { useLibrary } from '../context/LibraryContext';
import { CSV_TEMPLATES, SAMPLE_FILES } from '../data/initialData';
import {
  Upload,
  FileText,
  AlertCircle,
  X,
  Download,
  FileSpreadsheet,
  Zap,
  Check,
  FolderOpen,
  Sparkles,
} from 'lucide-react';

interface UploadDatasetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UploadDatasetModal: React.FC<UploadDatasetModalProps> = ({ isOpen, onClose }) => {
  const { uploadDataset } = useLibrary();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<'upload' | 'samples'>('samples');
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<{ name: string; size: string; previewLines: string[] } | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [loadingSample, setLoadingSample] = useState<string | null>(null);
  const [loadedSuccess, setLoadedSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileProcess = (file: File) => {
    setErrorMsg('');
    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setFileContent(text);
      const lines = text.split('\n').filter((l) => l.trim()).slice(0, 5);
      setFilePreview({
        name: file.name,
        size: `${(file.size / 1024).toFixed(1)} KB`,
        previewLines: lines,
      });
    };
    reader.onerror = () => {
      setErrorMsg('Could not read the selected file from disk.');
    };
    reader.readAsText(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileProcess(e.target.files[0]);
    }
  };

  const handleSubmit = () => {
    if (!selectedFile || !fileContent) {
      setErrorMsg('Please select a CSV or JSON dataset file first.');
      return;
    }

    const res = uploadDataset(selectedFile.name, fileContent);
    if (res.success) {
      onClose();
    } else {
      setErrorMsg(res.message);
    }
  };

  // Quick 1-click sample loader (fetches from /public and injects via uploadDataset)
  const handleLoadSample = async (samplePath: string, filename: string) => {
    try {
      setLoadingSample(filename);
      setErrorMsg('');
      const resp = await fetch(samplePath);
      if (!resp.ok) {
        throw new Error(`Failed to fetch ${filename} (status ${resp.status})`);
      }
      const text = await resp.text();
      const res = uploadDataset(filename, text);
      if (res.success) {
        setLoadedSuccess(res.message);
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setErrorMsg(res.message);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load sample dataset.');
    } finally {
      setLoadingSample(null);
    }
  };

  const downloadTemplate = (type: 'books' | 'students' | 'circulation' | 'unifiedDataset') => {
    const text = CSV_TEMPLATES[type];
    const blob = new Blob([text], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `template_${type}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden text-slate-900 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Dataset Manager</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  CSV & JSON
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Upload your local files or test with rich generated sample datasets
              </p>
            </div>
          </div>

          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-2 text-xs">
          <button
            onClick={() => setActiveTab('samples')}
            className={`pb-2.5 px-3 font-bold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'samples'
                ? 'border-blue-600 text-blue-600 bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Sample Datasets ({SAMPLE_FILES.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`pb-2.5 px-3 font-bold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'upload'
                ? 'border-blue-600 text-blue-600 bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span>Upload From Device</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 text-xs max-h-[75vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {loadedSuccess && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{loadedSuccess} Closing window...</span>
            </div>
          )}

          {/* TAB 1: Sample Datasets */}
          {activeTab === 'samples' && (
            <div className="space-y-4">
              {/* Featured 1-Click Load Card */}
              <div className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white rounded-xl p-4 shadow-sm border border-blue-800 flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1 max-w-sm">
                  <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs uppercase tracking-wider">
                    <Zap className="w-3.5 h-3.5" />
                    <span>Instant Full Demo</span>
                  </div>
                  <h4 className="font-bold text-sm text-white">Full University Library Dataset</h4>
                  <p className="text-[11px] text-slate-300">
                    Loads 20 books across 7 disciplines, 15 students, and 15 loan records (including 2 overdue loans with fines).
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href="/sample_library_dataset.json"
                    download="sample_library_dataset.json"
                    className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>JSON</span>
                  </a>
                  <button
                    disabled={loadingSample !== null}
                    onClick={() => handleLoadSample('/sample_library_dataset.json', 'sample_library_dataset.json')}
                    className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs shadow-md transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Zap className="w-3.5 h-3.5 fill-current" />
                    <span>{loadingSample === 'sample_library_dataset.json' ? 'Loading...' : '⚡ Load All 50 Records'}</span>
                  </button>
                </div>
              </div>

              {/* Sample Files List */}
              <div className="space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Individual Category Samples (CSV)
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {SAMPLE_FILES.slice(0, 4).map((file) => (
                    <div
                      key={file.filename}
                      className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition-colors flex flex-col justify-between gap-2.5"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-bold text-slate-900 text-xs truncate">{file.name}</span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-200 text-slate-700">
                            {file.records} rows
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{file.description}</p>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                        <a
                          href={file.path}
                          download={file.filename}
                          className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1"
                        >
                          <Download className="w-3 h-3" />
                          <span>Download .csv</span>
                        </a>

                        <button
                          disabled={loadingSample !== null}
                          onClick={() => handleLoadSample(file.path, file.filename)}
                          className="px-2.5 py-1 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1"
                        >
                          <Zap className="w-3 h-3 fill-current" />
                          <span>{loadingSample === file.filename ? 'Loading...' : 'Load'}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Blank templates */}
              <div className="pt-2 border-t border-slate-100">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Blank Starter CSV Templates:</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => downloadTemplate('books')}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold text-center border border-slate-200 transition-colors cursor-pointer"
                  >
                    Blank Books CSV
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadTemplate('students')}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold text-center border border-slate-200 transition-colors cursor-pointer"
                  >
                    Blank Students CSV
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadTemplate('unifiedDataset')}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold text-center border border-slate-200 transition-colors cursor-pointer"
                  >
                    Blank Unified CSV
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Upload Custom File */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              {/* Drag & Drop Area */}
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                  dragActive
                    ? 'border-blue-500 bg-blue-50/50 scale-[1.01]'
                    : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.json,.txt"
                  onChange={handleFileInput}
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-2.5">
                  <Upload className="w-6 h-6" />
                </div>
                <div className="font-bold text-slate-800 text-sm">
                  Drag & Drop your dataset file here, or{' '}
                  <span className="text-blue-600 underline">Browse from Device</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Supports CSV (`.csv`) and JSON (`.json`) datasets. Columns and headers are auto-detected.
                </p>
              </div>

              {/* File Preview Card */}
              {filePreview && (
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                      <span className="font-bold text-slate-900">{filePreview.name}</span>
                      <span className="text-slate-400 font-mono text-[11px]">({filePreview.size})</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      Ready to Load
                    </span>
                  </div>

                  <div className="bg-slate-900 rounded-lg p-2.5 text-[10px] font-mono text-slate-300 max-h-28 overflow-y-auto overflow-x-auto">
                    {filePreview.previewLines.map((line, i) => (
                      <div key={i} className="truncate">
                        {line}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!selectedFile}
                  onClick={handleSubmit}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white font-bold rounded-lg shadow cursor-pointer transition-colors flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Parse & Load Dataset</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
