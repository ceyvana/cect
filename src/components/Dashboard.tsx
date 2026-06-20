import React from "react";
import { 
  DollarSign, ArrowUpRight, ArrowDownRight, Package, 
  Layers, AlertCircle, ShoppingCart, UserCheck, Briefcase, 
  MapPin, ShieldCheck, Landmark, BookOpen
} from "lucide-react";
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, 
  Tooltip, CartesianGrid, Legend, PieChart, Pie, Cell 
} from "recharts";
import { DbSchema } from "../types";

interface DashboardProps {
  db: DbSchema;
  onNavigate: (tab: string) => void;
}

export default function Dashboard({ db, onNavigate }: DashboardProps) {
  // Compute Key metrics safely from DB
  const todayDate = "2026-06-20"; // standard date simulation matching additional metadata
  
  // 1. Calculations
  const totalSales = db.invoices.reduce((sum, item) => sum + item.totalAmount, 0);
  const pendingInvoicesVal = db.invoices
    .filter(inv => inv.paymentStatus === "Pending")
    .reduce((sum, item) => sum + item.totalAmount, 0);

  const totalOutstandingReceivables = db.customers.reduce((sum, item) => sum + item.balanceDue, 0);
  const totalOutstandingPayables = db.suppliers.reduce((sum, item) => sum + item.balanceDue, 0);

  const rawMaterialsValue = db.raw_materials.reduce((sum, item) => sum + (item.currentStock * item.costPerKg), 0);
  const finishedProductsValue = db.products.reduce((sum, item) => sum + (item.currentStock * item.costPrice), 0);
  const totalInventoryValue = rawMaterialsValue + finishedProductsValue;

  // Stock alerts
  const lowStockRMList = db.raw_materials.filter(rm => rm.currentStock <= rm.safetyStock);
  const lowStockProductList = db.products.filter(p => p.currentStock <= 1000); // 1000 buffer for products

  // Ledger calculation
  const cashBalance = db.ledger
    .filter(l => l.book === "Cash")
    .reduce((sum, l) => sum + (l.type === "Debit" ? l.amount : -l.amount), 320000); // base initial 320k LKR

  const bankBalance = db.ledger
    .filter(l => l.book === "Bank")
    .reduce((sum, l) => sum + (l.type === "Debit" ? l.amount : -l.amount), 1450000); // base initial 1.45M LKR

  const factoryOverheads = db.ledger
    .filter(l => l.book === "Expense_Ledger" || l.category === "Raw Material Expense")
    .reduce((sum, l) => sum + l.amount, 0);

  // Charts mapping
  const categorySummaryData = db.products.map(p => ({
    name: p.name.replace("CEYVANA ", ""),
    Stock: p.currentStock,
    Price: p.wholesalePrice
  }));

  // Regional Sales Mapping
  const regionBreakdown = [
    { name: "Colombo Division", value: 1067000 },
    { name: "Gampaha Outlets", value: 1082250 },
    { name: "Galle Fort", value: 304725 },
    { name: "Jaffna Town", value: 145000 }
  ];

  const REGION_COLORS = ["#0B3D2E", "#1A4D3E", "#D4AF37", "#B8901C"];

  return (
    <div className="space-y-6" id="dashboard-entry">
      
      {/* 2-Column Banner: CEYVANA Identity & Quick Launch Cards */}
      <div className="bg-brand-green relative text-brand-cream p-6 lg:p-8 rounded-2xl border border-brand-gold/25 overflow-hidden shadow-xl flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-5 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-brand-gold via-transparent to-transparent pointer-events-none"></div>
        <div className="space-y-2 text-center md:text-left z-10">
          <div className="inline-flex items-center gap-2 bg-brand-gold/15 border border-brand-gold/30 px-3 py-1 rounded-full text-xs font-bold text-brand-gold uppercase tracking-widest leading-none">
            🇱🇰 Made in Sri Lanka
          </div>
          <h1 className="text-2xl lg:text-3xl font-serif font-bold tracking-tight text-white mb-1">
            CEYVANA Executive Control Room
          </h1>
          <p className="text-xs text-brand-cream/80 max-w-lg leading-relaxed">
            Premium Ceylon spice grading, recipe formulary control, accounts ledger, and AI-powered business forecasting dashboard.
          </p>
        </div>
        <div className="flex gap-3 z-10 flex-wrap justify-center">
          <button 
            onClick={() => onNavigate("AI Assistant")}
            className="bg-brand-gold text-brand-darkgreen font-display font-extrabold text-xs px-5 py-3 rounded-xl hover:bg-brand-gold/90 transition shadow-md flex items-center gap-2"
          >
            <ShieldCheck className="w-4 h-4 text-brand-darkgreen" />
            Launch AI Intelligence
          </button>
          <button 
            onClick={() => onNavigate("Production")}
            className="bg-white/10 text-white font-display font-bold text-xs px-5 py-3 rounded-xl hover:bg-white/15 transition border border-white/10"
          >
            Create Grinding Schedule
          </button>
        </div>
      </div>

      {/* High-Contrast KPIs Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1 */}
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-brand-charcoal/50">Today's Cash Ledger</span>
            <h3 className="text-md lg:text-lg font-mono font-black text-brand-darkgreen mt-1">
              LKR {cashBalance.toLocaleString()}
            </h3>
            <span className="text-[9px] text-brand-emerald bg-brand-emerald/10 px-1.5 py-0.5 rounded font-bold inline-block mt-1">
              Ready Funds
            </span>
          </div>
          <div className="p-2 bg-brand-green/5 text-brand-green rounded-lg">
            <DollarSign className="w-5 h-5 text-brand-green" />
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-brand-charcoal/50">Lanka Bank Balance</span>
            <h3 className="text-md lg:text-lg font-mono font-black text-brand-darkgreen mt-1">
              LKR {bankBalance.toLocaleString()}
            </h3>
            <span className="text-[9px] text-brand-emerald bg-brand-emerald/10 px-1.5 py-0.5 rounded font-bold inline-block mt-1">
              Reconciled Balance
            </span>
          </div>
          <div className="p-2 bg-brand-green/5 text-brand-midgreen rounded-lg">
            <Landmark className="w-5 h-5 text-brand-midgreen" />
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-brand-charcoal/50">Outstanding Receivables</span>
            <h3 className="text-md lg:text-lg font-mono font-black text-brand-gold-dark mt-1">
              LKR {totalOutstandingReceivables.toLocaleString()}
            </h3>
            <span className="text-[9px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded font-bold inline-block mt-1">
              6 Wholesalers Pending
            </span>
          </div>
          <div className="p-2 bg-brand-gold/10 text-brand-gold rounded-lg">
            <ArrowUpRight className="w-5 h-5 text-brand-gold-dark" />
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-brand-charcoal/50">Supplier Payables</span>
            <h3 className="text-md lg:text-lg font-mono font-black text-red-700 mt-1">
              LKR {totalOutstandingPayables.toLocaleString()}
            </h3>
            <span className="text-[9px] text-red-650 bg-red-50 px-1.5 py-0.5 rounded font-bold inline-block mt-1">
              Liability Due
            </span>
          </div>
          <div className="p-2 bg-red-100/50 text-red-700 rounded-lg">
            <ArrowDownRight className="w-5 h-5 text-red-600" />
          </div>
        </div>

      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Sales */}
        <div className="bg-white p-4 rounded-xl border border-gray-150 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-brand-charcoal/40 uppercase">Total Sales Generated</span>
            <p className="font-mono text-sm font-black text-brand-darkgreen mt-0.5">LKR {totalSales.toLocaleString()}</p>
          </div>
          <ShoppingCart className="w-4 h-4 text-brand-emerald" />
        </div>

        {/* Total inventory val */}
        <div className="bg-white p-4 rounded-xl border border-gray-150 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-brand-charcoal/40 uppercase">Combined Inventory Val</span>
            <p className="font-mono text-sm font-black text-brand-darkgreen mt-0.5">LKR {totalInventoryValue.toLocaleString()}</p>
          </div>
          <Package className="w-4 h-4 text-brand-gold-dark" />
        </div>

        {/* Raw materials vs Finished */}
        <div className="bg-white p-4 rounded-xl border border-gray-150 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-brand-charcoal/40 uppercase">Active Grinding Orders</span>
            <p className="font-mono text-sm font-black text-brand-darkgreen mt-0.5">
              {db.production_orders.filter(p => p.status === "In_Progress").length} Batches Milling
            </p>
          </div>
          <Layers className="w-4 h-4 text-brand-midgreen" />
        </div>

        {/* Pending collections */}
        <div className="bg-white p-4 rounded-xl border border-gray-150 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-brand-charcoal/40 uppercase">Low Stock Safety Alerts</span>
            <p className="font-mono text-sm font-bold text-red-650 mt-0.5">
              {lowStockRMList.length} items urgent
            </p>
          </div>
          <div className="w-2.5 h-2.5 rounded-full bg-red-600"></div>
        </div>

      </div>

      {/* Icon-based DAY BOOKS Shortcuts Grid (Menu Cards) */}
      <div>
        <h3 className="text-xs uppercase font-extrabold tracking-widest text-brand-darkgreen mb-3 flex items-center gap-1.5 pb-2 border-b border-gray-150">
          <BookOpen className="w-4 h-4 text-brand-gold" />
          Interactive DAY BOOK & OPERATIONAL MENU
        </h3>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: "Customer Day Book", tab: "Customer_Day_Book", color: "hover:bg-brand-green/5 hover:border-brand-midgreen" },
            { label: "Supplier Day Book", tab: "Supplier_Day_Book", color: "hover:bg-amber-50 hover:border-amber-700" },
            { label: "Cash Book", tab: "Cash_Book", color: "hover:bg-green-50 hover:border-green-600" },
            { label: "Bank Book", tab: "Bank_Book", color: "hover:bg-blue-50/50 hover:border-blue-600" },
            { label: "Stock Book", tab: "Stock_Book", color: "hover:bg-stone-50 hover:border-stone-600" },
            { label: "Invoice Book", tab: "Invoice_Book", color: "hover:bg-purple-50/50 hover:border-purple-600" },
          ].map((entry, idx) => (
            <button
              key={idx}
              onClick={() => onNavigate(entry.tab)}
              className={`bg-white border border-gray-200 py-3.5 px-3 rounded-xl text-center text-xs font-semibold text-brand-darkgreen transition-all duration-200 cursor-pointer shadow-sm ${entry.color}`}
            >
              <div className="mx-auto w-1.5 h-1.5 rounded-full bg-brand-gold mb-1.5"></div>
              {entry.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 mt-3">
          {[
            { label: "Products", tab: "Products" },
            { label: "Raw Materials", tab: "Raw Materials" },
            { label: "Recipes", tab: "Recipes" },
            { label: "Purchases", tab: "Purchases" },
            { label: "Production", tab: "Production" },
            { label: "Accounting", tab: "Accounting" },
            { label: "Employees", tab: "Employees" },
            { label: "Distributors", tab: "Distributors" },
          ].map((entry, idx) => (
            <button
              key={idx}
              onClick={() => onNavigate(entry.tab)}
              className="bg-brand-cream/45 border border-brand-gold/10 hover:border-brand-gold/40 hover:bg-white text-brand-charcoal text-[11px] font-medium py-2 rounded-lg transition-all text-center cursor-pointer"
            >
              {entry.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Graph Panel + Side Alert Feed Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Product Stock Chart */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div>
            <h3 className="text-xs uppercase font-extrabold tracking-widest text-brand-darkgreen mb-1">Combined Finished Spice Stocks</h3>
            <p className="text-[11px] text-brand-charcoal/50 mb-4">Live inventory metrics matching wholesale vs package sizing indices</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categorySummaryData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} angle={-15} textAnchor="end" height={45} />
                <YAxis stroke="#94a3b8" fontSize={11} name="Stock units" />
                <Tooltip />
                <Legend />
                <Bar dataKey="Stock" name="Inventory stock (Units)" fill="#0b4625" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Price" name="Wholesale Unit Price (LKR)" fill="#d4af37" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Warning Alerts / Quality Board summary */}
        <div className="lg:col-span-1 space-y-4">
          
          {/* Circular Regional Market pie */}
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-xs uppercase font-extrabold tracking-widest text-brand-darkgreen mb-2">Regional Sales Distribution</h3>
              <p className="text-[10px] text-brand-charcoal/40 mb-3">Revenue share across Sri Lankan wholesale divisions</p>
            </div>
            
            <div className="h-44 flex items-center justify-center relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={regionBreakdown}
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {regionBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={REGION_COLORS[index % REGION_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `LKR ${value.toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute text-center">
                <p className="text-xs text-brand-charcoal/50 font-bold leading-none">Turnover</p>
                <p className="text-xs font-mono font-bold text-brand-darkgreen mt-1">LKR 2.6M</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-2">
              {regionBreakdown.map((r, i) => (
                <div key={i} className="flex items-center gap-1.5 text-[10px] text-brand-charcoal/70">
                  <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: REGION_COLORS[i] }}></span>
                  <span className="truncate">{r.name}</span>
                </div>
              ))}
            </div>

          </div>

          {/* Low raw material stocks warning */}
          <div className="bg-red-55 p-4 rounded-xl border border-red-200 text-xs">
            <h4 className="font-extrabold text-red-900 flex items-center gap-1.5 uppercase tracking-wide">
              <AlertCircle className="w-4 h-4 text-red-700" />
              Raw Material Low Alerts
            </h4>
            <div className="space-y-1.5 mt-2">
              {lowStockRMList.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center bg-white/60 p-1.5 rounded text-red-950 font-medium">
                  <span>{item.name}</span>
                  <span className="font-mono font-extrabold text-[11px] text-red-700">Only {item.currentStock} {item.unit} left</span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
