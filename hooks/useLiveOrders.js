import { useState, useEffect } from "react";

export function useLiveOrders(selectedUser) {
  const [events, setEvents] = useState([]);
  const [dbOrders, setDbOrders] = useState([]);
  const [liveOrders, setLiveOrders] = useState([]);
  const [isManualDisconnect, setIsManualDisconnect] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("Disconnected");

  const toggleConnection = () => {
    setIsManualDisconnect(prev => !prev);
  };

  useEffect(() => {
    if (!selectedUser) {
      setDbOrders([]);
      return;
    }

    const fetchInitialOrders = async () => {
      try {
        const res = await fetch(`/api/zomato/orders?accountKey=${selectedUser}`);
        const data = await res.json();
        if (data.success && data.orders) {
          setDbOrders(data.orders);
        }
      } catch (err) {
        console.error("Failed to fetch initial orders:", err);
      }
    };
    fetchInitialOrders();
  }, [selectedUser]);

  const refetchDbOrders = async () => {
    if (!selectedUser) return;
    try {
      const res = await fetch(`/api/zomato/orders?accountKey=${selectedUser}&t=${Date.now()}`, {
        cache: 'no-store'
      });
      const data = await res.json();
      if (data.success && data.orders) {
        setDbOrders(data.orders);
      }
    } catch (err) {
      console.error("Failed to refetch orders:", err);
    }
  };

  useEffect(() => {
    if (!selectedUser || isManualDisconnect) {
      setConnectionStatus("Disconnected");
      return;
    }

    setConnectionStatus("Connecting...");
    const eventSource = new EventSource(`/api/zomato/orders/live?accountKey=${selectedUser}`);

    eventSource.onopen = () => {
      setConnectionStatus("Connected");
    };

    eventSource.onmessage = async (event) => {
      try {
        const parsedData = JSON.parse(event.data);
        console.log("Live Event:", parsedData);
        if (parsedData.type === "connected") return;

        // Add to raw events stream for debugging/logs
        setEvents(prev => [
          {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            timestamp: new Date(),
            ...parsedData
          },
          ...prev
        ].slice(0, 100));

        const isStatusUpdate = parsedData.eventName === "res_order_status_update";
        const isNewOrder = parsedData.eventName === "res_order";

        if ((isStatusUpdate || isNewOrder) && parsedData.args && parsedData.args[0]) {
          const tabId = parsedData.args[0].tabId;
          if (tabId) {
            const res = await fetch(`/api/zomato/orders/order-details?tab_id=${tabId}&accountKey=${selectedUser}`);
            const result = await res.json();

            if (result.success && result.data && result.data.order) {
              const newOrderDoc = {
                tab_id: tabId.toString(),
                userId: selectedUser,
                data: result.data,
                customer_number: result.customerNumber,
                callRecords: result.callRecords || [],
                updatedAt: new Date().toISOString()
              };

              // Update Live Orders (only items received during this session)
              setLiveOrders(prev => {
                const existingIndex = prev.findIndex(o => o.tab_id === tabId.toString());
                if (existingIndex >= 0) {
                  const newOrders = [...prev];
                  newOrders[existingIndex] = newOrderDoc;
                  return newOrders;
                } else {
                  return [newOrderDoc, ...prev];
                }
              });

              // Update DB Orders state so it reflects the latest change
              setDbOrders(prev => {
                const existingIndex = prev.findIndex(o => o.tab_id === tabId.toString());
                if (existingIndex >= 0) {
                  const newOrders = [...prev];
                  newOrders[existingIndex] = newOrderDoc;
                  return newOrders;
                } else {
                  return [newOrderDoc, ...prev];
                }
              });
            }
          }
        }
      } catch (e) {
        console.error("Failed to parse event:", e);
      }
    };

    eventSource.onerror = (err) => {
      console.error("EventSource failed:", err);
      setConnectionStatus("Disconnected");
      eventSource.close();
    };

    return () => {
      eventSource.close();
      setConnectionStatus("Disconnected");
    };
  }, [selectedUser, isManualDisconnect]);

  return {
    events,
    setEvents,
    dbOrders,
    setDbOrders,
    liveOrders,
    setLiveOrders,
    connectionStatus,
    isManualDisconnect,
    toggleConnection,
    refetchDbOrders
  };
}
