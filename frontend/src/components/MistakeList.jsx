import React from 'react';
import { AlertCircle, Check, X, Tag } from 'lucide-react';

export const MistakeList = ({ mistakes = [], title = 'Key Corrections & Learning Points' }) => {
  if (!mistakes || mistakes.length === 0) {
    return null;
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
      <div className="flex items-center space-x-2">
        <AlertCircle className="w-4 h-4 text-amber-400" />
        <h4 className="text-sm font-bold text-slate-200">{title}</h4>
      </div>

      <div className="space-y-3">
        {mistakes.map((m, idx) => (
          <div
            key={idx}
            className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800/90 hover:border-slate-700/80 transition-colors space-y-2"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-rose-950/60 text-rose-300 border border-rose-800/40 text-xs font-mono line-through">
                <X className="w-3 h-3 text-rose-400" />
                <span>{m.original}</span>
              </span>

              <span className="text-slate-500 text-xs">➔</span>

              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/40 text-xs font-mono font-semibold">
                <Check className="w-3 h-3 text-emerald-400" />
                <span>{m.correct}</span>
              </span>

              {m.category && (
                <span className="ml-auto inline-flex items-center space-x-1 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-semibold border border-slate-700">
                  <Tag className="w-2.5 h-2.5" />
                  <span>{m.category}</span>
                </span>
              )}
            </div>

            {m.explanation && (
              <p className="text-xs text-slate-400 leading-relaxed pl-1">
                {m.explanation}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
