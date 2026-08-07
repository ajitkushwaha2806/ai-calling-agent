import React, { useState } from "react";
import { parseOrderData } from "./helpers";
import { initiateManualCall } from "@/services/frontend/tataService";
import { OrderCallHistory } from "./OrderCallHistory";

export function OrderCard({ order, restaurants = [] }) {
  const [isCalling, setIsCalling] = useState(false);
  const [showCallHistory, setShowCallHistory] = useState(false);

  const handleCall = async (e) => {
    e.stopPropagation();
    if (!order.customer_number || isCalling) return;
    
    try {
      setIsCalling(true);
      await initiateManualCall(order.customer_number);
    } catch (err) {
      alert(err.message || "Error initiating call");
    } finally {
      setIsCalling(false);
    }
  };

  const {
    orderData,
    customer,
    items,
    total,
    status,
    resId,
    resName,
    resLogo,
    subzone,
    statusColor,
  } = parseOrderData(order, restaurants);

  return (
    <div className="flex flex-col bg-white border border-slate-200 rounded-xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] hover:shadow-[0_8px_25px_-5px_rgba(6,81,237,0.1)] transition-all overflow-hidden group">
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-slate-100">
        <div className="flex items-center gap-3">
          {resLogo ? (
            <img src={resLogo} alt={resName} className="w-8 h-8 rounded-md object-cover border border-slate-200 shadow-sm" />
          ) : (
            <div className="w-8 h-8 rounded-md bg-slate-100 flex items-center justify-center border border-slate-200">
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
            </div>
          )}
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-700 tracking-wide line-clamp-1">{resName}</span>
            <span className="text-[10px] font-semibold text-slate-400">{subzone} • {resId || "Unknown ID"}</span>
          </div>
        </div>
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase border ${statusColor}`}>
          {status}
        </span>
      </div>

      <div className="flex justify-between items-start p-4 bg-slate-50/50">
        <div>
          <h4 className="text-[15px] font-bold text-slate-900 truncate max-w-[180px]">{customer.name || "Unknown Customer"}</h4>
          
          {order.customer_number ? (
            <div className="mt-2">
              <span 
                onClick={handleCall}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wider border transition-all shadow-sm ${
                  isCalling 
                    ? "bg-emerald-100 text-emerald-800 border-emerald-300 cursor-wait" 
                    : "bg-emerald-50 text-emerald-700 border-emerald-100/50 hover:bg-emerald-100 hover:border-emerald-200 cursor-pointer"
                }`}
              >
                {isCalling ? (
                  <svg className="animate-spin w-3.5 h-3.5 text-emerald-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                )}
                {isCalling ? "Calling..." : order.customer_number}
              </span>
            </div>
          ) : (
            <div className="mt-2 text-[11px] text-slate-400 font-medium tracking-wide">
              No Phone Available
            </div>
          )}

          <div className="flex items-center gap-2 mt-1">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Order #{order.tab_id}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-black text-slate-900">{total}</p>
          <p className={`text-[10px] font-bold mt-1 tracking-wide uppercase ${orderData.paymentMethod === 'PAID' ? 'text-emerald-600' : 'text-amber-600'}`}>
            {orderData.paymentMethod === 'PAID' ? 'Paid Online' : 'COD'}
          </p>
        </div>
      </div>

      <div className="p-4 flex-grow bg-white">
        <div className="flex flex-wrap gap-2 mb-4">
          {orderData.deliveryMode && (
            <span className="inline-flex items-center px-2 py-1 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase tracking-wide">
              {orderData.deliveryMode}
            </span>
          )}
          {orderData.handoverDetails?.time && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded text-[10px] font-bold uppercase tracking-wide">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Prep: {orderData.handoverDetails.time}m
            </span>
          )}
          {orderData.supportingRiderDetails?.[0] && (
            <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-purple-50 text-purple-700 rounded text-[10px] font-bold uppercase tracking-wide">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              Rider: {orderData.supportingRiderDetails[0]?.name?.split(" ")?.[0] || "Rider"}
            </span>
          )}
        </div>

        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em] mb-3">Order Items ({items.length})</p>
        <div className="space-y-2.5">
          {items.slice(0, 3).map((item, idx) => (
            <div key={idx} className="flex justify-between items-start text-sm group-hover:text-slate-900 transition-colors">
              <span className="text-slate-600 font-medium line-clamp-2 pr-2 leading-snug">
                <span className="text-blue-600 font-bold bg-blue-50 px-1.5 py-0.5 rounded mr-2 text-xs">{item.quantity}x</span>
                {item.name}
              </span>
              <span className="text-slate-800 font-bold whitespace-nowrap text-xs mt-0.5">{item.displayCost}</span>
            </div>
          ))}
          {items.length > 3 && (
            <div className="pt-2">
              <span className="inline-block px-2 py-1 bg-slate-50 rounded text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                + {items.length - 3} more items
              </span>
            </div>
          )}
        </div>
      </div>
      
      <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
        <span className="flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          {orderData.createdAt ? new Date(orderData.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now"}
        </span>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowCallHistory(!showCallHistory)}
            className="text-slate-500 hover:text-slate-700 font-bold tracking-wide transition-colors flex items-center gap-1"
          >
            Calls
            <svg className={`w-3.5 h-3.5 transition-transform ${showCallHistory ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
          </button>
          <button className="text-blue-600 hover:text-blue-700 font-bold tracking-wide transition-colors flex items-center gap-1">
            Details
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>
      
      {showCallHistory && (
        <OrderCallHistory callRecords={order.callRecords || []} />
      )}
    </div>
  );
}
