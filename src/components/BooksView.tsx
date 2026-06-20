import React, { useState } from "react";
import { 
  BookOpen, Search, ArrowUpRight, ArrowDownRight, 
  Calendar, CheckCircle, Clock, AlertCircle, Share2, 
  RefreshCw, DollarSign, Download, Filter, Printer
} from "lucide-react";
import { DbSchema, Invoice } from "../types";

interface BooksViewProps {
  db: DbSchema;
  activeBook: string;
  setActiveBook: (book: string) => void;
  triggerDbRefresh: () => void;
  onNavigateInvoice: (invoice: Invoice) => void;
}

export default function BooksView({ 
  db, 
  activeBook, 
  setActiveBook, 
  triggerDbRefresh,
  onNavigateInvoice
}: BooksViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Format book list
  const books = [
    { key: "Customer_Day_Book", label: "Customer Day Book", desc: "Outstandings, customer collections & loyalty credits" },
    { key: "Supplier_Day_Book", label: "Supplier Day Book", desc: "PO settlements with Matale and Southern estates" },
    { key: "Cash_Book", label: "Cash Book", desc: "Retail cashier desk notes & immediate expense registry" },
    { key: "Bank_Book", label: "Bank Book", desc: "Major corporate invoices wire reconciliations" },
    { key: "Stock_Book", label: "Stock Book", desc: "Raw item imports & finished package sifting logs" },
    { key: "Invoice_Book", label: "Invoice Book", desc: "Sales billing copies, export receipts & tax ledgers" },
  ];

  // Helper payment style
  const getStatusBadge = (status: "Paid" | "Pending" | "Overdue") => {
    switch (status) {
      case "Paid":
        return <span className="bg-green-100 text-green-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Paid</span>;
      case "Pending":
        return <span className="bg-amber-100 text-amber-850 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1"><Clock className="w-3 h-3" /> Pending</span>;
      default:
        return <span className="bg-red-100 text-red-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Overdue</span>;
    }
  };

  return (
    <div className="space-y-6" id="books-view-panel">
      
      {/* Book selector menu */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
        {books.map(b => (
          <button
            key={b.key}
            onClick={() => setActiveBook(b.key)}
            className={`py-3 px-3.5 rounded-xl border font-display font-bold text-xs text-center transition-all ${
              activeBook === b.key
                ? "bg-brand-green text-brand-gold border-brand-green shadow-md shadow-brand-green/20"
                : "bg-white text-brand-darkgreen border-gray-200 hover:border-brand-gold/45"
            }`}
          >
            {b.label}
          </button>
        ))}
      </div>

      {/* Main Book register detail card */}
      <div className="bg-white p-5 lg:p-6 rounded-2xl border border-gray-200 shadow-sm">
        
        {/* Book Header content */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-150 mb-4">
          <div>
            <h2 className="text-lg font-display font-extrabold text-brand-darkgreen tracking-tight">
              {books.find(b => b.key === activeBook)?.label}
            </h2>
            <p className="text-xs text-brand-charcoal/50">
              {books.find(b => b.key === activeBook)?.desc}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-brand-charcoal/30 absolute left-3.5 top-2.5" />
              <input
                type="text"
                placeholder="Search ledger entries..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="bg-gray-50 border border-gray-300 rounded-xl pl-9 pr-4 py-2 text-xs focus:ring-1 focus:ring-brand-gold outline-none text-brand-charcoal"
              />
            </div>
            
            <button 
              onClick={() => window.print()}
              className="p-2 bg-gray-50 text-brand-charcoal hover:bg-gray-100 border border-gray-300 rounded-xl transition"
              title="Print register"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* --- DYNAMIC TABLES ACCORDING TO SELECTED BOOK --- */}
        
        {/* TAB 1: CUSTOMER DAY BOOK */}
        {activeBook === "Customer_Day_Book" && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 uppercase tracking-widest text-brand-darkgreen text-[10px] font-bold">
                  <th className="p-3">Distributor ID</th>
                  <th className="p-3">Customer Entity</th>
                  <th className="p-3">Region Grid</th>
                  <th className="p-3 text-center">Credit Limit</th>
                  <th className="p-3 text-center">Outstanding Balance</th>
                  <th className="p-3 text-right">Customer Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {db.customers
                  .filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map(cust => (
                    <tr key={cust.id} className="hover:bg-gray-50/70">
                      <td className="p-3 font-mono font-bold text-brand-gold-dark">{cust.id}</td>
                      <td className="p-3">
                        <div className="font-semibold text-brand-darkgreen">{cust.name}</div>
                        <div className="text-[10px] text-brand-charcoal/50">Ph: {cust.contact}</div>
                      </td>
                      <td className="p-3 font-mono text-brand-charcoal/70">{cust.region}</td>
                      <td className="p-3 text-center font-mono">LKR {cust.creditLimit.toLocaleString()}</td>
                      <td className="p-3 text-center font-mono font-black text-red-700">
                        LKR {cust.balanceDue.toLocaleString()}
                        {cust.balanceDue > cust.creditLimit && (
                          <span className="block text-[9px] text-red-650 font-semibold animate-pulse">
                            ⚠️ LIMIT EXCEEDED
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <span className="bg-brand-green/5 text-brand-midgreen px-2 py-0.5 rounded font-bold text-[10px]">
                          {cust.type}
                        </span>
                      </td>
                    </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 2: SUPPLIER DAY BOOK */}
        {activeBook === "Supplier_Day_Book" && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 uppercase tracking-widest text-brand-darkgreen text-[10px] font-bold">
                  <th className="p-3">Supplier ID</th>
                  <th className="p-3">Producer Entity</th>
                  <th className="p-3">Sipping Mail</th>
                  <th className="p-3 text-center">Contact No</th>
                  <th className="p-3 text-right">Outstanding Payable</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {db.suppliers
                  .filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map(supp => (
                    <tr key={supp.id} className="hover:bg-gray-50/70">
                      <td className="p-3 font-mono font-bold text-brand-gold-dark">{supp.id}</td>
                      <td className="p-3 font-semibold text-brand-darkgreen">{supp.name}</td>
                      <td className="p-3 font-mono text-brand-charcoal/70">{supp.email}</td>
                      <td className="p-3 text-center">{supp.contact}</td>
                      <td className="p-3 text-right font-mono font-black text-red-700">
                        LKR {supp.balanceDue.toLocaleString()}
                      </td>
                    </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 3: CASH BOOK */}
        {activeBook === "Cash_Book" && (
          <div>
            <div className="flex justify-between items-center bg-green-50 px-4 py-3 rounded-lg text-xs mb-4 text-brand-green">
              <span>Estimated Physical Cash Counter Reserves:</span>
              <span className="font-mono font-black text-sm">
                LKR {db.ledger.filter(l => l.book === "Cash").reduce((sum, l) => sum + (l.type === "Debit" ? l.amount : -l.amount), 320000).toLocaleString()}
              </span>
            </div>
            
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 uppercase tracking-widest text-brand-darkgreen text-[10px] font-bold">
                  <th className="p-3">Reference Date</th>
                  <th className="p-3">Description</th>
                  <th className="p-3">Category</th>
                  <th className="p-3 text-center">Type</th>
                  <th className="p-3 text-right">Amount (LKR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {db.ledger
                  .filter(l => l.book === "Cash" && l.description.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map((entry, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/70">
                      <td className="p-3 font-mono">{entry.date}</td>
                      <td className="p-3 text-brand-darkgreen font-semibold">{entry.description}</td>
                      <td className="p-3 text-brand-charcoal/60">{entry.category}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          entry.type === "Debit" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        }`}>
                          {entry.type === "Debit" ? "IN (Debit)" : "OUT (Credit)"}
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-brand-darkgreen">
                        {entry.type === "Credit" ? "-" : "+"} LKR {entry.amount.toLocaleString()}
                      </td>
                    </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 4: BANK BOOK */}
        {activeBook === "Bank_Book" && (
          <div>
            <div className="flex justify-between items-center bg-blue-50 px-4 py-3 rounded-lg text-xs mb-4 text-blue-750">
              <span>National Bank of Ceylon Registered Balance:</span>
              <span className="font-mono font-black text-sm text-blue-900">
                LKR {db.ledger.filter(l => l.book === "Bank").reduce((sum, l) => sum + (l.type === "Debit" ? l.amount : -l.amount), 1450000).toLocaleString()}
              </span>
            </div>

            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 uppercase tracking-widest text-brand-darkgreen text-[10px] font-bold">
                  <th className="p-3">Reconciliation Date</th>
                  <th className="p-3">Reference / Wire Voucher</th>
                  <th className="p-3">Category</th>
                  <th className="p-3 text-center">Flow</th>
                  <th className="p-3 text-right">Sum (LKR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {db.ledger
                  .filter(l => l.book === "Bank" && l.description.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map((entry, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/70">
                      <td className="p-3 font-mono">{entry.date}</td>
                      <td className="p-3 text-brand-darkgreen font-semibold">{entry.description}</td>
                      <td className="p-3 text-brand-charcoal/60">{entry.category}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          entry.type === "Debit" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        }`}>
                          {entry.type === "Debit" ? "IN (Debit)" : "OUT (Credit)"}
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-brand-darkgreen">
                        {entry.type === "Credit" ? "-" : "+"} LKR {entry.amount.toLocaleString()}
                      </td>
                    </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 5: STOCK BOOK (LEDGER) */}
        {activeBook === "Stock_Book" && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 uppercase tracking-widest text-brand-darkgreen text-[10px] font-bold">
                  <th className="p-3">Warehouse ID</th>
                  <th className="p-3">Resource Name</th>
                  <th className="p-3 text-center">Current Total Stock</th>
                  <th className="p-3 text-center">Safety Lock Buffer</th>
                  <th className="p-3 text-center">Unit</th>
                  <th className="p-3 text-right">Expiration Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {/* Render Raw safety materials and completed spices in a beautiful combined ledger */}
                {db.raw_materials
                  .filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map(material => (
                    <tr key={material.id} className="hover:bg-gray-50/70 border-l-4 border-amber-500">
                      <td className="p-3 font-mono font-bold text-brand-gold-dark">{material.id}</td>
                      <td className="p-3 font-semibold text-brand-darkgreen">
                        {material.name} <span className="text-[10px] bg-amber-100 text-amber-800 px-1 py-0.2 rounded font-bold uppercase ml-1">Raw material</span>
                      </td>
                      <td className="p-3 text-center font-mono font-extrabold text-brand-darkgreen">{material.currentStock}</td>
                      <td className="p-3 text-center font-mono text-brand-charcoal/50">{material.safetyStock}</td>
                      <td className="p-3 text-center font-mono uppercase">{material.unit}</td>
                      <td className="p-3 text-right font-mono text-red-600">{material.expiryDate}</td>
                    </tr>
                ))}
                {db.products
                  .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map(prod => (
                    <tr key={prod.id} className="hover:bg-gray-50/70 border-l-4 border-green-700">
                      <td className="p-3 font-mono font-bold text-brand-gold-dark">{prod.id}</td>
                      <td className="p-3 font-semibold text-brand-darkgreen">
                        {prod.name} <span className="text-[10px] bg-green-100 text-green-800 px-1 py-0.2 rounded font-bold uppercase ml-1">Finished Spice</span>
                      </td>
                      <td className="p-3 text-center font-mono font-extrabold text-brand-darkgreen">{prod.currentStock}</td>
                      <td className="p-3 text-center font-mono text-brand-charcoal/50">1,000</td>
                      <td className="p-3 text-center font-mono uppercase">units</td>
                      <td className="p-3 text-right font-mono text-gray-400">---</td>
                    </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 6: INVOICE BOOK */}
        {activeBook === "Invoice_Book" && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 uppercase tracking-widest text-brand-darkgreen text-[10px] font-bold">
                  <th className="p-3">Debit Invoice ID</th>
                  <th className="p-3">Wholesale / Supermarket Entity</th>
                  <th className="p-3 text-center">Shipping Date</th>
                  <th className="p-3 text-center">Fulfillment Status</th>
                  <th className="p-3 text-right">Sum Total (LKR)</th>
                  <th className="p-3 text-center no-print">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {db.invoices
                  .filter(i => i.customerName.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map(inv => (
                    <tr key={inv.id} className="hover:bg-gray-50/70">
                      <td className="p-3 font-mono font-extrabold text-brand-darkgreen">{inv.invoiceNumber}</td>
                      <td className="p-3">
                        <div className="font-semibold text-brand-darkgreen">{inv.customerName}</div>
                      </td>
                      <td className="p-3 text-center font-mono">{inv.date}</td>
                      <td className="p-3 text-center flex justify-center mt-2.5">
                        {getStatusBadge(inv.paymentStatus)}
                      </td>
                      <td className="p-3 text-right font-mono font-black text-brand-darkgreen">
                        LKR {inv.totalAmount.toLocaleString()}
                      </td>
                      <td className="p-3 text-center no-print">
                        <button
                          onClick={() => onNavigateInvoice(inv)}
                          className="bg-brand-green hover:bg-brand-darkgreen text-brand-gold px-3 py-1.5 rounded-lg text-xs font-semibold transition"
                        >
                          Invoice Details
                        </button>
                      </td>
                    </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>

    </div>
  );
}
