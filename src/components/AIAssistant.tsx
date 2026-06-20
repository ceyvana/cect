import React, { useState, useEffect } from "react";
import { 
  Sparkles, Send, TrendingUp, DollarSign, Cpu, Clock, 
  SendHorizontal, Mail, PhoneCall, Loader2, CheckCircle2, 
  RefreshCw, AlertTriangle, Play, HelpCircle, Layers
} from "lucide-react";
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  Tooltip, CartesianGrid, BarChart, Bar, Legend 
} from "recharts";
import { DbSchema, AIState } from "../types";

interface AIAssistantProps {
  db: DbSchema;
  triggerDbRefresh: () => void;
}

export default function AIAssistant({ db, triggerDbRefresh }: AIAssistantProps) {
  const [activeTab, setActiveTab] = useState<"copilot" | "forecast" | "profit" | "planning" | "weekly">("copilot");
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [copilotResponses, setCopilotResponses] = useState<{ query: string; response: string; time: string }[]>([]);
  
  const [aiState, setAiState] = useState<AIState>({
    forecasting: null,
    profitAnalysis: null,
    productionPlanning: null,
  });

  const [weeklyReport, setWeeklyReport] = useState<{
    text: string;
    log: string;
    email: string;
    whatsapp: string;
    timestamp: string;
  } | null>(null);

  const [weeklyLoading, setWeeklyLoading] = useState(false);

  // Pre-configured expert quick queries
  const quickPrompts = [
    "What spice raw materials are below safety stock levels, and which suppliers have outstanding balances?",
    "Review CEYVANA's current accounts receivable. Who has exceeded their credit limits?",
    "Outline a wholesale margin optimization strategy for Ceylon Cinnamon Alba.",
    "Formulate a production schedule based on current customer pending invoices."
  ];

  // Load Forecast, Margins, and Plans from Express Gemini endpoints
  const fetchAIPredictions = async () => {
    setLoading(true);
    try {
      const [forecastRes, profitRes, planRes] = await Promise.all([
        fetch("/api/ai/forecast", { method: "POST" }),
        fetch("/api/ai/profit-analysis", { method: "POST" }),
        fetch("/api/ai/production-planning", { method: "POST" }),
      ]);
      
      const forecasting = await forecastRes.json();
      const profitAnalysis = await profitRes.json();
      const productionPlanning = await planRes.json();

      setAiState({ forecasting, profitAnalysis, productionPlanning });
    } catch (err) {
      console.error("Failed loading AI analytics datasets:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAIPredictions();
  }, []);

  const handleCopilotSend = async (queryText?: string) => {
    const finalQuery = queryText || prompt;
    if (!finalQuery.trim()) return;

    setLoading(true);
    if (!queryText) setPrompt("");
    try {
      const res = await fetch("/api/ai/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: finalQuery })
      });
      const data = await res.json();
      setCopilotResponses(prev => [
        ...prev,
        {
          query: finalQuery,
          response: data.text,
          time: new Date().toLocaleTimeString()
        }
      ]);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const dispatchWeeklyBriefing = async () => {
    setWeeklyLoading(true);
    try {
      const res = await fetch("/api/ai/weekly-report", { method: "POST" });
      const data = await res.json();
      setWeeklyReport({
        text: data.reportText,
        log: data.logDetails,
        email: data.email,
        whatsapp: data.whatsapp,
        timestamp: new Date(data.timestamp).toLocaleString()
      });
    } catch (err) {
      console.error(err);
    } finally {
      setWeeklyLoading(false);
    }
  };

  return (
    <div className="bg-brand-cream/40 p-4 lg:p-6 rounded-2xl border border-brand-gold/10 shadow-sm" id="ai-assistant-root">
      
      {/* Title block with sparkles */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 pb-4 border-b border-brand-gold/10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-brand-green text-brand-gold rounded-xl shadow-md">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-display font-bold text-brand-darkgreen tracking-tight">CEYVANA AI Intelligent Suite</h2>
            <p className="text-xs text-brand-charcoal/60">Ceylon spice market forecaster, batch resources planner & automated weekly dispatcher</p>
          </div>
        </div>
        <button 
          onClick={fetchAIPredictions}
          disabled={loading}
          className="mt-3 md:mt-0 flex items-center gap-2 text-xs bg-brand-green/5 text-brand-midgreen hover:bg-brand-green/10 border border-brand-green/20 px-4 py-2 rounded-xl transition duration-200"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Recalculate AI Datasets
        </button>
      </div>

      {/* Tab bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-6">
        {[
          { key: "copilot", label: "AI Co-Pilot", icon: Cpu },
          { key: "forecast", label: "Sales Forecast", icon: TrendingUp },
          { key: "profit", label: "Profit Audit", icon: DollarSign },
          { key: "planning", label: "Production Plan", icon: Layers },
          { key: "weekly", label: "Weekly Dispatch", icon: Clock },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs font-medium border transition-all duration-200 ${
                isActive 
                  ? "bg-brand-green text-brand-gold border-brand-green shadow-sm shadow-brand-green/20" 
                  : "bg-white text-brand-charcoal/80 border-gray-200 hover:border-brand-gold/40 hover:bg-gray-50"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-brand-gold" : "text-brand-midgreen/70"}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Main UI body */}
      {loading && !aiState.forecasting && (
        <div className="flex flex-col items-center justify-center py-20 bg-white/75 rounded-2xl border border-gray-100">
          <Loader2 className="w-10 h-10 text-brand-gold animate-spin mb-3" />
          <p className="text-sm font-medium text-brand-darkgreen">Engaging CEYVANA AI Processing Platform...</p>
          <p className="text-xs text-brand-charcoal/50 mt-1">Sourcing real-time spice sales matrix and grinding batch indices</p>
        </div>
      )}

      {/* Content panes */}
      {!loading || aiState.forecasting ? (
        <div className="space-y-6">
          
          {/* 1. CO-PILOT CHAT */}
          {activeTab === "copilot" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left query tools */}
              <div className="lg:col-span-1 space-y-4">
                <div className="bg-brand-green text-brand-cream p-5 rounded-xl border border-brand-gold/20 shadow-md">
                  <h4 className="font-display font-semibold text-brand-gold text-sm flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-brand-gold" />
                    How to query CEYVANA AI:
                  </h4>
                  <p className="text-xs text-brand-cream/80 leading-relaxed mt-2">
                    Enter any question about raw spice stocks, outstanding wholesale accounts, recipe formulation costs, or batch completion status. CEYVANA AI crawls the live database to give targeted advice.
                  </p>
                  
                  <div className="mt-4 border-t border-brand-cream/10 pt-4">
                    <h5 className="text-[11px] uppercase tracking-wider font-semibold text-brand-gold">Fast Accelerators:</h5>
                    <div className="space-y-2 mt-2">
                      {quickPrompts.map((q, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            setPrompt(q);
                            handleCopilotSend(q);
                          }}
                          className="w-full text-left bg-white/5 hover:bg-white/10 p-2 rounded-lg text-[11px] text-brand-cream/90 transition border border-white/5 line-clamp-2 leading-snug"
                        >
                          "{q}"
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Chat frame */}
              <div className="lg:col-span-2 flex flex-col h-[500px] bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                
                {/* Chat window Header */}
                <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-brand-emerald animate-pulse"></div>
                    <span className="text-xs font-semibold text-brand-darkgreen">Interactive Executive Session</span>
                  </div>
                  <span className="text-[10px] bg-brand-green/10 text-brand-green px-2 py-0.5 rounded-md font-mono">GEMINI-3.5-FLASH</span>
                </div>

                {/* Dialog Messages */}
                <div className="flex-1 p-4 overflow-y-auto space-y-4">
                  {copilotResponses.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6">
                      <Cpu className="w-10 h-10 text-brand-gold/60 mb-2" />
                      <p className="text-sm font-medium text-brand-darkgreen">CEYVANA Co-Pilot Ready</p>
                      <p className="text-xs text-brand-charcoal/50 max-w-sm mt-1">
                        Select an accelerator on the left card or start typing below to conduct a deep spice sector financial analysis.
                      </p>
                    </div>
                  ) : (
                    copilotResponses.map((item, idx) => (
                      <div key={idx} className="space-y-2">
                        {/* User request bubble */}
                        <div className="flex justify-end">
                          <div className="bg-brand-green/5 border border-brand-green/10 text-brand-darkgreen px-4 py-2.5 rounded-2xl rounded-tr-none text-xs max-w-[85%]">
                            <p className="font-medium text-brand-gold-dark text-[10px] mb-0.5">YOU</p>
                            <p className="leading-relaxed">{item.query}</p>
                          </div>
                        </div>
                        {/* Gemini Response */}
                        <div className="flex justify-start">
                          <div className="bg-brand-cream/30 border border-brand-gold/25 text-brand-charcoal px-4 py-3 rounded-2xl rounded-tl-none text-xs max-w-[85%] shadow-sm">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="font-display font-bold text-brand-midgreen text-[10px] flex items-center gap-1">
                                <Sparkles className="w-3 h-3 text-brand-gold" />
                                CEYVANA INTEL AGENT
                              </span>
                              <span className="text-[8px] text-brand-charcoal/40">{item.time}</span>
                            </div>
                            <div className="prose prose-xs max-w-none text-brand-charcoal/90 whitespace-pre-line leading-relaxed">
                              {item.response}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  {loading && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 border border-gray-200 text-brand-charcoal px-4 py-3 rounded-2xl rounded-tl-none text-xs flex items-center gap-2">
                        <Loader2 className="w-3.5 h-3.5 text-brand-gold animate-spin" />
                        <span className="text-xs font-medium text-brand-charcoal/60">CEYVANA Brain formulating compliance digest...</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Input slot */}
                <div className="p-3 border-t border-gray-200 bg-gray-50 flex items-center gap-2">
                  <input
                    type="text"
                    value={prompt}
                    onChange={e => setPrompt(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleCopilotSend()}
                    placeholder="Ask standard questions (e.g. 'How much Turmeric is scheduled to expire in 2027?')"
                    className="flex-1 bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-xs focus:ring-1 focus:ring-brand-gold focus:border-brand-gold outline-none text-brand-charcoal"
                  />
                  <button
                    onClick={() => handleCopilotSend()}
                    disabled={loading || !prompt.trim()}
                    className="p-2.5 bg-brand-green text-brand-gold hover:bg-brand-darkgreen disabled:opacity-50 rounded-xl transition shadow-sm"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>

              </div>

            </div>
          )}

          {/* 2. SALES DEMAND FORECASTING */}
          {activeTab === "forecast" && aiState.forecasting && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left stats column */}
              <div className="lg:col-span-1 space-y-4">
                
                {/* Projected growth */}
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                  <h4 className="text-xs uppercase tracking-wider font-bold text-brand-darkgreen mb-3">AI Spice Best-Sellers Growth</h4>
                  <div className="space-y-3">
                    {aiState.forecasting.bestSellers.map((item, id) => (
                      <div key={id} className="p-3 bg-brand-cream/25 border border-brand-gold/10 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-brand-darkgreen line-clamp-1">{item.name}</span>
                          <span className="text-xs font-mono font-extrabold text-brand-emerald bg-brand-emerald/10 px-2 py-0.5 rounded">
                            +{item.projectedGrowthPercent}%
                          </span>
                        </div>
                        <p className="text-[11px] text-brand-charcoal/60 mt-1 leading-snug">{item.explanation}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Material replenishment alerts */}
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                  <h4 className="text-xs uppercase tracking-wider font-bold text-brand-darkgreen mb-3 flex items-center justify-between">
                    AI Reorder Demands
                    <span className="text-[10px] font-normal text-brand-charcoal/50">Urgent purchasing</span>
                  </h4>
                  <div className="space-y-2">
                    {aiState.forecasting.requiredReprocurement.map((item, id) => (
                      <div key={id} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg text-xs">
                        <div>
                          <p className="font-semibold text-brand-darkgreen">{item.materialName}</p>
                          <p className="text-[10px] text-brand-charcoal/50">Target Purchase: <span className="font-bold text-brand-charcoal">{item.forecastRequiredKg} kg</span></p>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                          item.priority === "High" 
                            ? "bg-red-100 text-red-800" 
                            : item.priority === "Medium"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-green-100 text-green-800"
                        }`}>
                          {item.priority}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Chart of future demand */}
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                  <div>
                    <h3 className="text-sm font-bold text-brand-darkgreen">Projected Sales Demand Trend (3-Month Wave)</h3>
                    <p className="text-xs text-brand-charcoal/50 mb-4">Forecasting wholesale turnover (LKR) under normal vs. peak tourist spice export seasons</p>
                  </div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={aiState.forecasting.salesForecastData}>
                        <defs>
                          <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#0b4625" stopOpacity={0.6}/>
                            <stop offset="95%" stopColor="#0b4625" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorOptimistic" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#d4af37" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#d4af37" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                        <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={v => `LKR ${(v / 1000000).toFixed(1)}M`} />
                        <Tooltip formatter={(value: any) => [`LKR ${value.toLocaleString()}`, "Profit/Revenue"]} />
                        <Legend />
                        <Area type="monotone" dataKey="forecastSalesLkr" name="Forecast Demand" stroke="#0b4625" strokeWidth={2} fillOpacity={1} fill="url(#colorForecast)" />
                        <Area type="monotone" dataKey="optimisticSalesLkr" name="Export Expansion Peak" stroke="#d4af37" strokeWidth={2} fillOpacity={1} fill="url(#colorOptimistic)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Additional Strategic suggestions list */}
                <div className="bg-brand-cream/35 p-4 rounded-xl border border-brand-gold/15">
                  <h4 className="text-xs uppercase tracking-wider font-bold text-brand-midgreen flex items-center gap-1 mb-2">
                    <AlertTriangle className="w-4 h-4 text-brand-gold" />
                    AI Monsoon & Seasonal Market Directives
                  </h4>
                  <ul className="list-disc list-inside space-y-1.5 text-xs text-brand-charcoal/80 pl-1 leading-relaxed">
                    {aiState.forecasting.strategicOpportunities.map((op, i) => (
                      <li key={i} className="pl-1"><span className="text-brand-darkgreen font-semibold">{op}</span></li>
                    ))}
                  </ul>
                </div>
              </div>

            </div>
          )}

          {/* 3. PROFIT & MARGIN AUDIT */}
          {activeTab === "profit" && aiState.profitAnalysis && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Executive summary block */}
              <div className="lg:col-span-1 space-y-4">
                
                {/* Health Score Dial */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm text-center">
                  <span className="text-[10px] uppercase tracking-widest text-brand-charcoal/50 font-bold">CEYVANA Health Score</span>
                  <div className="my-4 relative flex items-center justify-center">
                    <div className="w-28 h-28 rounded-full border-8 border-brand-green/10 flex items-center justify-center">
                      <div className="text-center">
                        <span className="text-3xl font-display font-extrabold text-brand-darkgreen">
                          {aiState.profitAnalysis.businessHealthScore}
                        </span>
                        <span className="text-brand-gold font-bold text-xs">/100</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs font-semibold text-brand-emerald bg-brand-emerald/10 py-1.5 px-3 rounded-lg inline-block">
                    PROSTHETIC LEVEL: EXTREMELY STABLE
                  </p>
                  <p className="text-[11px] text-brand-charcoal/50 mt-3 leading-snug">
                    Calculated based on low product margin leakages, active cash ratio, and general lead times in Matale spice farms.
                  </p>
                </div>

                {/* Inefficiency leakages */}
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                  <h4 className="text-xs uppercase tracking-wider font-bold text-red-800 mb-3 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-brand-gold" />
                    Detected Cost Leakages
                  </h4>
                  <div className="space-y-3">
                    {aiState.profitAnalysis.leakagesAndInefficiencies.map((item, id) => (
                      <div key={id} className="p-2.5 bg-red-50/50 rounded-lg text-xs border border-red-150">
                        <div className="flex justify-between items-start">
                          <span className="font-bold text-brand-darkgreen">{item.source}</span>
                          <span className="text-[11px] font-mono text-red-650 font-extrabold whitespace-nowrap">LKR {item.estimatedLossLkr.toLocaleString()} lost</span>
                        </div>
                        <p className="text-[10px] text-brand-charcoal/70 mt-1"><span className="font-semibold text-brand-green">Fix:</span> {item.mitigationStrategy}</p>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Product viability table and reduction suggestions */}
              <div className="lg:col-span-2 space-y-4">
                
                {/* Product Margins */}
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                  <h3 className="text-xs uppercase tracking-wider font-bold text-brand-darkgreen mb-4">Calculated Profitability By Finished Product</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <th className="p-2.5 font-bold text-brand-darkgreen">Finished Spice SKU</th>
                          <th className="p-2.5 font-bold text-brand-darkgreen text-center">Gross Profit Margin</th>
                          <th className="p-2.5 font-bold text-brand-darkgreen text-right">AI Viability Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {aiState.profitAnalysis.profitabilityByProduct.map((item, id) => (
                          <tr key={id} className="hover:bg-gray-50/70">
                            <td className="p-2.5 font-semibold text-brand-charcoal">{item.productName}</td>
                            <td className="p-2.5 text-center font-mono font-bold text-brand-green">{item.grossMarginPercent}%</td>
                            <td className="p-2.5 text-right">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                item.profitabilityGrade === "Excellent" 
                                  ? "bg-green-100 text-green-800" 
                                  : item.profitabilityGrade === "Good"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }`}>
                                {item.profitabilityGrade}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Cost reduction opportunities */}
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                  <h3 className="text-xs uppercase tracking-wider font-bold text-brand-darkgreen mb-3">AI Sourcing Optimization / Savings Potential</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {aiState.profitAnalysis.costReductionOpportunities.map((op, i) => (
                      <div key={i} className="p-3 bg-brand-cream/15 border border-brand-gold/10 rounded-lg text-xs">
                        <div className="flex justify-between items-center mb-1">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                            op.priority === "High" ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-700"
                          }`}>
                            {op.priority} Priority
                          </span>
                          <span className="font-mono text-brand-emerald font-extrabold">Save LKR {op.savingsLkr.toLocaleString()}</span>
                        </div>
                        <p className="text-brand-charcoal/70 leading-snug">{op.opportunity}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Exec evaluation comment */}
                <div className="bg-brand-green/5 p-4 rounded-xl text-xs text-brand-darkgreen leading-relaxed">
                  <p className="font-semibold text-brand-gold">Executive Summary of Audit:</p>
                  <p className="mt-1">{aiState.profitAnalysis.executiveSummary}</p>
                </div>

              </div>

            </div>
          )}

          {/* 4. PRODUCTION PLANNING & SCHEDULING */}
          {activeTab === "planning" && aiState.productionPlanning && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Sugestion block */}
              <div className="lg:col-span-1 space-y-4">
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                  <h4 className="text-xs uppercase tracking-wider font-bold text-brand-darkgreen mb-3">Recommended Grinding Batches</h4>
                  <div className="space-y-3">
                    {aiState.productionPlanning.productionRecommendations.map((item, id) => (
                      <div key={id} className="p-3 bg-brand-cream/30 border border-brand-gold/10 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-brand-darkgreen">{item.name}</span>
                          <span className="text-[10px] bg-brand-green text-brand-gold font-bold px-1.5 py-0.5 rounded">
                            {item.suggestedBatchQty} units
                          </span>
                        </div>
                        <p className="text-[11px] text-brand-charcoal/60 mt-1 leading-snug">{item.justification}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                  <h4 className="text-xs uppercase tracking-wider font-bold text-brand-darkgreen mb-2">Material Procurement Demand</h4>
                  <div className="space-y-2">
                    {aiState.productionPlanning.resourceDemands.map((item, i) => (
                      <div key={i} className="text-xs p-2.5 bg-gray-50 rounded-lg">
                        <p className="font-bold text-brand-darkgreen">{item.name}</p>
                        <div className="flex justify-between text-[11px] text-brand-charcoal/60 mt-1">
                          <span>Purchase Qty: <b>{item.requiredPurchaseKg} kg</b></span>
                          <span className="text-brand-green font-semibold">Est Cost: LKR {item.estimatedPriceLkr.toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Schedule layout */}
              <div className="lg:col-span-2">
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                  <h3 className="text-xs uppercase tracking-wider font-bold text-brand-darkgreen mb-4">Sieve-Grinding Roller Machine Allocation Table</h3>
                  
                  <div className="space-y-4">
                    {aiState.productionPlanning.productionSchedule.map((sched, idx) => (
                      <div key={idx} className="border border-brand-gold/10 rounded-xl overflow-hidden shadow-sm">
                        <div className="bg-brand-cream/60 py-2.5 px-4 font-display font-semibold text-brand-darkgreen text-xs flex justify-between">
                          <span>{sched.day}</span>
                          <span className="text-brand-gold-dark text-[11px]">Machine: {sched.machineAllotment}</span>
                        </div>
                        <div className="p-3 bg-white space-y-2">
                          {sched.tasks.map((task, tid) => (
                            <div key={tid} className="flex gap-2.5 items-start text-xs text-brand-charcoal/80">
                              <span className="w-1.5 h-1.5 rounded-full bg-brand-gold mt-1.5"></span>
                              <p className="leading-snug">{task}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                </div>
              </div>

            </div>
          )}

          {/* 5. AUTOMATED WEEKLY DISPATCHER */}
          {activeTab === "weekly" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Dispatch trigger form */}
              <div className="lg:col-span-1 space-y-4">
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                  <h4 className="text-xs uppercase tracking-wider font-bold text-brand-darkgreen">Automated Dispatcher Controls</h4>
                  <p className="text-xs text-brand-charcoal/50 leading-relaxed mt-1">
                    Triggers a complex AI aggregation task and dispatches the compiled Ceylon Spices executive summary directly to predefined partners:
                  </p>
                  
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg text-xs">
                      <Mail className="w-4 h-4 text-brand-gold" />
                      <div>
                        <p className="font-semibold text-brand-charcoal">Recipient Email Address</p>
                        <p className="text-brand-green font-mono">ceyvanainfo@gmail.com</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg text-xs">
                      <PhoneCall className="w-4 h-4 text-brand-emerald" />
                      <div>
                        <p className="font-semibold text-brand-charcoal">WhatsApp Direct Alert</p>
                        <p className="text-brand-green font-mono">+94 74 325 5339</p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={dispatchWeeklyBriefing}
                    disabled={weeklyLoading}
                    className="w-full mt-6 bg-brand-green hover:bg-brand-darkgreen disabled:opacity-50 text-brand-gold font-semibold text-xs py-3 rounded-xl flex items-center justify-center gap-2 transition duration-200 shadow-md shadow-brand-green/20"
                  >
                    {weeklyLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Blending Weekly Spices Metrics...
                      </>
                    ) : (
                      <>
                        <SendHorizontal className="w-4 h-4" />
                        Compile & Distribute Report
                      </>
                    )}
                  </button>
                </div>

                {weeklyReport && (
                  <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm text-xs space-y-2">
                    <p className="text-brand-darkgreen font-semibold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-brand-emerald" />
                      Dispatch Log Output:
                    </p>
                    <p className="text-[11px] text-brand-charcoal/60 leading-relaxed bg-gray-50 p-2.5 rounded-lg font-mono">
                      {weeklyReport.log}
                    </p>
                    <div className="flex justify-between text-[10px] text-brand-charcoal/40 pt-1">
                      <span>Server stamp: {weeklyReport.timestamp}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Compilation results markdown board */}
              <div className="lg:col-span-2">
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm h-[500px] flex flex-col">
                  
                  <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex items-center justify-between">
                    <span className="text-xs font-semibold text-brand-darkgreen">Interactive Briefing Preview</span>
                    <span className="text-[10px] text-brand-gold-dark font-semibold">PREMIUM PRIVATE DIGEST</span>
                  </div>

                  <div className="flex-1 p-6 overflow-y-auto bg-[#fdfdfb] prose prose-sm max-w-none prose-emerald">
                    {weeklyReport ? (
                      <div className="text-xs text-brand-charcoal leading-relaxed whitespace-pre-line font-serif">
                        {weeklyReport.text}
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center">
                        <Clock className="w-10 h-10 text-brand-gold/40 mb-2" />
                        <h4 className="text-xs font-bold text-brand-darkgreen">Report Generation Queue Empty</h4>
                        <p className="text-xs text-brand-charcoal/40 max-w-sm mt-1 leading-normal">
                          Click <b>Compile & Distribute Report</b> to invoke the automatic weekly mailer, aggregate inventory balance variables, and evaluate export margins.
                        </p>
                      </div>
                    )}
                  </div>

                </div>
              </div>

            </div>
          )}

        </div>
      ) : null}

    </div>
  );
}
