"use client";

import React, { useState, useEffect } from "react";
import { Calendar as CalendarIcon, X, RefreshCw, Download } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export default function AnalyticsClient() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Date filters
  const initialDate = new Date();
  
  const [startDate, setStartDate] = useState(format(initialDate, "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(initialDate, "yyyy-MM-dd"));

  const [date, setDate] = useState({
    from: initialDate,
    to: undefined,
  });

  useEffect(() => {
    if (date?.from) {
      setStartDate(format(date.from, "yyyy-MM-dd"));
    } else {
      setStartDate("");
    }
    if (date?.to) {
      setEndDate(format(date.to, "yyyy-MM-dd"));
    } else if (date?.from) {
      // If only one date is selected, use it as both start and end to filter for a single day
      setEndDate(format(date.from, "yyyy-MM-dd"));
    } else {
      setEndDate("");
    }
  }, [date]);

  useEffect(() => {
    fetchData();
  }, [startDate, endDate]);

  const [queueing, setQueueing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleDownloadPDF = async () => {
    setIsExporting(true);
    try {
      const html2canvas = (await import("html2canvas-pro")).default;
      const { jsPDF } = await import("jspdf");

      const element = document.getElementById("analytics-dashboard-content");
      if (!element) {
        alert("Dashboard content not found.");
        return;
      }

      const canvas = await html2canvas(element, {
        scale: 2, // higher resolution
        useCORS: true,
        backgroundColor: "#0a0a0a", // dark background matching neutral-950
        logging: false,
        scrollX: 0,
        scrollY: 0,
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.getElementById("analytics-dashboard-content");
          if (clonedElement) {
            clonedElement.style.width = "auto";
            clonedElement.style.height = "auto";
            clonedElement.style.overflow = "visible";
            clonedElement.style.maxWidth = "none";
            clonedElement.style.maxHeight = "none";
          }
          const scrollContainers = clonedDoc.querySelectorAll(".overflow-x-auto, .overflow-hidden");
          scrollContainers.forEach((container) => {
            container.style.overflow = "visible";
            container.style.width = "auto";
            container.style.maxWidth = "none";
          });
        }
      });

      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Calculate how many pixels fit in one PDF page height
      const pxPageHeight = Math.floor(canvas.width * (pdfHeight / pdfWidth));
      
      let heightLeft = canvas.height;
      let sY = 0; // source Y coordinate on main canvas
      let pageNum = 0;

      while (heightLeft > 0) {
        const sHeight = Math.min(pxPageHeight, heightLeft);
        
        // Create a temporary canvas for the current page slice
        const pageCanvas = document.createElement("canvas");
        pageCanvas.width = canvas.width;
        pageCanvas.height = pxPageHeight;
        
        const pageCtx = pageCanvas.getContext("2d");
        // Fill background with dashboard color
        pageCtx.fillStyle = "#0a0a0a";
        pageCtx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
        
        // Draw the slice of the main canvas onto the page canvas
        pageCtx.drawImage(
          canvas,
          0, sY, canvas.width, sHeight, // source rect
          0, 0, canvas.width, sHeight  // destination rect
        );

        const pageImgData = pageCanvas.toDataURL("image/png");
        
        if (pageNum > 0) {
          pdf.addPage();
        }
        
        pdf.addImage(pageImgData, "PNG", 0, 0, pdfWidth, pdfHeight, undefined, "FAST");
        
        sY += pxPageHeight;
        heightLeft -= pxPageHeight;
        pageNum++;
      }
      
      let filename = "restaurant-analytics";
      if (startDate && endDate) {
        filename += `-${startDate}-to-${endDate}`;
      } else if (startDate) {
        filename += `-${startDate}`;
      }
      pdf.save(`${filename}.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleQueueRatings = async () => {
    if (!startDate || !endDate) {
      alert("Please select a date range first.");
      return;
    }
    setQueueing(true);
    try {
      const res = await fetch(`/api/analytics/queue-ratings?startDate=${startDate}&endDate=${endDate}`, {
        method: "POST"
      });
      const json = await res.json();
      if (json.success) {
        alert(`Successfully enqueued ${json.enqueuedCount} rating fetch jobs!`);
      } else {
        alert(json.error || "Failed to queue rating fetch jobs.");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred while queueing rating fetch jobs.");
    } finally {
      setQueueing(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      let url = "/api/analytics";
      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const res = await fetch(url);
      const json = await res.json();
      
      if (json.success) {
        setData(json.data);
      } else {
        setError(json.error || "Failed to load data");
      }
    } catch (err) {
      console.error(err);
      setError("An error occurred while fetching data.");
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setDate({ from: undefined, to: undefined });
  };

  return (
    <div id="analytics-dashboard-content" className="space-y-8 p-1">
      {/* Filters Section */}
      <div className="bg-neutral-900/50 backdrop-blur-xl border border-neutral-800 rounded-2xl p-6 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-medium text-white mb-1">Analytics Dashboard</h2>
          <p className="text-sm text-neutral-400">Track your order metrics and ratings</p>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant={"outline"}
                className={cn(
                  "w-full sm:w-[300px] justify-start text-left font-normal bg-neutral-950 border-neutral-800 text-neutral-200 hover:bg-neutral-900 hover:text-white",
                  !date && "text-neutral-400"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4 text-orange-500" />
                {date?.from ? (
                  date.to ? (
                    <>
                      {format(date.from, "LLL dd, y")} -{" "}
                      {format(date.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(date.from, "LLL dd, y")
                  )
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 border-neutral-800 bg-neutral-950 text-neutral-200" align="end">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={date?.from}
                selected={date}
                onSelect={setDate}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>

          {(date?.from || date?.to) && (
            <Button 
              variant="ghost" 
              size="icon"
              onClick={clearFilters}
              className="text-neutral-400 hover:text-white hover:bg-neutral-800"
              title="Clear Dates"
              data-html2canvas-ignore="true"
            >
              <X className="h-4 w-4" />
            </Button>
          )}

          <Button
            onClick={handleQueueRatings}
            disabled={queueing || !startDate || !endDate}
            className="bg-orange-500 hover:bg-orange-600 text-white font-medium border-0 gap-2 px-4 py-2 rounded-lg"
            data-html2canvas-ignore="true"
          >
            {queueing ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                Sync Ratings
              </>
            )}
          </Button>

          <Button
            onClick={handleDownloadPDF}
            disabled={isExporting || loading || data.length === 0}
            className="bg-neutral-800 hover:bg-neutral-700 text-white font-medium border border-neutral-700 gap-2 px-4 py-2 rounded-lg"
            data-html2canvas-ignore="true"
          >
            {isExporting ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Download PDF
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Aggregate Stats Section */}
      {data.length > 0 && !loading && !error && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-9 gap-4">
          {[
            { label: "Total Calls", value: data.reduce((acc, item) => acc + (item.totalCalls || 0), 0), color: "text-neutral-200" },
            { label: "Accepted", value: data.reduce((acc, item) => acc + (item.acceptedCalls || 0), 0), color: "text-green-400" },
            { label: "Rejected", value: data.reduce((acc, item) => acc + (item.rejectedCalls || 0), 0), color: "text-red-400" },
            { label: "Ratings", value: data.reduce((acc, item) => acc + (item.ratingsReceived || 0), 0), color: "text-blue-400" },
            { label: "5⭐", value: data.reduce((acc, item) => acc + (item.rating5 || 0), 0), color: "text-green-300" },
            { label: "4⭐", value: data.reduce((acc, item) => acc + (item.rating4 || 0), 0), color: "text-emerald-300" },
            { label: "3⭐", value: data.reduce((acc, item) => acc + (item.rating3 || 0), 0), color: "text-yellow-300" },
            { label: "2⭐", value: data.reduce((acc, item) => acc + (item.rating2 || 0), 0), color: "text-orange-300" },
            { label: "1⭐", value: data.reduce((acc, item) => acc + (item.rating1 || 0), 0), color: "text-red-300" },
          ].map((stat, idx) => (
            <div key={idx} className="bg-neutral-900/50 backdrop-blur-xl border border-neutral-800 rounded-2xl p-4 flex flex-col items-center justify-center shadow-lg">
              <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">{stat.label}</span>
              <span className={`text-2xl font-bold ${stat.color}`}>{stat.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Table Section */}
      <div className="bg-neutral-900/50 backdrop-blur-xl border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          </div>
        ) : error ? (
          <div className="p-12 text-center text-red-400">
            <p>{error}</p>
          </div>
        ) : data.length === 0 ? (
          <div className="p-12 text-center text-neutral-500">
            <p>No analytics data found for the selected period.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-neutral-300 whitespace-nowrap">
              <thead className="bg-neutral-950/50 uppercase font-medium text-neutral-400 tracking-wider">
                <tr>
                  <th className="px-6 py-4 w-16 text-center">S.No.</th>
                  <th className="px-6 py-4">Restaurant Name</th>
                  <th className="px-6 py-4 text-center">Calls Done</th>
                  <th className="px-6 py-4 text-center">Accepted</th>
                  <th className="px-6 py-4 text-center">Rejected</th>
                  <th className="px-6 py-4 text-center">Ratings Received</th>
                  <th className="px-4 py-4 text-center">5⭐</th>
                  <th className="px-4 py-4 text-center">4⭐</th>
                  <th className="px-4 py-4 text-center">3⭐</th>
                  <th className="px-4 py-4 text-center">2⭐</th>
                  <th className="px-4 py-4 text-center">1⭐</th>
                  <th className="px-6 py-4 text-right">Acceptance Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/50">
                {data.map((item, index) => {
                  const rate = item.totalCalls > 0 
                    ? ((item.acceptedCalls / item.totalCalls) * 100).toFixed(1) 
                    : "0.0";
                  
                  return (
                    <tr 
                      key={item._id} 
                      className="hover:bg-neutral-800/20 transition-colors group"
                    >
                      <td className="px-6 py-4 text-center text-neutral-500 font-medium">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4 font-medium text-white flex items-center gap-3">
                        {item.thumbnail ? (
                          <img src={item.thumbnail} alt="" className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center text-orange-500 font-bold">
                            {item.restaurantName.charAt(0)}
                          </div>
                        )}
                        {item.restaurantName}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full bg-neutral-800/50 text-neutral-300 border border-neutral-700/50">
                          {item.totalCalls}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                          {item.acceptedCalls}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                          {item.rejectedCalls}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-neutral-200">
                        {item.ratingsReceived}
                      </td>
                      <td className="px-4 py-4 text-center">
                        {item.rating5 > 0 ? (
                          <span className="inline-flex items-center justify-center px-2.5 py-1 rounded bg-green-500/20 text-green-300">
                            {item.rating5}
                          </span>
                        ) : <span className="text-neutral-600">-</span>}
                      </td>
                      <td className="px-4 py-4 text-center">
                        {item.rating4 > 0 ? (
                          <span className="inline-flex items-center justify-center px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300">
                            {item.rating4}
                          </span>
                        ) : <span className="text-neutral-600">-</span>}
                      </td>
                      <td className="px-4 py-4 text-center">
                        {item.rating3 > 0 ? (
                          <span className="inline-flex items-center justify-center px-2.5 py-1 rounded bg-yellow-500/20 text-yellow-300">
                            {item.rating3}
                          </span>
                        ) : <span className="text-neutral-600">-</span>}
                      </td>
                      <td className="px-4 py-4 text-center">
                        {item.rating2 > 0 ? (
                          <span className="inline-flex items-center justify-center px-2.5 py-1 rounded bg-orange-500/20 text-orange-300">
                            {item.rating2}
                          </span>
                        ) : <span className="text-neutral-600">-</span>}
                      </td>
                      <td className="px-4 py-4 text-center">
                        {item.rating1 > 0 ? (
                          <span className="inline-flex items-center justify-center px-2.5 py-1 rounded bg-red-500/20 text-red-300">
                            {item.rating1}
                          </span>
                        ) : <span className="text-neutral-600">-</span>}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-sm font-medium text-neutral-300">{rate}%</span>
                          <div className="w-24 h-1.5 rounded-full bg-neutral-800 overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full"
                              style={{ width: `${rate}%` }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
