export const getStatusConfig = (status) => {
  switch (status) {
    case "NEW":
      return { color: "bg-blue-50 text-blue-700 border-blue-200", dot: "bg-blue-500" };
    case "PREPARING":
      return { color: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500" };
    case "DISPATCHED":
      return { color: "bg-purple-50 text-purple-700 border-purple-200", dot: "bg-purple-500" };
    case "DELIVERED":
      return { color: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" };
    default:
      return { color: "bg-slate-100 text-slate-700 border-slate-200", dot: "bg-slate-400" };
  }
};

export const parseOrderData = (orderDoc, restaurants = []) => {
  const orderData = orderDoc.data?.order || {};
  const customer = orderData.creator || {};
  const items = orderData.cartDetails?.items?.dishes || [];
  const total = orderData.cartDetails?.total?.amountDetails?.displayCost || "₹0";
  const status = orderData.state || "UNKNOWN";
  const resId = orderData.resId;

  const populatedRes = orderDoc.restaurant || {};
  const matchingRes = restaurants.find(r => r.id?.toString() === resId?.toString()) || {};
  const resName = populatedRes.name || matchingRes.name || "Unknown";
  const resLogo = populatedRes.thumbnail || matchingRes.thumbnail || null;
  const subzone = populatedRes.subzone || matchingRes.subzone || "N/A";

  const { color: statusColor, dot: statusDot } = getStatusConfig(status);

  return {
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
    statusDot
  };
};
