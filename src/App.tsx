import React, { useState, useEffect } from "react";
import { 
  Building2, Key, LayoutDashboard, Notebook, Award, Scale, 
  Layers, Receipt, Calculator, Users, Terminal, ShieldCheck, 
  HelpCircle, AlertCircle, RefreshCw, Mail, PhoneCall
} from "lucide-react";
import { DbSchema, UserRole, Invoice } from "./types";

// Import modules
import Dashboard from "./components/Dashboard";
import BooksView from "./components/BooksView";
import InventoryView from "./components/InventoryView";
import ProductionView from "./components/ProductionView";
import SalesView from "./components/SalesView";
import AccountingView from "./components/AccountingView";
import EmployeeView from "./components/EmployeeView";
import AIAssistant from "./components/AIAssistant";

export default function App() {
  const [db, setDb] = useState<DbSchema | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // Navigation & Role states
  const [currentTab, setCurrentTab] = useState("Dashboard");
  const [activeBookSubTab, setActiveBookSubTab] = useState("Customer_Day_Book");
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>("Super Administrator");

  // Invoice direct inspect link state
  const [selectedInvoicePreview, setSelectedInvoicePreview] = useState<Invoice | null>(null);

  // Fetch central database on mount
  const fetchDb = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/db");
      if (!res.ok) {
        throw new Error(`Server returned status: ${res.status}`);
      }
      const data = await res.json();
      setDb(data);
      setErrorMsg("");
    } catch (err: any) {
      console.error("Failed to load CEYVANA ERP master ledger state:", err);
      setErrorMsg(err.message || "Could not reconcile with server DB.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDb();
  }, []);

  // Universal mutations helper
  const mutateDb = async (endpoint: string, method: string, body: any) => {
    try {
      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: Object.keys(body).length > 0 ? JSON.stringify(body) : undefined
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server mutation error: ${res.status}`);
      }
      const data = await res.json();
      await fetchDb(); // reload db immediately
      return data;
    } catch (err: any) {
      alert(`⚠️ OPERATION DECLINED: ${err.message}`);
      throw err;
    }
  };

  // Nav coordinate triggers
  const handleDashboardNavigate = (tabSpec: string) => {
    if (tabSpec === "Customer_Day_Book" || tabSpec === "Supplier_Day_Book" || tabSpec === "Cash_Book" || tabSpec === "Bank_Book" || tabSpec === "Stock_Book" || tabSpec === "Invoice_Book") {
      setActiveBookSubTab(tabSpec);
      setCurrentTab("Daybooks Registry");
    } else {
      setCurrentTab(tabSpec);
    }
  };

  const navigateToInvoiceDirect = (inv: Invoice) => {
    setSelectedInvoicePreview(inv);
    setCurrentTab("Sales & Distributors");
  };

  return (
    <div className="flex min-h-screen bg-brand-cream text-brand-charcoal font-sans" id="ceyvana-app-shell">
      
      {/* 1. Sidebar Panel Nav */}
      <aside className="w-64 bg-brand-darkgreen text-brand-cream flex flex-col justify-between border-r border-brand-gold/15 shrink-0 no-print">
        
        <div>
          {/* Logo Brand Header */}
          <div className="p-6 border-b border-brand-green">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <h1 className="text-2xl font-serif font-black tracking-tight text-brand-gold leading-none">CEYVANA</h1>
                <p className="text-[10px] uppercase tracking-widest text-gray-300 mt-1 font-sans font-semibold">Premium Ceylon Spices</p>
              </div>
              <span className="text-[10px] text-brand-gold border border-brand-gold/40 px-1.5 py-0.2 rounded font-sans uppercase font-extrabold tracking-widest leading-none bg-brand-gold/5">
                ERP
              </span>
            </div>
          </div>

          {/* Current Authorized role badge */}
          <div className="mx-4 my-3 bg-white/5 border border-white/10 p-2.5 rounded-xl flex items-center justify-between text-[11px] font-medium text-brand-cream/80">
            <span className="flex items-center gap-1.5 font-sans">
              <ShieldCheck className="w-3.5 h-3.5 text-brand-gold" />
              Role: <b className="text-white uppercase text-[10px]">{currentUserRole}</b>
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-brand-emerald animate-pulse" title="System Connected"></span>
          </div>

          {/* Nav list */}
          <nav className="p-3 space-y-1">
            {[
              { label: "Dashboard", tab: "Dashboard", icon: LayoutDashboard },
              { label: "Daybooks Registry", tab: "Daybooks Registry", icon: Notebook },
              { label: "Inventory Control", tab: "Inventory Control", icon: Scale },
              { label: "Milling & Recipes", tab: "Milling & Recipes", icon: Layers },
              { label: "Sales & Distributors", tab: "Sales & Distributors", icon: Receipt },
              { label: "Financial Accounting", tab: "Financial Accounting", icon: Calculator },
              { label: "Personnel Desk", tab: "Personnel Desk", icon: Users },
              { label: "AI Business Assistant", tab: "AI Assistant", icon: Award },
            ].map(item => {
              const Icon = item.icon;
              const isActive = currentTab === item.tab;
              return (
                <button
                  key={item.tab}
                  onClick={() => {
                    setCurrentTab(item.tab);
                    setSelectedInvoicePreview(null);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-semibold tracking-wide transition-all relative ${
                    isActive 
                      ? "bg-brand-green text-brand-gold font-bold border-r-4 border-brand-gold" 
                      : "text-gray-300 hover:text-white hover:bg-brand-green/30"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-brand-gold" : "text-brand-cream/55"}`} />
                  {item.label}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Brand identity footer */}
        <div className="p-4 border-t border-white/5 text-[10px] text-brand-cream/40 space-y-1 bg-white/[0.01]">
          <p className="font-bold flex items-center justify-between">
            <span>🇱🇰 MADE IN SRI LANKA</span>
            <span className="font-mono text-[9px] text-brand-gold">100% Genuine</span>
          </p>
          <p className="leading-snug">Pure organic spice grinding, sifting & packaging traceability.</p>
        </div>

      </aside>

      {/* 2. Main Content shell with top status bar */}
      <main className="flex-1 flex flex-col min-w-0">
        
        {/* Top Status Bar Grid */}
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6 lg:px-8 shrink-0 no-print">
          
          <div className="flex items-center gap-4">
            <div className="text-md lg:text-lg font-serif font-black text-brand-darkgreen tracking-tight">Executive Overview</div>
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-brand-charcoal/50 bg-gray-100/80 px-2.5 py-1 rounded-lg">
              <Building2 className="w-3.5 h-3.5 text-brand-midgreen" />
              <span>Galle Hub</span>
              <span className="text-[9px] bg-brand-emerald/15 text-brand-emerald font-extrabold px-1.5 py-0.2 rounded ml-1 uppercase">
                Online
              </span>
            </div>
            <div className="hidden md:block bg-gray-50 text-gray-500 text-xs px-2.5 py-1 rounded border border-gray-200/50">
              Owner: <span className="font-semibold text-brand-darkgreen">Mr. Jayasinghe</span>
            </div>
          </div>

          <div className="flex items-center gap-4 lg:gap-6">
            
            {/* Quick Status notifications */}
            <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
              <span className="w-2 h-2 rounded-full bg-brand-emerald animate-pulse"></span>
              <span>Reconciled: <b className="text-brand-darkgreen">2026-06-20</b></span>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={fetchDb}
                className="p-2 border border-gray-200 bg-gray-50 hover:bg-gray-100 rounded-xl transition text-brand-charcoal hover:rotate-180 duration-500 focus:outline-none"
                title="Synchronize ERP Database"
              >
                <RefreshCw className="w-3.5 h-3.5 text-brand-darkgreen" />
              </button>
              
              <div className="w-8 h-8 rounded-full bg-brand-gold border border-white flex items-center justify-center text-white font-bold text-xs shadow-sm" title="Active Admin Session">
                AJ
              </div>
            </div>
          </div>

        </header>

        {/* Inner panel area */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6 pb-12">
          
          {loading && !db ? (
            <div className="h-64 flex flex-col items-center justify-center space-y-3">
              <RefreshCw className="w-8 h-8 text-brand-gold animate-spin" />
              <p className="text-xs font-semibold text-brand-darkgreen">Reconciling master ledgers with server database...</p>
            </div>
          ) : errorMsg ? (
            <div className="bg-red-50 border border-red-200 text-red-900 rounded-xl p-5 max-w-lg mx-auto space-y-2 mt-12">
              <h3 className="font-bold flex items-center gap-2"><AlertCircle className="w-5 h-5 text-red-600" /> Database Connection Failed</h3>
              <p className="text-xs">{errorMsg}</p>
              <button onClick={fetchDb} className="bg-red-650 text-white text-xs font-bold py-1.5 px-3.5 rounded transition">Retry connection</button>
            </div>
          ) : db ? (
            <div>
              {/* Dynamic Tabs routing rendered on the spot */}
              {currentTab === "Dashboard" && (
                <Dashboard db={db} onNavigate={handleDashboardNavigate} />
              )}
              {currentTab === "Daybooks Registry" && (
                <BooksView 
                  db={db} 
                  activeBook={activeBookSubTab} 
                  setActiveBook={setActiveBookSubTab} 
                  triggerDbRefresh={fetchDb}
                  onNavigateInvoice={navigateToInvoiceDirect}
                />
              )}
              {currentTab === "Inventory Control" && (
                <InventoryView db={db} triggerDbRefresh={fetchDb} mutateDb={mutateDb} />
              )}
              {currentTab === "Milling & Recipes" && (
                <ProductionView db={db} triggerDbRefresh={fetchDb} mutateDb={mutateDb} />
              )}
              {currentTab === "Sales & Distributors" && (
                <SalesView 
                  db={db} 
                  triggerDbRefresh={fetchDb} 
                  mutateDb={mutateDb} 
                  selectedInvoiceForDetail={selectedInvoicePreview}
                  setSelectedInvoiceForDetail={setSelectedInvoicePreview}
                />
              )}
              {currentTab === "Financial Accounting" && (
                <AccountingView db={db} triggerDbRefresh={fetchDb} mutateDb={mutateDb} />
              )}
              {currentTab === "Personnel Desk" && (
                <EmployeeView 
                  db={db} 
                  currentUserRole={currentUserRole} 
                  setCurrentUserRole={setCurrentUserRole} 
                  triggerDbRefresh={fetchDb}
                  mutateDb={mutateDb}
                />
              )}
              {currentTab === "AI Assistant" && (
                <AIAssistant db={db} triggerDbRefresh={fetchDb} />
              )}
            </div>
          ) : null}

        </div>

      </main>

    </div>
  );
}
