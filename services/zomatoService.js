import { apiClient } from "@/lib/api/client";

/**
 * Fetches order details from Zomato.
 */
export async function getOrderDetails(zomatoParams, accountKey) {
  return await apiClient({
    endpoint: "/merchant-api/orders/order-details",
    method: "GET",
    params: zomatoParams,
    headers: {
      "Referer": `${process.env.ZOMATO_API_BASE_URL}/partners/onlineordering`,
    },
    accountKey: accountKey,
  });
}

/**
 * Fetches the customer's phone number from Zomato for a specific order.
 */
export async function getCustomerContact(orderId, resId, accountKey) {
  try {
    console.log("oorderId", orderId)
    const contactData = await apiClient({
      baseURL: process.env.ZOMATO_API_BASE_URL_V2,
      endpoint: "/merchant-gw/web/order/contact/customer",
      method: "POST",
      data: {
        order_id: orderId.toString(),
        res_id: resId.toString()
      },
      headers: {
        "Referer": `${process.env.ZOMATO_API_BASE_URL_V2}/partners/onlineordering`,
      },
      accountKey: accountKey,
    });

    console.log("contactData", contactData)

    if (contactData?.status === "success" && contactData?.number) {
      return contactData.number;
    }
    return null;
  } catch (err) {
    return null;
  }
}
