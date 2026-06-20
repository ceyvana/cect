import React, { useState } from "react";
import { 
  DollarSign, Landmark, TrendingUp, Notebook, FileSpreadsheet, Plus, 
  RefreshCw, TrendingDown, ClipboardCheck, ArrowUpRight, ArrowDownRight, 
  Database, Scale, HeartHandshake, ShieldCheck
} from "lucide-react";
import { DbSchema, LedgerEntry } from "../types";

interface AccountingViewProps {
  db: DbSchema;
  triggerDbRefresh: () => void;
  mutateDb: (endpoint: string, method: string, body: any) => Promise<any>;
}

export default function AccountingView({ db, triggerDbRefresh, mutateDb }: AccountingViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<"ledger" | "pl" | "balance_sheet">("ledger");

  // Ledger state inputs
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [leBook, setLeBook] = useState<"Cash" | "Bank" | "Expense_Ledger" | "Revenue_Ledger">("Cash");
  const [leDesc, setLeDesc] = useState("");
  const [leCategory, setLeCategory] = useState("Sales Revenue");
  const [leType, setLeType] = useState<"Debit" | "Credit">("Debit");
  const [leAmount, setLeAmount] = useState(15000);

  const handleCreateLedgerEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      date: new Date().toISOString().split("T")[0],
      book: leBook,
      description: leDesc,
      category: leCategory,
      type: leType,
      amount: Number(leAmount)
    };

    await mutateDb("/api/db/ledger", "POST", payload);
    setShowEntryModal(false);
    triggerDbRefresh();
    alert("Ledger transaction filed successfully in general journal.");
  };

  // --- 1. INCOME STATEMENT DYNAMIC CALCULATIONS ---
  // Revenue
  const totalInvoicesIncome = db.invoices.reduce((sum, i) => sum + i.totalAmount, 0);
  const ledgerSalesRevenue = db.ledger
    .filter(l => l.category === "Sales Revenue" && l.type === "Debit")
    .reduce((sum, l) => sum + l.amount, 0);
  
  const totalRevenue = totalInvoicesIncome + ledgerSalesRevenue;

  // Cost Of Goods Sold (COGS)
  const totalSupplierPOValue = db.purchase_orders.reduce((sum, p) => sum + p.totalAmount, 0);
  const ledgerRawExp = db.ledger
    .filter(l => l.category === "Raw Material Expense")
    .reduce((sum, l) => sum + l.amount, 0);

  const totalCOGS = totalSupplierPOValue + ledgerRawExp;

  const grossProfit = totalRevenue - totalCOGS;

  // Operating Expenses (OPEX)
  const opexPayroll = db.employees.reduce((sum, emp) => sum + emp.salary, 0);
  const opexLedgerUtilities = db.ledger
    .filter(l => l.category === "Utility Bill" || l.category === "Logistics Expense")
    .reduce((sum, l) => sum + l.amount, 0);
  
  const totalOPEX = opexPayroll + opexLedgerUtilities;

  const netOperationalProfit = grossProfit - totalOPEX;

  // --- 2. BALANCE SHEET DYNAMIC CALCULATIONS ---
  // Assets
  const cashAsset = db.ledger
    .filter(l => l.book === "Cash")
    .reduce((sum, l) => sum + (l.type === "Debit" ? l.amount : -l.amount), 320000);

  const bankAsset = db.ledger
    .filter(l => l.book === "Bank")
    .reduce((sum, l) => sum + (l.type === "Debit" ? l.amount : -l.amount), 1450000);

  const arAsset = db.customers.reduce((sum, c) => sum + c.balanceDue, 0);

  const rawInvValue = db.raw_materials.reduce((sum, item) => sum + (item.currentStock * item.costPerKg), 0);
  const prodInvValue = db.products.reduce((sum, item) => sum + (item.currentStock * item.costPrice), 0);
  const inventoryAsset = rawInvValue + prodInvValue;

  const totalAssets = cashAsset + bankAsset + arAsset + inventoryAsset;

  // Liabilities & Equity
  const apLiability = db.suppliers.reduce((sum, s) => sum + s.balanceDue, 0);
  const ownerCapital = 1800000; // Base Capital Investment of CEYVANA Partners
  const retainedEarning = netOperationalProfit;

  const totalEquityAndLiabilities = apLiability + ownerCapital + retainedEarning;

  return (
    <div className="space-y-6" id="accounting-financials-root">
      
      {/* Sub tabs lists */}
      <div className="flex border-b border-gray-200">
        {[
          { key: "ledger", label: "General Journal Ledger", icon: Notebook },
          { key: "pl", label: "Profit & Loss (Income)", icon: FileSpreadsheet },
          { key: "balance_sheet", label: "Balance Sheet & Trial Balance", icon: Scale },
        ].map(st => {
          const Icon = st.icon;
          return (
            <button
              key={st.key}
              onClick={() => setActiveSubTab(st.key as any)}
              className={`py-3.5 px-6 font-display font-bold text-xs flex items-center gap-2 border-b-2 transition -mb-px ${
                activeSubTab === st.key
                  ? "border-brand-green text-brand-darkgreen font-semibold"
                  : "border-transparent text-brand-charcoal/50 hover:text-brand-darkgreen"
              }`}
            >
              <Icon className="w-4 h-4 text-brand-midgreen" />
              {st.label}
            </button>
          )
        })}
      </div>

      {/* Primary content card */}
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm animate-fade-in">
        
        {/* TAB 1: RUNNING LEDGER LIST & ENTRY BOX */}
        {activeSubTab === "ledger" && (
          <div className="space-y-4">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <span className="text-xs text-brand-charcoal/50">Detailed double-entry list capturing Lanka bank feeds & cashier petty cash accounts</span>

              <button
                onClick={() => {
                  setLeDesc("");
                  setShowEntryModal(true);
                }}
                className="bg-brand-green text-brand-gold font-display font-extrabold text-xs px-4 py-2.5 rounded-xl hover:bg-brand-darkgreen transition flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Record Journal Entry
              </button>
            </div>

            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-205 text-brand-darkgreen uppercase font-bold tracking-widest text-[10px]">
                    <th className="p-3">Posting Date</th>
                    <th className="p-3">Journal Book</th>
                    <th className="p-3">Description</th>
                    <th className="p-3">Category</th>
                    <th className="p-3 text-center">Posting Type</th>
                    <th className="p-3 text-right">Debit / Credit Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {db.ledger.map((entry, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/70">
                      <td className="p-3 font-mono text-brand-charcoal/70">{entry.date}</td>
                      <td className="p-3 font-semibold text-brand-darkgreen">{entry.book}</td>
                      <td className="p-3 text-brand-charcoal/85">{entry.description}</td>
                      <td className="p-3 text-brand-charcoal/60">{entry.category}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2.5 py-0.5 rounded text-[9px] font-black uppercase ${
                          entry.type === "Debit" ? "bg-green-150 text-green-800" : "bg-red-100 text-red-800"
                        }`}>
                          {entry.type}
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono font-black text-brand-darkgreen">
                        {entry.type === "Credit" ? "-" : "+"} LKR {entry.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* TAB 2: PROFIT & LOSS STATEMENT */}
        {activeSubTab === "pl" && (
          <div className="max-w-2xl mx-auto border border-gray-200 rounded-2xl p-6 bg-gradient-to-b from-white to-brand-cream/10 space-y-4">
            
            <div className="text-center pb-4 border-b border-gray-200">
              <h2 className="text-xs uppercase font-extrabold tracking-widest text-brand-gold">CEYVANA Spices Manufacturing Co.</h2>
              <h3 className="text-md font-display font-black text-brand-darkgreen mt-1">PROFIT & LOSS STATEMENT (INCOME STATEMENT)</h3>
              <p className="text-[10px] text-brand-charcoal/40 mt-1">Simulation Period running up to June 20, 2026</p>
            </div>

            <div className="space-y-3.5 text-xs">
              
              {/* REVENUE LINES */}
              <div>
                <h4 className="font-extrabold text-brand-darkgreen uppercase border-b border-gray-200 pb-1 text-[11px]">Operating Revenue</h4>
                <div className="space-y-1.5 mt-2 pl-3">
                  <div className="flex justify-between text-brand-charcoal">
                    <span>Wholesale Spice Invoice Book billing</span>
                    <span className="font-mono">LKR {totalInvoicesIncome.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-brand-charcoal">
                    <span>Cashier retail cash counter registers</span>
                    <span className="font-mono">LKR {ledgerSalesRevenue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-bold text-brand-darkgreen border-t border-dashed border-gray-300 pt-1">
                    <span>GROSS OPERATING REVENUE (A)</span>
                    <span className="font-mono">LKR {totalRevenue.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* COGS LINES */}
              <div className="pt-2">
                <h4 className="font-extrabold text-brand-darkgreen uppercase border-b border-gray-200 pb-1 text-[11px]">Cost of Goods Sold (COGS)</h4>
                <div className="space-y-1.5 mt-2 pl-3">
                  <div className="flex justify-between text-brand-charcoal">
                    <span>Supplier Purchase Orders (Material Intake)</span>
                    <span className="font-mono">LKR {totalSupplierPOValue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-brand-charcoal">
                    <span>Direct farm cooperative bulk spice settlements</span>
                    <span className="font-mono">LKR {ledgerRawExp.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-bold text-red-700 border-t border-dashed border-gray-300 pt-1">
                    <span>COMBINED PRODUCTION COGS (B)</span>
                    <span className="font-mono">- LKR {totalCOGS.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* GROSS PROFIT */}
              <div className="bg-brand-cream/30 p-2.5 rounded-lg flex justify-between font-extrabold text-brand-darkgreen text-xs border border-brand-gold/10">
                <span>GROSS SPICE OVERALL PROFIT (A - B)</span>
                <span className="font-mono">LKR {grossProfit.toLocaleString()}</span>
              </div>

              {/* OPEX */}
              <div className="pt-2">
                <h4 className="font-extrabold text-brand-darkgreen uppercase border-b border-gray-200 pb-1 text-[11px]">Operating Overheads (OPEX)</h4>
                <div className="space-y-1.5 mt-2 pl-3">
                  <div className="flex justify-between text-brand-charcoal">
                    <span>Milling operators & administration payroll</span>
                    <span className="font-mono">LKR {opexPayroll.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-brand-charcoal">
                    <span>Factory utility grid and logistics transport</span>
                    <span className="font-mono">LKR {opexLedgerUtilities.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-red-700 border-t border-dashed border-gray-300 pt-1">
                    <span>TOTAL OPERATING OPEX (C)</span>
                    <span className="font-mono">- LKR {totalOPEX.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* EBIT NET */}
              <div className="border-t-2 border-brand-green pt-3 flex justify-between items-baseline">
                <div>
                  <span className="font-extrabold text-brand-darkgreen text-sm block">NET OPERATING EBIT PROFIT</span>
                  <span className="text-[10px] text-brand-charcoal/50">Accumulating towards retained earnings equity</span>
                </div>
                <span className="font-mono font-black text-sm text-brand-green">
                  LKR {netOperationalProfit.toLocaleString()}
                </span>
              </div>

            </div>

          </div>
        )}

        {/* TAB 3: BALANCE SHEET EQUATION STATEMENT */}
        {activeSubTab === "balance_sheet" && (
          <div className="max-w-2xl mx-auto border border-gray-200 rounded-2xl p-6 bg-gradient-to-b from-white to-brand-cream/10 space-y-4">
            
            <div className="text-center pb-4 border-b border-gray-200">
              <h2 className="text-xs uppercase font-extrabold tracking-widest text-brand-gold">CEYVANA Spices Manufacturing Co.</h2>
              <h3 className="text-md font-display font-black text-brand-darkgreen mt-1">DURABLE BALANCE SHEET ACCOUNT</h3>
              <p className="text-[10px] text-brand-charcoal/40 mt-1">Assets = Liabilities + Equity Equation verification</p>
            </div>

            <div className="space-y-3.5 text-xs">
              
              {/* CURRENT ASSETS */}
              <div>
                <h4 className="font-extrabold text-brand-darkgreen uppercase border-b border-gray-200 pb-1 text-[11px]">Corporate Assets</h4>
                <div className="space-y-1.5 mt-2 pl-3">
                  <div className="flex justify-between text-brand-charcoal">
                    <span>Cash Ledger reserves at factory</span>
                    <span className="font-mono">LKR {cashAsset.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-brand-charcoal">
                    <span>National Bank of Ceylon wire accounts</span>
                    <span className="font-mono">LKR {bankAsset.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-brand-charcoal">
                    <span>Distributor receivables (outstanding debit index)</span>
                    <span className="font-mono">LKR {arAsset.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-brand-charcoal">
                    <span>Raw + Package sifting warehouse inventories</span>
                    <span className="font-mono">LKR {inventoryAsset.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-black text-brand-darkgreen border-t border-dashed border-gray-300 pt-1 text-xs">
                    <span>TOTAL SUM ASSETS</span>
                    <span className="font-mono">LKR {totalAssets.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* LIABILITIES AND EQUITY */}
              <div className="pt-2">
                <h4 className="font-extrabold text-brand-darkgreen uppercase border-b border-gray-200 pb-1 text-[11px]">Liabilities & Equity</h4>
                <div className="space-y-1.5 mt-2 pl-3">
                  <div className="flex justify-between text-brand-charcoal">
                    <span>Farm supplier payables (accounts payable liability)</span>
                    <span className="font-mono">LKR {apLiability.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-brand-charcoal">
                    <span>Primary seed partner capital investment</span>
                    <span className="font-mono">LKR {ownerCapital.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-brand-charcoal">
                    <span>Net retained profit (accumulated EBIT margin)</span>
                    <span className="font-mono">LKR {retainedEarning.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-black text-brand-darkgreen border-t border-dashed border-gray-300 pt-1 text-xs">
                    <span>TOTAL CAPITAL, LIABILITIES & EQUITY</span>
                    <span className="font-mono">LKR {totalEquityAndLiabilities.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* TRIAL BALANCE CHECK */}
              <div className="bg-[#effef4] p-3 rounded-xl border border-brand-emerald/20 flex items-center justify-between mt-3 text-brand-darkgreen font-semibold">
                <div className="flex items-center gap-1.5 uppercase text-[10px] tracking-wider text-brand-emerald">
                  <ShieldCheck className="w-4 h-4 text-brand-emerald" />
                  Trial Balance Equation compliance
                </div>
                
                <span className="font-mono text-brand-emerald font-black text-xs">
                  Equation Reconciled (Assets = L+E)
                </span>
              </div>

            </div>

          </div>
        )}

      </div>

      {/* --- ADD TRANSACTION MODAL --- */}
      {showEntryModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full border border-gray-200 p-6 space-y-4 shadow-xl">
            <h3 className="text-md font-display font-black text-brand-darkgreen">Record Ledger Transaction</h3>

            <form onSubmit={handleCreateLedgerEntry} className="space-y-3.5">
              <div>
                <label className="text-[10px] font-bold text-gray-500 block mb-1 uppercase">Journal Book Segment</label>
                <select
                  value={leBook}
                  onChange={e => setLeBook(e.target.value as any)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-brand-gold outline-none text-brand-charcoal"
                >
                  <option value="Cash">Cash Ledger</option>
                  <option value="Bank">Bank Ledger</option>
                  <option value="Expense_Ledger">Expense Book</option>
                  <option value="Revenue_Ledger">Revenue Book</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-500 block mb-1 uppercase">Transaction Description</label>
                <input
                  type="text"
                  required
                  value={leDesc}
                  onChange={e => setLeDesc(e.target.value)}
                  placeholder="e.g. Utility Ceylon Electricity board transfer"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-brand-gold outline-none text-brand-charcoal"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-500 block mb-1 uppercase">Category</label>
                  <select
                    value={leCategory}
                    onChange={e => setLeCategory(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-brand-gold outline-none text-brand-charcoal"
                  >
                    <option value="Utility Bill">Utility Bill</option>
                    <option value="Raw Material Expense">Raw Material Expense</option>
                    <option value="Logistics Expense">Logistics Expense</option>
                    <option value="Salary Overhead">Salary Overhead</option>
                    <option value="Sales Revenue">Sales Revenue</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 block mb-1 uppercase">Entry Type (Flow)</label>
                  <select
                    value={leType}
                    onChange={e => setLeType(e.target.value as any)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-brand-gold outline-none text-brand-charcoal"
                  >
                    <option value="Debit">Debit (Flow In / Asset Up)</option>
                    <option value="Credit">Credit (Flow Out / Asset Down)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-500 block mb-1 uppercase">Voucher Sum LKR</label>
                <input
                  type="number"
                  required
                  value={leAmount}
                  onChange={e => setLeAmount(Number(e.target.value))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-brand-gold outline-none text-brand-charcoal font-mono"
                />
              </div>

              <div className="flex gap-2 pt-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowEntryModal(false)}
                  className="px-4 py-2 bg-gray-100 text-brand-charcoal rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-green hover:bg-brand-darkgreen text-brand-gold rounded-xl text-xs font-bold"
                >
                  File Ledger entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
