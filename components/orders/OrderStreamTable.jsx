import { OrderCard } from "./OrderCard";

export function OrderStreamTable({ events = [], orders = [], restaurants = [], isRawStream = false }) {
  if (isRawStream) {
    return (
      <div className="w-full bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 border-collapse">
            <thead>
              <tr className="border-b border-slate-100">
                <th scope="col" className="px-8 py-4 w-32 text-[11px] font-bold tracking-[0.1em] text-slate-500 uppercase">
                  Time
                </th>
                <th scope="col" className="px-8 py-4 w-48 text-[11px] font-bold tracking-[0.1em] text-slate-500 uppercase">
                  Event
                </th>
                <th scope="col" className="px-8 py-4 text-[11px] font-bold tracking-[0.1em] text-slate-500 uppercase">
                  Payload
                </th>
              </tr>
            </thead>
            <tbody>
              {events.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-8 py-24 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center">
                      <svg className="w-10 h-10 mb-3 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-sm font-medium text-slate-500">Waiting for live events...</p>
                    </div>
                  </td>
                </tr>
              ) : (
                events.map((evt) => (
                  <tr key={evt.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-5 whitespace-nowrap text-slate-500 font-medium text-xs">
                      {evt.timestamp.toLocaleTimeString()}
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-100/50">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        {evt.eventName}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 max-h-32 overflow-y-auto font-mono text-[11px] text-slate-600 leading-relaxed shadow-inner">
                        {JSON.stringify(evt.args, null, 2)}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // --- ORDER CARDS VIEW ---
  
  if (orders.length === 0) {
    return (
      <div className="py-24 text-center text-slate-400 flex flex-col items-center justify-center w-full">
        <svg className="w-12 h-12 mb-4 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
        <h3 className="text-lg font-semibold text-slate-600 mb-1">No orders found</h3>
        <p className="text-sm font-medium text-slate-400">There are no orders matching this state.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {orders.map((o) => (
        <OrderCard key={o._id || o.tab_id} order={o} restaurants={restaurants} />
      ))}
    </div>
  );
}
