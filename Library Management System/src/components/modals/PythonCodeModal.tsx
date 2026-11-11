import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Download, Terminal, Code2, ExternalLink } from 'lucide-react';

interface PythonCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PythonCodeModal: React.FC<PythonCodeModalProps> = ({ isOpen, onClose }) => {
  const [code, setCode] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetch('/library_app.py')
        .then((res) => res.text())
        .then((text) => {
          setCode(text);
          setLoading(false);
        })
        .catch(() => {
          setCode('# Could not load file from server.');
          setLoading(false);
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden text-white">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-yellow-500/20 text-yellow-400 flex items-center justify-center font-mono font-bold text-base">
              🐍
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">library_app.py</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  Single Main Python File
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Tkinter GUI + SQLite Relational Database • Standard Python 3.8+
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg border border-slate-700 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy Code'}</span>
            </button>

            <a
              href="/library_app.py"
              download="library_app.py"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download File</span>
            </a>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Launch Instruction Banner */}
        <div className="bg-slate-850 px-6 py-2.5 border-b border-slate-800 text-xs flex flex-wrap items-center justify-between gap-3 text-slate-300">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">Quick Terminal Command:</span>
            <code className="px-2 py-0.5 rounded bg-slate-950 font-mono text-emerald-400 border border-slate-800">
              python library_app.py
            </code>
          </div>
          <div className="text-[11px] text-slate-400">
            Self-test verification flag: <code className="text-yellow-400">--test</code> • Terminal CLI: <code className="text-yellow-400">--cli</code>
          </div>
        </div>

        {/* Code Content Body */}
        <div className="flex-1 overflow-auto p-6 font-mono text-xs leading-relaxed text-slate-300 bg-slate-950/80">
          {loading ? (
            <div className="py-20 text-center text-slate-500">Loading Python script source...</div>
          ) : (
            <pre className="whitespace-pre-wrap">{code}</pre>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between shrink-0">
          <span>Total lines: ~2,300 lines of fully documented, robust Python</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg transition-colors cursor-pointer"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
};
