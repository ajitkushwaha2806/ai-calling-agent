import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toPng } from 'html-to-image';

const DATE_OPTIONS = [
  { id: 'tab_today', label: 'Today' },
  { id: 'tab_yesterday', label: 'Yesterday' },
  { id: 'tab_last_7_days', label: 'Last 7 Days' },
  { id: 'tab_this_month', label: 'This Month' }
];

export function RestaurantReporting({ restaurants, selectedUser }) {
  const [selectedRestaurantId, setSelectedRestaurantId] = useState('');
  const [selectedDate, setSelectedDate] = useState('tab_yesterday');
  const [isLoading, setIsLoading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [error, setError] = useState('');
  
  const reportRef = useRef(null);

  const accountRestaurants = restaurants.filter(r => r.userId === selectedUser);

  useEffect(() => {
    if (accountRestaurants.length > 0 && !selectedRestaurantId) {
      setSelectedRestaurantId(accountRestaurants[0].id);
    }
  }, [accountRestaurants, selectedRestaurantId]);

  const [sharingProgress, setSharingProgress] = useState(null);
  const isSharingAllRef = useRef(false);

  const fetchReportingData = async (restaurantId = selectedRestaurantId) => {
    if (!restaurantId || !selectedUser) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      const payload = {
        filters: [
          {
            category_name: "date_format",
            selected_values: [selectedDate],
            selected_values_meta_data: {}
          },
          {
            category_name: "restaurant",
            selected_values: [restaurantId.toString()],
            selected_values_meta_data: {}
          }
        ]
      };

      const { data } = await axios.post(`/api/zomato/reporting/get-home-data?accountKey=${selectedUser}`, payload);
      
      if (data.success) {
        setReportData(data.data);
        return true;
      } else {
        setError(data.message || 'Failed to fetch reporting data');
        return false;
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'An error occurred while fetching reporting data');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = async (restaurantId = selectedRestaurantId, skipAlert = false) => {
    if (!reportRef.current || !restaurantId) return;

    try {
      if (!skipAlert) setIsSharing(true);
      if (!skipAlert) setError('');
      
      const base64Image = await toPng(reportRef.current, {
        cacheBust: true,
        backgroundColor: '#f4f6f8',
        pixelRatio: 2
      });
      
      const dateLabel = DATE_OPTIONS.find(d => d.id === selectedDate)?.label || 'Report';

      await axios.post('/api/reporting/send-whatsapp', {
        resId: restaurantId,
        accountKey: selectedUser,
        base64Image,
        dateLabel,
      });

      if (!skipAlert) alert('Report queued successfully for WhatsApp!');
      return true;
    } catch (err) {
      console.error('Failed to share report:', err);
      if (!skipAlert) setError(err.response?.data?.message || err.message || 'Failed to share report');
      return false;
    } finally {
      if (!skipAlert) setIsSharing(false);
    }
  };

  const handleShareAll = async () => {
    const targetRestaurants = accountRestaurants.filter(r => r.whatsappChatId && r.whatsappChatId.trim() !== '');
    if (targetRestaurants.length === 0) {
      alert("No restaurants with configured WhatsApp Chat ID found.");
      return;
    }

    if (!confirm(`This will generate and share reports for ${targetRestaurants.length} restaurants. Continue?`)) return;

    isSharingAllRef.current = true;
    setIsSharing(true);
    setError('');

    let successCount = 0;
    
    try {
      for (let i = 0; i < targetRestaurants.length; i++) {
        const res = targetRestaurants[i];
        setSharingProgress({ current: i + 1, total: targetRestaurants.length, name: res.name });
        setSelectedRestaurantId(res.id);
        
        const success = await fetchReportingData(res.id);
        
        if (success) {
          // Wait for DOM to update with new data
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          if (reportRef.current) {
            const shared = await handleShare(res.id, true);
            if (shared) successCount++;
          }
        }
      }
      alert(`Successfully queued ${successCount} out of ${targetRestaurants.length} reports!`);
    } catch (err) {
      console.error('Failed to share all reports:', err);
      setError('An error occurred while sharing multiple reports');
    } finally {
      setIsSharing(false);
      setSharingProgress(null);
      isSharingAllRef.current = false;
    }
  };

  useEffect(() => {
    if (selectedRestaurantId && selectedUser && !isSharingAllRef.current) {
      fetchReportingData();
    }
  }, [selectedRestaurantId, selectedDate, selectedUser]);

  return (
    <div className="p-6 w-full max-w-6xl mx-auto flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Business Reporting</h2>
          <p className="text-sm text-slate-500 mt-1">Analytics and insights from Zomato Owner Hub</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <div className="relative">
            <select
              className="appearance-none bg-slate-50 border border-slate-200 text-slate-700 text-sm font-medium rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block w-full px-4 py-2.5 pr-10 cursor-pointer"
              value={selectedRestaurantId}
              onChange={(e) => setSelectedRestaurantId(e.target.value)}
              disabled={isLoading || isSharing}
            >
              {accountRestaurants.length === 0 ? (
                <option value="">No restaurants found</option>
              ) : (
                accountRestaurants.map((res) => (
                  <option key={res.id} value={res.id}>
                    {res.name} {res.subzone ? `(${res.subzone})` : ''}
                  </option>
                ))
              )}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Date Selector */}
          <div className="relative">
            <select
              className="appearance-none bg-slate-50 border border-slate-200 text-slate-700 text-sm font-medium rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block w-full px-4 py-2.5 pr-10 cursor-pointer"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              disabled={isLoading || isSharing}
            >
              {DATE_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>{opt.label}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          
          <button 
            onClick={() => fetchReportingData()}
            disabled={isLoading || !selectedRestaurantId || isSharing}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl font-medium text-sm transition-colors disabled:opacity-50 border border-blue-100"
          >
            <svg className={`w-4 h-4 ${isLoading && !isSharing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
          
          <div className="flex bg-green-500 rounded-xl shadow-sm border border-green-600 overflow-hidden divide-x divide-green-600/30">
            <button 
              onClick={() => handleShare()}
              disabled={isLoading || isSharing || !reportData || !selectedRestaurantId}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-green-500 hover:bg-green-600 text-white font-medium text-sm whitespace-nowrap transition-colors disabled:opacity-50"
            >
              {isSharing && !sharingProgress ? (
                <svg className="w-4 h-4 animate-spin flex-shrink-0" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              )}
              {isSharing && !sharingProgress ? 'Generating...' : 'Share'}
            </button>
            <button
              onClick={handleShareAll}
              disabled={isLoading || isSharing || accountRestaurants.length === 0}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-green-500 hover:bg-green-600 text-white font-medium text-sm whitespace-nowrap transition-colors disabled:opacity-50"
              title="Share reports for all outlets with configured chat IDs"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              All Outlets
            </button>
          </div>
        </div>
      </div>

      {sharingProgress && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 animate-spin text-blue-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="font-medium text-sm">
              Processing {sharingProgress.current} of {sharingProgress.total}: <span className="font-bold">{sharingProgress.name}</span>
            </p>
          </div>
          <div className="text-sm font-bold text-blue-600">
            {Math.round((sharingProgress.current / sharingProgress.total) * 100)}%
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-grow overflow-auto relative">
        {error && (
          <div className="absolute top-4 left-4 right-4 z-10 bg-red-50 text-red-600 px-4 py-3 rounded-lg border border-red-200 shadow-sm flex items-start gap-3">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {isLoading ? (
          <div className="w-full h-full min-h-[400px] flex flex-col items-center justify-center text-slate-400 p-8">
            <svg className="w-8 h-8 animate-spin mb-4 text-blue-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="font-medium animate-pulse">Fetching reporting data from Zomato...</p>
          </div>
        ) : reportData && reportData.results ? (
          <div ref={reportRef} className="p-4 md:p-6 bg-[#f4f6f8] min-h-[600px] font-sans">
            <div className="flex flex-col gap-4 max-w-5xl mx-auto">
              {reportData.results.map((result, index) => {
                // 1. Handle Text Snippets (Header Text)
                if (result.text_snippet_type_1) {
                  const textData = result.text_snippet_type_1.title;
                  return (
                    <div key={index} className="text-center mb-2 px-4">
                      <p className="text-xs text-indigo-500 font-medium tracking-wide">
                        {textData?.text || "Info"}
                      </p>
                    </div>
                  );
                }

                // 2. Handle Line Graph / Metric Cards (Sections)
                if (result.line_graph_snippet_type_3) {
                  const section = result.line_graph_snippet_type_3;
                  const topContainer = section.top_container || {};
                  const title = topContainer.title?.text || "Metrics";
                  const iconUrl = topContainer.image?.url;
                  const rightButton = topContainer.right_button;
                  const items = section.items || [];

                  return (
                    <div key={index} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
                      {/* Section Header */}
                      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
                        <div className="flex items-center gap-2">
                          {iconUrl ? (
                            <img src={iconUrl} alt="icon" className="w-5 h-5 object-contain" />
                          ) : (
                            <div className="w-5 h-5 rounded flex items-center justify-center bg-slate-100">
                              <span className="text-[10px]">📊</span>
                            </div>
                          )}
                          <h3 className="text-[15px] font-bold text-slate-800">{title}</h3>
                        </div>
                        {rightButton && (
                          <button className="text-sm text-blue-600 font-medium hover:text-blue-700 flex items-center gap-1">
                            {rightButton.text}
                            {rightButton.suffix_icon && (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                            )}
                          </button>
                        )}
                      </div>

                      {/* Section Items (List View) */}
                      <div className="flex flex-col">
                        {items.map((item, idx) => {
                          const itemTitle = item.title?.text;
                          const isHeaderOnly = !item.subtitle && !item.line_graph_data; // e.g. "Bad orders" header
                          
                          if (isHeaderOnly) {
                            return (
                              <div key={idx} className="px-5 py-3 border-b border-slate-100 bg-slate-50/50">
                                <span className="text-[13px] font-semibold text-slate-600">{itemTitle}</span>
                              </div>
                            );
                          }

                          const value = item.subtitle?.text || item.right_sub_tag?.title?.text || "-";
                          
                          // Handle change badges
                          let change = null;
                          let changeClass = "text-slate-500 bg-slate-100 border-slate-200";
                          let changeIcon = null;

                          // Try to find change indicator in subtitle2 or right_sub_tag
                          const changeObj = item.subtitle2 || item.right_sub_tag?.title;
                          if (changeObj && changeObj.text) {
                            change = changeObj.text;
                            const tintType = changeObj.color?.type || "grey";
                            if (tintType === "green") {
                              changeClass = "text-emerald-700 bg-[#e6f4ea] border-transparent";
                              changeIcon = <svg className="w-2.5 h-2.5 ml-1 inline" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" /></svg>;
                            } else if (tintType === "red") {
                              changeClass = "text-red-700 bg-[#fce8e6] border-transparent";
                              changeIcon = <svg className="w-2.5 h-2.5 ml-1 inline" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>;
                            } else {
                               changeIcon = null;
                            }
                          }

                          // Sparkline rendering
                          const graphItems = item.line_graph_data?.items || [];
                          const hasGraph = graphItems.length > 0;
                          
                          let sparkline = null;
                          if (hasGraph) {
                            // Extract max Y to scale the graph
                            const yValues = graphItems.map(g => parseFloat(g.display_yAxis) || 0);
                            const maxY = Math.max(...yValues, 1); // Avoid division by 0
                            
                            // Dimensions for mini sparkline (width 120, height 24)
                            const width = 120;
                            const height = 24;
                            const paddingY = 4;
                            
                            const points = graphItems.map((g, i) => {
                              const x = (i / (graphItems.length - 1)) * width;
                              const val = parseFloat(g.display_yAxis) || 0;
                              // Invert Y axis for SVG (0 is top)
                              const normalizedY = (val / maxY);
                              const y = height - paddingY - (normalizedY * (height - (paddingY * 2)));
                              return `${x},${y}`;
                            }).join(" ");

                            sparkline = (
                              <svg className="w-[120px] h-[24px] overflow-visible" viewBox={`0 0 ${width} ${height}`}>
                                {/* Gradient Fill */}
                                <defs>
                                  <linearGradient id={`grad-${index}-${idx}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#e0e7ff" stopOpacity="0.8" />
                                    <stop offset="100%" stopColor="#ffffff" stopOpacity="0.1" />
                                  </linearGradient>
                                </defs>
                                <polyline
                                  fill={`url(#grad-${index}-${idx})`}
                                  stroke="none"
                                  points={`0,${height} ${points} ${width},${height}`}
                                />
                                {/* Line */}
                                <polyline
                                  fill="none"
                                  stroke="#3b82f6"
                                  strokeWidth="1.5"
                                  points={points}
                                />
                                {/* Dots */}
                                {graphItems.map((g, i) => {
                                  const x = (i / (graphItems.length - 1)) * width;
                                  const val = parseFloat(g.display_yAxis) || 0;
                                  const normalizedY = (val / maxY);
                                  const y = height - paddingY - (normalizedY * (height - (paddingY * 2)));
                                  return (
                                    <circle key={i} cx={x} cy={y} r="1.5" fill="#2563eb" />
                                  );
                                })}
                              </svg>
                            );
                          }

                          return (
                            <div key={idx} className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 last:border-b-0 hover:bg-slate-50 transition-colors">
                              {/* Left: Title */}
                              <div className="w-[200px] flex-shrink-0">
                                <span className="text-[13px] text-slate-600 font-medium">{itemTitle}</span>
                              </div>

                              {/* Middle: Sparkline */}
                              <div className="flex-grow flex items-center justify-center">
                                {sparkline}
                              </div>

                              {/* Right: Value & Change */}
                              <div className="w-[180px] flex items-center justify-end gap-4 flex-shrink-0">
                                <span className="text-[13px] font-bold text-slate-800 tabular-nums">{value}</span>
                                {change && (
                                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold border flex items-center min-w-[50px] justify-center ${changeClass}`}>
                                    {change}
                                    {changeIcon}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                }

                return null;
              })}
            </div>
          </div>
        ) : (
          <div className="w-full h-full min-h-[400px] flex flex-col items-center justify-center text-slate-400 p-8">
            <svg className="w-12 h-12 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="font-medium">Select a restaurant and date to view reporting data</p>
          </div>
        )}
      </div>
    </div>
  );
}
