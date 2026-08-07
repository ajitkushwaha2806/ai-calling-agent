"use client";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLiveOrders } from "@/hooks/useLiveOrders";
import { CDRTabContent } from "@/components/cdr/CDRTabContent";
import { fetchAccounts } from "@/services/frontend/accountService";
import { OrderStreamTable } from "@/components/orders/OrderStreamTable";
import { fetchRestaurants } from "@/services/frontend/restaurantService";
import { OrderStreamHeader } from "@/components/orders/OrderStreamHeader";

const TABS = {
  LIVE: "live",
  ALL: "all",
  CDR: "cdr"
};

const ORDER_STATES = {
  ALL: "ALL",
  NEW: "NEW",
  PREPARING: "PREPARING",
  DISPATCHED: "DISPATCHED",
  DELIVERED: "DELIVERED",
  CANCELLED: "CANCELLED"
};

const TAB_CONFIG = {
  [TABS.LIVE]: {
    title: "Live Order Stream",
    subtitle: "Manage and monitor your active incoming orders."
  },
  [TABS.ALL]: {
    title: "All Orders History",
    subtitle: "View and filter past orders."
  },
  [TABS.CDR]: {
    title: "Call Detail Records",
    subtitle: "View and monitor historical call logs from Tata Smartflo."
  }
};

export default function LiveOrdersPage() {
  const [selectedUser, setSelectedUser] = useState("");
  const [activeTab, setActiveTab] = useState(TABS.LIVE);
  const [orderStateFilter, setOrderStateFilter] = useState(ORDER_STATES.ALL);

  const { data: accounts = [], isLoading: isLoadingAccounts } = useQuery({
    queryKey: ["accounts"],
    queryFn: fetchAccounts,
  });

  const { data: restaurants = [] } = useQuery({
    queryKey: ["restaurants"],
    queryFn: fetchRestaurants,
  });

  useEffect(() => {
    if (accounts.length > 0 && !selectedUser) {
      setSelectedUser(accounts[0].key);
    }
  }, [accounts, selectedUser]);

  const { events, setEvents, dbOrders, liveOrders, connectionStatus, isManualDisconnect, toggleConnection } = useLiveOrders(selectedUser);

  const handleAccountSelect = (userKey) => {
    setEvents([]);
    setSelectedUser(userKey);
  };

  const renderTabNavigation = () => (
    <div className="w-full border-b border-slate-200 flex flex-col md:flex-row md:items-end justify-between gap-4 pb-0 mb-6">
      <div className="flex space-x-8 px-2">
        <button
          onClick={() => setActiveTab(TABS.LIVE)}
          className={`pb-4 text-sm font-semibold tracking-wide transition-colors ${activeTab === TABS.LIVE
            ? "border-b-2 border-blue-500 text-blue-600"
            : "border-b-2 border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
            }`}
        >
          Live Orders
        </button>
        <button
          onClick={() => setActiveTab(TABS.ALL)}
          className={`pb-4 text-sm font-semibold tracking-wide transition-colors ${activeTab === TABS.ALL
            ? "border-b-2 border-blue-500 text-blue-600"
            : "border-b-2 border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
            }`}
        >
          All Orders History
        </button>
        <button
          onClick={() => setActiveTab(TABS.CDR)}
          className={`pb-4 text-sm font-semibold tracking-wide transition-colors ${activeTab === TABS.CDR
            ? "border-b-2 border-blue-500 text-blue-600"
            : "border-b-2 border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
            }`}
        >
          Call Logs
        </button>
      </div>
    </div>
  );

  const renderPageHeader = () => (
    <div className="w-full bg-transparent flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          {TAB_CONFIG[activeTab]?.title}
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          {TAB_CONFIG[activeTab]?.subtitle}
        </p>
      </div>

      <div className="flex-shrink-0 flex items-center gap-4">
        <a
          href="/bull"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg text-sm font-bold transition-colors border border-purple-200 shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          Bull Dashboard
        </a>
        <OrderStreamHeader
          connectionStatus={connectionStatus}
          accounts={accounts}
          isLoadingAccounts={isLoadingAccounts}
          selectedUser={selectedUser}
          onAccountSelect={handleAccountSelect}
          isManualDisconnect={isManualDisconnect}
          toggleConnection={toggleConnection}
        />
      </div>
    </div>
  );

  const renderOrderStateTabs = (currentOrders) => {
    const states = [
      { id: ORDER_STATES.ALL, label: "All Orders" },
      { id: ORDER_STATES.NEW, label: "New" },
      { id: ORDER_STATES.PREPARING, label: "Preparing" },
      { id: ORDER_STATES.DISPATCHED, label: "Dispatched" },
      { id: ORDER_STATES.DELIVERED, label: "Delivered" },
    ];

    const getOrderCount = (stateId) => {
      if (stateId === ORDER_STATES.ALL) return currentOrders.length;
      return currentOrders.filter(o => o.data?.order?.state?.toUpperCase() === stateId).length;
    };

    return (
      <div className="flex space-x-2 p-4 border-b border-slate-100 bg-slate-50 rounded-t-2xl">
        {states.map(s => (
          <button
            key={s.id}
            onClick={() => setOrderStateFilter(s.id)}
            className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-all flex items-center gap-2 ${orderStateFilter === s.id
              ? "bg-slate-800 text-white shadow-sm"
              : "bg-white text-slate-500 border border-slate-200 hover:bg-slate-100 hover:text-slate-700"
              }`}
          >
            <span>{s.label}</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${orderStateFilter === s.id
                ? 'bg-slate-600 text-white'
                : 'bg-slate-100 text-slate-500'
              }`}>
              {getOrderCount(s.id)}
            </span>
          </button>
        ))}
      </div>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case TABS.LIVE:
        const filteredLiveOrders = liveOrders.filter(o => {
          if (orderStateFilter === ORDER_STATES.ALL) return true;
          return o.data?.order?.state?.toUpperCase() === orderStateFilter;
        });

        return (
          <div className="flex flex-col">
            {renderOrderStateTabs(liveOrders)}
            <div className="p-6">
              <OrderStreamTable orders={filteredLiveOrders} restaurants={restaurants} isRawStream={false} />
            </div>
          </div>
        );
      case TABS.ALL:
        const filteredDbOrders = dbOrders.filter(o => {
          if (orderStateFilter === ORDER_STATES.ALL) return true;
          return o.data?.order?.state?.toUpperCase() === orderStateFilter;
        });

        return (
          <div className="flex flex-col">
            {renderOrderStateTabs(dbOrders)}
            <div className="p-6">
              <OrderStreamTable orders={filteredDbOrders} restaurants={restaurants} isRawStream={false} />
            </div>
          </div>
        );
      case TABS.CDR:
        return <CDRTabContent />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 p-8 flex flex-col items-center w-full font-sans">
      <div className="w-full max-w-[1400px] mt-6 space-y-6">
        {renderTabNavigation()}
        {renderPageHeader()}

        <div className="w-full bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}
