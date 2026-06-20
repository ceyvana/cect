import React, { useState } from "react";
import { 
  Plus, Printer, Share2, Mail, PhoneCall, Check, DollarSign, 
  UserPlus, MapPin, Receipt, Star, ShieldCheck, Ticket, Calendar,
  Activity, ArrowRight, CornerDownRight, CheckCircle2
} from "lucide-react";
import { DbSchema, Customer, Product, Invoice } from "../types";

interface SalesViewProps {
  db: DbSchema;
  triggerDbRefresh: () => void;
  mutateDb: (endpoint: string, method: string, body: any) => Promise<any>;
  selectedInvoiceForDetail: Invoice | null;
  setSelectedInvoiceForDetail: (invoice: Invoice | null) => void;
}

export default function SalesView({ 
  db, 
  triggerDbRefresh, 
  mutateDb,
  selectedInvoiceForDetail,
  setSelectedInvoiceForDetail
}: SalesViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<"distributors" | "billing">("distributors");

  // Customer Registration States
  const [showCustModal, setShowCustModal] = useState(false);
  const [custName, setCustName] = useState("");
  const [custContact, setCustContact] = useState("");
  const [custRegion, setCustRegion] = useState("Colombo-1");
  const [custLimit, setCustLimit] = useState(1000000);
  const [custType, setCustType] = useState<"Wholesale" | "Retail" | "Distributor">("Distributor");

  // Invoice creation state
  const [billCustId, setBillCustId] = useState("CUST001");
  const [billItems, setBillItems] = useState<{ productId: string; qty: number }[]>([{ productId: "P001", qty: 100 }]);
  const [billDiscount, setBillDiscount] = useState(1000);

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: custName,
      contact: custContact,
      region: custRegion,
      creditLimit: Number(custLimit),
      balanceDue: 0,
      type: custType,
      loyaltyPoints: 100
    };

    await mutateDb("/api/db/customers", "POST", payload);
    setShowCustModal(false);
    triggerDbRefresh();
    alert(`Customer ${custName} registered successfully.`);
  };

  const handleBillItemRowChange = (idx: number, field: "productId" | "qty", val: string | number) => {
    const updated = [...billItems];
    updated[idx] = { ...updated[idx], [field]: val };
    setBillItems(updated);
  };

  const deleteBillItemRow = (idx: number) => {
    setBillItems(billItems.filter((_, i) => i !== idx));
  };

  const addBillItemRow = () => {
    setBillItems([...billItems, { productId: "P001", qty: 100 }]);
  };

  const submitInvoice = async () => {
    const targetCust = db.customers.find(c => c.id === billCustId);
    if (!targetCust) return;

    // Build items payload
    const itemsPayload = billItems.map(item => {
      const prod = db.products.find(p => p.id === item.productId || p.sku === item.productId);
      const priceSelected = targetCust.type === "Distributor" ? (prod ? prod.wholesalePrice : 300) : (prod ? prod.retailPrice : 355);
      return {
        productId: prod ? prod.sku : "CEY-SPICE",
        name: prod ? prod.name : "Ceylon Premium Spices",
        packSize: prod ? prod.packSize : "250g",
        qty: Number(item.qty),
        price: priceSelected,
        total: item.qty * priceSelected
      };
    });

    const subtotal = itemsPayload.reduce((sum, item) => sum + item.total, 0);
    const tax = Math.round(subtotal * 0.05); // 5% VAT
    const totalAmount = subtotal + tax - billDiscount;

    // Check credit limits
    if (targetCust.balanceDue + totalAmount > targetCust.creditLimit) {
      alert(`⚠️ TRANSACTION ABORTED: Distributor credit outstanding exceeds limits! Limit: LKR ${targetCust.creditLimit.toLocaleString()}, Current Balance: LKR ${targetCust.balanceDue.toLocaleString()}`);
      return;
    }

    const payload = {
      customerId: billCustId,
      customerName: targetCust.name,
      date: new Date().toISOString().split("T")[0],
      items: itemsPayload,
      subtotal,
      tax,
      discount: billDiscount,
      totalAmount,
      paymentStatus: "Pending",
      sharedWhatsApp: false,
      sharedEmail: false
    };

    const newInvoiceResult = await mutateDb("/api/db/invoices", "POST", payload);
    triggerDbRefresh();
    alert(`Invoice created successfully! Reference ID: ${newInvoiceResult.invoiceNumber}`);
    
    // Clear invoice inputs
    setBillItems([{ productId: "P001", qty: 100 }]);
    setBillDiscount(1000);
    // Examine created invoice immediately
    setSelectedInvoiceForDetail(newInvoiceResult);
  };

  const triggerChannelShare = async (channel: "whatsapp" | "email") => {
    if (!selectedInvoiceForDetail) return;
    await fetch(`/api/db/invoices/${selectedInvoiceForDetail.id}/toggle_share`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channel })
    });
    triggerDbRefresh();
    setSelectedInvoiceForDetail({
      ...selectedInvoiceForDetail,
      sharedWhatsApp: channel === "whatsapp" ? true : selectedInvoiceForDetail.sharedWhatsApp,
      sharedEmail: channel === "email" ? true : selectedInvoiceForDetail.sharedEmail
    } as any);
    alert(`Invoice dispatched successfully via dynamic ${channel} relay!`);
  };

  return (
    <div className="space-y-6" id="sales-distribution-view">
      
      {/* Tab select lines */}
      <div className="flex border-b border-gray-200 no-print">
        {[
          { key: "distributors", label: "Ceylon Supermarket Partners", icon: Star },
          { key: "billing", label: "Professional Invoice Generator", icon: Receipt },
        ].map(st => {
          const Icon = st.icon;
          return (
            <button
              key={st.key}
              onClick={() => {
                setActiveSubTab(st.key as any);
                setSelectedInvoiceForDetail(null);
              }}
              className={`py-3.5 px-6 font-display font-bold text-xs flex items-center gap-2 border-b-2 transition -mb-px ${
                activeSubTab === st.key && !selectedInvoiceForDetail
                  ? "border-brand-green text-brand-darkgreen font-semibold"
                  : "border-transparent text-brand-charcoal/50 hover:text-brand-darkgreen"
              }`}
            >
              <Icon className="w-4 h-4 text-brand-midgreen" />
              {st.label}
            </button>
          )
        })}
        {selectedInvoiceForDetail && (
          <span className="py-3.5 px-6 font-display font-black text-brand-darkgreen border-b-2 border-brand-gold text-xs flex items-center gap-2 -mb-px">
            <Activity className="w-4 h-4 text-brand-gold animate-pulse" />
            Invoice Ledger Preview
          </span>
        )}
      </div>

      {/* Invoice focused detail popup card (Print layout standard) */}
      {selectedInvoiceForDetail ? (
        <div className="space-y-4">
          
          <div className="flex justify-between items-center no-print">
            <button
              onClick={() => setSelectedInvoiceForDetail(null)}
              className="text-xs bg-gray-50 text-brand-darkgreen border border-gray-300 font-bold px-4 py-2 rounded-xl hover:bg-gray-100 transition"
            >
              ← Back to Sales Desk
            </button>

            <div className="flex gap-2">
              <button
                onClick={() => window.print()}
                className="bg-brand-green text-brand-gold font-bold text-xs py-2 px-4 rounded-xl flex items-center gap-1.5 hover:bg-brand-darkgreen transition"
              >
                <Printer className="w-4 h-4" />
                Print / Save PDF
              </button>
              <button
                onClick={() => triggerChannelShare("whatsapp")}
                className="bg-brand-emerald text-white font-bold text-xs py-2 px-4 rounded-xl flex items-center gap-1.5 hover:bg-emerald-700 transition"
              >
                <PhoneCall className="w-4 h-4" />
                Share WhatsApp
              </button>
              <button
                onClick={() => triggerChannelShare("email")}
                className="bg-blue-600 text-white font-bold text-xs py-2 px-4 rounded-xl flex items-center gap-1.5 hover:bg-blue-700 transition"
              >
                <Mail className="w-4 h-4" />
                Share Email
              </button>
            </div>
          </div>

          {/* High fidelity Printable Invoice Document */}
          <div className="bg-white p-8 rounded-2xl border border-gray-300 shadow-lg invoice-print max-w-4xl mx-auto space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 left-0 h-4 bg-brand-green"></div>
            
            {/* Header branding */}
            <div className="flex flex-col md:flex-row justify-between items-start pt-2 gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-display font-black tracking-tight text-brand-darkgreen">CEYVANA</span>
                  <span className="text-[9px] uppercase tracking-widest text-brand-gold font-extrabold border border-brand-gold px-1.5 py-0.2 rounded font-sans">
                    Premium Quality
                  </span>
                </div>
                <p className="text-[10px] text-gray-500 mt-1 leading-relaxed">
                  CEYVANA Premium Ceylon Spices Manufacturing Co.<br />
                  Galle Fort Warehouses & Mills Center, Sri Lanka<br />
                  Web: www.ceyvana.lk | Email: billings@ceyvana.lk
                </p>
              </div>

              {/* QR Code section */}
              <div className="text-right flex items-center gap-2 bg-gray-50 border p-2.5 rounded-xl border-gray-200">
                <div className="font-sans text-[9px] text-right">
                  <p className="font-bold text-brand-darkgreen">Scan to Verify Pay</p>
                  <p className="text-gray-400 font-mono mt-0.5">{selectedInvoiceForDetail.invoiceNumber}</p>
                </div>
                {/* Dynamically styled responsive SVG QR Block */}
                <div className="w-12 h-12 border border-gray-300 p-0.5 bg-white rounded">
                  <svg viewBox="0 0 100 100" className="w-full h-full text-brand-darkgreen" fill="currentColor">
                    <rect x="0" y="0" width="25" height="25" />
                    <rect x="75" y="0" width="25" height="25" />
                    <rect x="0" y="75" width="25" height="25" />
                    <rect x="35" y="35" width="30" height="30" />
                    <rect x="15" y="55" width="10" height="10" />
                    <rect x="55" y="75" width="15" height="20" />
                    <rect x="80" y="45" width="15" height="10" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Billing fields details */}
            <div className="grid grid-cols-2 gap-4 border-t border-b border-gray-200 py-4 text-xs">
              <div>
                <span className="text-gray-400 block uppercase tracking-wider text-[9px] font-semibold">BILLED TO:</span>
                <p className="font-bold text-brand-darkgreen text-sm mt-0.5">{selectedInvoiceForDetail.customerName}</p>
                <p className="text-gray-500 mt-0.5">Sri Lanka Authorized Spice Distributor</p>
              </div>

              <div className="text-right">
                <span className="text-gray-400 block uppercase tracking-wider text-[9px] font-semibold">VOUCHER INDICES:</span>
                <p className="font-mono text-brand-darkgreen font-black text-sm mt-0.5">{selectedInvoiceForDetail.invoiceNumber}</p>
                <p className="text-gray-500 font-mono mt-1">Date Issued: {selectedInvoiceForDetail.date}</p>
              </div>
            </div>

            {/* Line items list */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-brand-darkgreen uppercase font-bold text-[9px] tracking-wider">
                    <th className="p-3">Branded SKU Reference</th>
                    <th className="p-3 text-center">Pack Size</th>
                    <th className="p-3 text-center">Wholesale Unit Price</th>
                    <th className="p-3 text-center">Qty Purchased</th>
                    <th className="p-3 text-right">Sum Total (LKR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {selectedInvoiceForDetail.items.map((line, lid) => (
                    <tr key={lid}>
                      <td className="p-3">
                        <div className="font-semibold text-brand-darkgreen">{line.name}</div>
                        <div className="text-[9px] font-mono text-gray-400">{line.productId}</div>
                      </td>
                      <td className="p-3 text-center font-semibold">{line.packSize}</td>
                      <td className="p-3 text-center font-mono">LKR {line.price.toLocaleString()}</td>
                      <td className="p-3 text-center font-mono">{line.qty.toLocaleString()} units</td>
                      <td className="p-3 text-right font-mono font-bold text-brand-darkgreen">LKR {line.total.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals box */}
            <div className="border-t border-gray-200 pt-4 flex flex-col items-end gap-1.5 text-xs">
              <div className="flex justify-between w-64 text-gray-500">
                <span>Subtotal amount:</span>
                <span className="font-mono">LKR {selectedInvoiceForDetail.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between w-64 text-gray-500">
                <span>Sri Lanka VAT (5.00%):</span>
                <span className="font-mono">+ LKR {selectedInvoiceForDetail.tax.toLocaleString()}</span>
              </div>
              <div className="flex justify-between w-64 text-gray-500">
                <span>Discount Applied:</span>
                <span className="font-mono text-red-650">- LKR {selectedInvoiceForDetail.discount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between w-64 pt-2 border-t border-gray-300 font-extrabold text-brand-darkgreen text-sm flex items-center">
                <span>TOTAL PAY DUE:</span>
                <span className="font-mono font-black text-[#155d3b]">LKR {selectedInvoiceForDetail.totalAmount.toLocaleString()}</span>
              </div>
            </div>

            {/* Footer clauses */}
            <div className="border-t border-dashed border-gray-200 pt-4 text-center text-xs text-gray-400 space-y-1">
              <div className="flex h-3 justify-center items-center gap-1.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-brand-emerald"></span>
                <span className="text-[10px] uppercase tracking-widest text-brand-darkgreen font-bold">CEYVANA Official Dispatch Ledger Verified</span>
              </div>
              <p className="text-[10px] font-serif">"CEYVANA Ceylon Spices - Taste of Spice Majesty in Sri Lanka"</p>
            </div>

          </div>

        </div>
      ) : (
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
          
          {/* TAB 1: SUPERMARKET PARTNERS AND DISTRIBUTORS OUTSTANDING BALANCES */}
          {activeSubTab === "distributors" && (
            <div className="space-y-4">
              
              <div className="flex justify-between items-center">
                <span className="text-xs text-brand-charcoal/50">Sri Lankan wholesale clients and grocery chain distribution limits</span>
                
                <button
                  onClick={() => setShowCustModal(true)}
                  className="bg-brand-green text-brand-gold font-display font-extrabold text-xs px-4 py-2.5 rounded-xl hover:bg-brand-darkgreen transition flex items-center gap-1"
                >
                  <UserPlus className="w-4 h-4" />
                  Register Supermarket Client
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {db.customers.map(cust => (
                  <div key={cust.id} className="border border-gray-150 rounded-2xl p-4 bg-gradient-to-b from-white to-brand-cream/5 hover:border-brand-gold/40 hover:shadow-md transition space-y-3">
                    
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-mono text-[10px] text-brand-gold-dark font-extrabold">{cust.id}</span>
                        <h4 className="text-sm font-display font-bold text-brand-darkgreen mt-1">{cust.name}</h4>
                        <span className="flex items-center gap-1 text-[10px] text-brand-charcoal/60 mt-1">
                          <MapPin className="w-3 h-3 text-brand-midgreen" />
                          Region: {cust.region}
                        </span>
                      </div>
                      
                      <span className="bg-emerald-50 text-brand-emerald px-2 py-0.5 rounded text-[9px] font-black uppercase">
                        {cust.type}
                      </span>
                    </div>

                    <div className="bg-white p-2.5 rounded-xl border border-gray-100 text-xs">
                      <div className="flex justify-between text-[11px] text-brand-charcoal/40 mb-1">
                        <span>Distributor Credit Remaining:</span>
                        <span className="font-mono">Limit: LKR {(cust.creditLimit / 100000).toFixed(0)} Lakhs</span>
                      </div>
                      <div className="flex justify-between items-baseline">
                        <span className="text-[10px] text-brand-charcoal/50">Outstanding Receivable:</span>
                        <span className={`font-mono font-black ${cust.balanceDue > cust.creditLimit ? "text-red-700 font-extrabold" : "text-brand-darkgreen"}`}>
                          LKR {cust.balanceDue.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-1.5 border-t border-gray-100 text-xs text-brand-charcoal/50">
                      <span className="flex items-center gap-1 text-[10px]">
                        <Star className="w-3.5 h-3.5 text-brand-gold fill-brand-gold" />
                        Loyalty Ledger: <b>{cust.loyaltyPoints} points</b>
                      </span>
                      <span className="text-[10px]">Ph: {cust.contact}</span>
                    </div>

                  </div>
                ))}
              </div>

            </div>
          )}

          {/* TAB 2: INTERACTIVE BILLING INVOICE MAKER */}
          {activeSubTab === "billing" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Form: construct products items */}
              <div className="lg:col-span-1 bg-brand-cream/20 p-5 rounded-2xl border border-brand-gold/15 space-y-4">
                <h3 className="text-xs uppercase font-extrabold tracking-widest text-brand-darkgreen pb-2 border-b border-brand-gold/10">
                  Construct Distributor Bill Invoice
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-brand-charcoal/50 uppercase block mb-1">supermarket Client Entity</label>
                    <select
                      value={billCustId}
                      onChange={e => setBillCustId(e.target.value)}
                      className="w-full bg-white border border-gray-300 rounded-xl px-2.5 py-2 text-xs focus:ring-1 focus:ring-brand-gold outline-none text-brand-charcoal"
                    >
                      {db.customers.map(c => (
                        <option key={c.id} value={c.id}>{c.name} ({c.type})</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] font-bold text-brand-charcoal/50 uppercase font-sans">Sales Spice Pack Line</span>
                      <button onClick={addBillItemRow} className="text-[10px] font-bold text-brand-midgreen hover:underline flex items-center gap-0.5">
                        <Plus className="w-3 h-3" /> Add item
                      </button>
                    </div>

                    {billItems.map((row, idx) => (
                      <div key={idx} className="flex gap-2 items-center bg-white p-2 border border-gray-200 rounded-xl relative group">
                        <select
                          value={row.productId}
                          onChange={e => handleBillItemRowChange(idx, "productId", e.target.value)}
                          className="flex-1 bg-transparent text-[11px] outline-none text-brand-charcoal focus:ring-0 cursor-pointer"
                        >
                          {db.products.map(p => (
                            <option key={p.id} value={p.id}>{p.name} ({p.packSize})</option>
                          ))}
                        </select>
                        <input
                          type="number"
                          value={row.qty}
                          onChange={e => handleBillItemRowChange(idx, "qty", Number(e.target.value))}
                          placeholder="qty"
                          className="w-14 text-center font-mono text-[11px] outline-none border-l border-gray-200 text-brand-charcoal"
                        />
                        {billItems.length > 1 && (
                          <button onClick={() => deleteBillItemRow(idx)} className="text-red-500 hover:text-red-800 text-[10px] px-1 font-bold">×</button>
                        )}
                      </div>
                    ))}
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-brand-charcoal/50 uppercase block mb-1">Commercial Discount (LKR)</label>
                    <input
                      type="number"
                      value={billDiscount}
                      onChange={e => setBillDiscount(Number(e.target.value))}
                      className="w-full bg-white border border-gray-300 rounded-xl px-2.5 py-2 text-xs focus:ring-1 focus:ring-brand-gold outline-none text-brand-charcoal font-mono"
                    />
                  </div>

                  <button
                    onClick={submitInvoice}
                    className="w-full bg-brand-green hover:bg-brand-darkgreen text-brand-gold font-bold text-xs py-2.5 rounded-xl transition shadow-md mt-2"
                  >
                    Generate Commercial Invoice
                  </button>
                </div>

              </div>

              {/* Right: real time calculation guidelines preview */}
              <div className="lg:col-span-2">
                <div className="border border-brand-gold/20 p-5 rounded-2xl bg-white shadow-sm space-y-4">
                  <h3 className="text-xs uppercase font-extrabold tracking-widest text-brand-darkgreen pb-2 border-b border-gray-150">
                    Calculated Sales pricing Guideline
                  </h3>

                  <div className="bg-brand-cream/15 p-4 rounded-xl text-xs space-y-2.5 border border-brand-gold/15">
                    <p className="font-bold text-brand-darkgreen uppercase tracking-wide text-[10px] flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-brand-gold" />
                      Automatic Wholesale Pricing Policies:
                    </p>
                    <p className="text-brand-charcoal/60 leading-relaxed">
                      SUPERMARKETS registered under "Distributor" profiles (like Keells Supermarkets Holdings or Cargills Food City PLC) are automatically charged <b>Wholesale Prices</b> instead of standard retail margins.
                    </p>
                    <p className="text-brand-charcoal/60 leading-relaxed border-t border-brand-gold/10 pt-2 font-semibold">
                      This transaction will automatically adjust finished product warehouse inventory buffers on submit, and register corresponding receivables debit values in the General Ledger.
                    </p>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>
      )}

      {/* --- ADD CUSTOMER MODAL --- */}
      {showCustModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full border border-gray-200 p-6 space-y-4">
            <h3 className="text-md font-display font-black text-brand-darkgreen">Supermarket Registration</h3>

            <form onSubmit={handleCreateCustomer} className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-gray-500 block mb-1 uppercase">Chain Name</label>
                <input
                  type="text"
                  required
                  value={custName}
                  onChange={e => setCustName(e.target.value)}
                  placeholder="e.g. Laughs Supermarkets Holdings"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-brand-gold outline-none text-brand-charcoal"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-500 block mb-1 uppercase">Contact number</label>
                <input
                  type="text"
                  required
                  value={custContact}
                  onChange={e => setCustContact(e.target.value)}
                  placeholder="e.g. +94112003004"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-brand-gold outline-none text-brand-charcoal"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-500 block mb-1 uppercase">Region</label>
                  <input
                    type="text"
                    required
                    value={custRegion}
                    onChange={e => setCustRegion(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-brand-gold outline-none text-brand-charcoal"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 block mb-1 uppercase">Credit Limit LKR</label>
                  <input
                    type="number"
                    required
                    value={custLimit}
                    onChange={e => setCustLimit(Number(e.target.value))}
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-xs text-center focus:ring-1 focus:ring-brand-gold outline-none text-brand-charcoal"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-500 block mb-1 uppercase">Client pricing level</label>
                <select
                  value={custType}
                  onChange={e => setCustType(e.target.value as any)}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-brand-gold outline-none text-brand-charcoal"
                >
                  <option value="Distributor">Distributor (Wholesale rate)</option>
                  <option value="Wholesale">Wholesale store</option>
                  <option value="Retail">Retail store (Normal rate)</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowCustModal(false)}
                  className="px-4 py-2 bg-gray-100 text-brand-charcoal rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-green hover:bg-brand-darkgreen text-brand-gold rounded-xl text-xs font-bold"
                >
                  Register Partner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
