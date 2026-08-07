import axios from "axios";
import { CDRTable } from "./CDRTable";
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";

const fetchCallRecords = async (page, limit) => {
  const { data } = await axios.get(`/api/tata/cdr?page=${page}&limit=${limit}`);
  return data.data;
};

export function CDRTabContent() {
  const [page, setPage] = useState(1);
  const limit = 50;

  const { data: records, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["callRecords", page],
    queryFn: () => fetchCallRecords(page, limit),
    keepPreviousData: true,
    staleTime: 1000 * 60 * 2,
  });

  return (
    <div className="flex flex-col w-full h-full">
      <div className="flex items-center justify-between  p-6 border-b border-slate-100 bg-slate-50/50 rounded-t-2xl">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-bold text-slate-800">Call Logs</h2>
          <button
            onClick={() => refetch()}
            className="p-2 hover:bg-slate-200 rounded-lg text-slate-500 transition-colors"
            title="Refresh logs"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {isError && (
        <div className="p-6">
          <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-100 flex items-center gap-3">
            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span className="font-semibold text-sm">Failed to fetch CDR data: {error.message}</span>
          </div>
        </div>
      )}

      {!isError && (
        <div className="flex-1 overflow-hidden flex flex-col">
          <CDRTable records={records?.results || []} isLoading={isLoading} />
          {records?.count > 0 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-white rounded-b-2xl">
              <div className="text-sm text-slate-500 font-medium">
                Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, records.count)} of {records.count} results
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPage((old) => Math.max(old - 1, 1))}
                  disabled={page === 1}
                  className="px-4 py-1.5 border border-slate-200 text-slate-600 text-sm font-medium rounded-lg disabled:opacity-50 hover:bg-slate-50 transition-colors"
                >
                  Previous
                </button>

                {Array.from({ length: Math.min(5, Math.ceil(records.count / limit)) }).map((_, i) => {
                  let pageNum = page <= 3 ? i + 1 : page - 2 + i;
                  if (pageNum > Math.ceil(records.count / limit)) return null;

                  const isActive = pageNum === page;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${isActive
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                        }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  onClick={() => setPage((old) => old + 1)}
                  disabled={page >= Math.ceil(records.count / limit)}
                  className="px-4 py-1.5 border border-slate-200 text-slate-600 text-sm font-medium rounded-lg disabled:opacity-50 hover:bg-slate-50 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
