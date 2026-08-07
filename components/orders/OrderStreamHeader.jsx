export function OrderStreamHeader({ 
  connectionStatus, 
  accounts, 
  isLoadingAccounts, 
  selectedUser, 
  onAccountSelect,
  isManualDisconnect,
  toggleConnection
}) {
  return (
    <div className="flex items-center gap-4">
      {/* Manual Connect/Disconnect Toggle */}
      <button
        onClick={toggleConnection}
        className={`px-3 py-1.5 text-xs font-bold rounded-lg border shadow-sm transition-all flex items-center gap-2 ${
          isManualDisconnect 
            ? "bg-slate-800 text-white border-slate-700 hover:bg-slate-700" 
            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-red-600"
        }`}
        title={isManualDisconnect ? "Click to Connect Stream" : "Click to Disconnect Stream"}
      >
        {isManualDisconnect ? (
          <>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Connect
          </>
        ) : (
          <>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Disconnect
          </>
        )}
      </button>

      {/* Connection Status Badge */}
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-100">
        <span className="relative flex h-2.5 w-2.5">
          {connectionStatus === "Connected" && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          )}
          <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${connectionStatus === "Connected" ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
        </span>
        <span className="text-xs font-medium text-slate-600">
          {connectionStatus === "Connected" ? "Live" : connectionStatus}
        </span>
      </div>

      {/* Account Selector */}
      <select
        value={selectedUser}
        onChange={(e) => onAccountSelect(e.target.value)}
        disabled={isLoadingAccounts}
        className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 min-w-[160px] shadow-sm hover:border-slate-300 transition-colors cursor-pointer"
      >
        {isLoadingAccounts ? (
          <option>Loading...</option>
        ) : accounts.length === 0 ? (
          <option>No accounts found</option>
        ) : (
          accounts.map(acc => (
            <option key={acc.key} value={acc.key}>
              {acc.name ? `${acc.name} (${acc.key})` : `User: ${acc.key}`}
            </option>
          ))
        )}
      </select>
    </div>
  );
}
