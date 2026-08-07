import React from 'react';
import { formatDuration, getStatusTheme } from '@/lib/cdrHelpers';

export function OrderCallHistory({ callRecords = [] }) {
  if (!callRecords || callRecords.length === 0) {
    return (
      <div className="p-6 flex flex-col items-center justify-center text-center">
        <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center mb-2">
          <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
        </div>
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">No Calls Yet</span>
      </div>
    );
  }

  return (
    <div className="p-3 bg-slate-50/30 border-t border-slate-100 max-h-64 overflow-y-auto custom-scrollbar">
      <div className="flex flex-col gap-2">
        {callRecords.map((record) => {
          const status = record.call_status || record.webhook_payload?.status || record.status || "Unknown";
          const theme = getStatusTheme(status);
          const isOutbound = record.direction === "outbound" || record.direction === "click_to_call";
          const isInbound = record.direction === "inbound";

          const dateObj = record.createdAt ? new Date(record.createdAt) : new Date();
          const callDate = dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' });
          const callTime = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

          const duration = record.answered_seconds ?? record.call_duration ?? record.total_call_duration ?? record.webhook_payload?.answered_seconds ?? record.webhook_payload?.call_duration ?? 0;
          const recordingUrl = record.recording_url || record.webhook_payload?.recording_url;

          return (
            <div key={record._id || Math.random()} className="group flex items-center justify-between p-3 bg-white border border-slate-200/60 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:shadow-md hover:border-blue-200/60 transition-all duration-300">
              <div className="flex items-center gap-3">
                <div className={`flex flex-col items-center justify-center w-10 h-10 rounded-full transition-colors ${isOutbound ? 'bg-blue-50 text-blue-500 group-hover:bg-blue-100' : isInbound ? 'bg-purple-50 text-purple-500 group-hover:bg-purple-100' : 'bg-slate-50 text-slate-500'}`}>
                  {isOutbound ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                  ) : isInbound ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                  )}
                </div>

                <div className="flex flex-col gap-0.5">
                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 w-fit rounded-lg text-[9px] font-bold uppercase tracking-wider border ${theme.bg} ${theme.text} ${theme.border}`}>
                    {status}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium tracking-wide">{callDate} {callTime}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex flex-col items-end">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Duration</span>
                  <span className="text-[13px] font-mono font-semibold text-slate-700">
                    {formatDuration(duration)}
                  </span>
                </div>
                {recordingUrl && (
                  <div className="pl-3 border-l border-slate-100 h-8 flex items-center">
                    <a href={recordingUrl} target="_blank" rel="noreferrer" title="Play recording" className="p-2 text-blue-500 bg-blue-50 hover:bg-blue-600 hover:text-white rounded-lg transition-colors shadow-sm">
                      <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
                    </a>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
