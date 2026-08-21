import React, { useState } from "react";
import { formatDuration, getStatusTheme } from "@/lib/cdrHelpers";

export function CDRTable({ records = [], isLoading = false }) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  if (isLoading) {
    return (
      <div className="w-full bg-white/60 backdrop-blur-xl animate-pulse p-8 flex flex-col gap-4 rounded-2xl border border-slate-200/60 shadow-sm">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="h-14 bg-slate-200/50 rounded-xl w-full"></div>
        ))}
      </div>
    );
  }

  if (!records || records.length === 0) {
    return (
      <div className="py-32 text-center flex flex-col items-center justify-center w-full bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200/60 shadow-sm">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-5">
          <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-slate-700 mb-1">No Call Records Found</h3>
        <p className="text-sm font-medium text-slate-500">There are no call records available for this period.</p>
      </div>
    );
  }

  const totalPages = Math.ceil(records.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentRecords = records.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="w-full bg-white/80 backdrop-blur-2xl rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden flex flex-col">
      <div className="overflow-x-auto flex-1 custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200/60">
              <th scope="col" className="px-6 py-5 font-bold tracking-wider text-slate-500 uppercase text-[10px] w-48">Date & Time</th>
              <th scope="col" className="px-6 py-5 font-bold tracking-wider text-slate-500 uppercase text-[10px] w-32">Direction</th>
              <th scope="col" className="px-6 py-5 font-bold tracking-wider text-slate-500 uppercase text-[10px]">Agent / Client</th>
              <th scope="col" className="px-6 py-5 font-bold tracking-wider text-slate-500 uppercase text-[10px] text-center w-36">Status</th>
              <th scope="col" className="px-6 py-5 font-bold tracking-wider text-slate-500 uppercase text-[10px] text-center">Hangup Cause</th>
              <th scope="col" className="px-6 py-5 font-bold tracking-wider text-slate-500 uppercase text-[10px] text-right w-24">Duration</th>
              <th scope="col" className="px-6 py-5 font-bold tracking-wider text-slate-500 uppercase text-[10px] text-center w-56">Recording</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/80">
            {currentRecords.map((record) => {
              // Custom IVR status handling: if it has call duration or a recording, the customer answered the IVR
              let displayStatus = record.status || record.call_status || "Unknown";
              if (record.service === "IVR" && (record.recording_url || record.call_duration > 0 || record.total_call_duration > 0)) {
                displayStatus = "Answered";
              }

              const theme = getStatusTheme(displayStatus);
              const dateStr = record.createdAt ? new Date(record.createdAt).toLocaleDateString() : record.date;
              const timeStr = record.createdAt ? new Date(record.createdAt).toLocaleTimeString() : record.time;
              
              // Formatting Agent Display (show name if present, fallback to number, did, or System)
              let agentDisplay = "System";
              if (record.agent_name) {
                if (record.agent_number && record.agent_number !== record.client_number) {
                  agentDisplay = `${record.agent_name} (${record.agent_number})`;
                } else {
                  agentDisplay = record.agent_name;
                }
              } else if (record.agent_number || record.answered_agent_number) {
                agentDisplay = record.agent_number || record.answered_agent_number;
              } else if (record.did_number) {
                agentDisplay = record.did_number;
              }

              const clientDisplay = record.client_number || record.call_to_number || "Unknown";
              
              // Correct duration logic (treat 0 answered seconds as falsy to fall back to actual call duration if customer talked to IVR)
              const durationSeconds = record.answered_seconds || record.call_duration || record.total_call_duration || 0;

              return (
                <tr key={record._id || record.uuid || record.call_id || Math.random()} className="hover:bg-blue-50/30 transition-all duration-200 group">
                  <td className="px-6 py-5 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="text-[13px] font-semibold text-slate-700">{dateStr} {timeStr}</span>
                      <span className="text-[10px] text-slate-400 font-mono mt-0.5 group-hover:text-blue-500/70 transition-colors" title={record.uuid || record.call_id}>{String(record.uuid || record.call_id).slice(0, 16)}...</span>
                    </div>
                  </td>
                  
                  <td className="px-6 py-5 whitespace-nowrap">
                    <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider bg-slate-100/80 px-2.5 py-1.5 rounded-lg shadow-sm border border-slate-200/50">
                      {record.direction || "N/A"}
                    </span>
                  </td>
                  
                  <td className="px-6 py-5">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2.5">
                        <span className="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider w-12 text-center">Agent</span>
                        <span className="font-mono text-[13px] font-medium text-slate-700">{agentDisplay}</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <span className="bg-blue-50 text-blue-500 px-1.5 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider w-12 text-center">Client</span>
                        <span className="font-mono text-[13px] font-medium text-slate-700">{clientDisplay}</span>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-5 whitespace-nowrap text-center">
                    <div className="group/tooltip relative inline-flex justify-center cursor-help" title={record.description || "No description"}>
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-wider border shadow-sm transition-transform duration-200 hover:scale-105 ${theme.bg} ${theme.text} ${theme.border}`}>
                        <span className={`w-1.5 h-1.5 rounded-full shadow-sm ${theme.dot}`}></span>
                        {displayStatus}
                      </span>
                    </div>
                  </td>
                  
                  <td className="px-6 py-5 whitespace-nowrap text-center">
                    <span className="text-[12px] font-semibold text-slate-500 bg-slate-50 px-3 py-1 rounded-lg border border-slate-100">
                      {record.hangup_cause || "N/A"}
                    </span>
                  </td>
                  
                  <td className="px-6 py-5 whitespace-nowrap text-right">
                    <span className="font-mono text-[13px] font-bold text-slate-700 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                      {formatDuration(durationSeconds)}
                    </span>
                  </td>
                  
                  <td className="px-6 py-5 whitespace-nowrap text-center">
                    {(record.recording_url || record.webhook_payload?.recording_url) ? (
                      <div className="relative group/audio">
                        <audio 
                          controls 
                          src={record.recording_url || record.webhook_payload?.recording_url} 
                          className="h-9 w-48 rounded-xl shadow-sm opacity-80 hover:opacity-100 transition-opacity" 
                          preload="none"
                        >
                          Your browser does not support the audio element.
                        </audio>
                      </div>
                    ) : (
                      <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 border-dashed">No Audio</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-slate-200/60 bg-slate-50/50 flex items-center justify-between">
          <div className="text-xs font-medium text-slate-500">
            Showing <span className="font-bold text-slate-700">{startIndex + 1}</span> to <span className="font-bold text-slate-700">{Math.min(startIndex + itemsPerPage, records.length)}</span> of <span className="font-bold text-slate-700">{records.length}</span> entries
          </div>
          <div className="flex gap-1.5">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 bg-white border border-slate-200 shadow-sm hover:bg-slate-50 hover:text-blue-600 disabled:opacity-50 disabled:hover:bg-white disabled:hover:text-slate-600 transition-all"
            >
              Previous
            </button>
            
            <div className="flex gap-1">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition-all shadow-sm ${
                    currentPage === i + 1 
                    ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700" 
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-blue-600"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>

            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 bg-white border border-slate-200 shadow-sm hover:bg-slate-50 hover:text-blue-600 disabled:opacity-50 disabled:hover:bg-white disabled:hover:text-slate-600 transition-all"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
