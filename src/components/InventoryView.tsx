import React, { useState } from "react";
import { 
  Plus, Search, Edit2, Trash2, Check, HelpCircle, 
  Package, AlertTriangle, FileText, CheckCircle, Barcode, 
  QrCode, Scale, ShieldAlert, Award
} from "lucide-react";
import { DbSchema, RawMaterial, Product, Supplier } from "../types";

interface InventoryViewProps {
  db: DbSchema;
  triggerDbRefresh: () => void;
  mutateDb: (endpoint: string, method: string, body: any) => Promise<any>;
}

export default function InventoryView({ db, triggerDbRefresh, mutateDb }: InventoryViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<"products" | "raw_materials" | "po">("products");
  const [searchTerm, setSearchTerm] = useState("");

  // Product Modals & fields state
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [pName, setPName] = useState("");
  const [pCategory, setPCategory] = useState("Ground Spices");
  const [pPackSize, setPPackSize] = useState("250g");
  const [pCostPrice, setPCostPrice] = useState(200);
  const [pRetailPrice, setPRetailPrice] = useState(350);
  const [pWholesalePrice, setPWholesalePrice] = useState(280);
  const [pStock, setPStock] = useState(1000);

  // Raw Materials Modals & fields state
  const [showRMModal, setShowRMModal] = useState(false);
  const [rmName, setRmName] = useState("");
  const [rmStock, setRmStock] = useState(500);
  const [rmUnit, setRmUnit] = useState("kg");
  const [rmSafety, setRmSafety] = useState(100);
  const [rmCost, setRmCost] = useState(400);
  const [rmSupplierId, setRmSupplierId] = useState("SUP001");
  const [rmExpiry, setRmExpiry] = useState("2027-06-20");

  // Purchase Order Form State
  const [poSupplierId, setPoSupplierId] = useState("SUP001");
  const [poItems, setPoItems] = useState<{ rawMaterialId: string; qty: number }[]>([{ rawMaterialId: "RM001", qty: 250 }]);

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const skuCandidate = `CEY-${pName.substring(8, 11).toUpperCase()}-${pPackSize.toUpperCase()}`;
    const payload = {
      name: pName,
      category: pCategory,
      packSize: pPackSize,
      costPrice: Number(pCostPrice),
      retailPrice: Number(pRetailPrice),
      wholesalePrice: Number(pWholesalePrice),
      currentStock: Number(pStock),
      sku: skuCandidate
    };

    if (selectedProduct) {
      await mutateDb(`/api/db/products/${selectedProduct.id}`, "PUT", payload);
    } else {
      await mutateDb("/api/db/products", "POST", payload);
    }
    
    // Close & reset
    setShowProductModal(false);
    setSelectedProduct(null);
    triggerDbRefresh();
  };

  const handleRMSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: rmName,
      currentStock: Number(rmStock),
      unit: rmUnit,
      safetyStock: Number(rmSafety),
      costPerKg: Number(rmCost),
      supplierId: rmSupplierId,
      expiryDate: rmExpiry,
      batchCode: `${rmName.substring(0, 3).toUpperCase()}-RAW-${Math.floor(10 + Math.random() * 90)}`
    };

    await mutateDb("/api/api/db/raw_materials", "POST", payload);
    setShowRMModal(false);
    triggerDbRefresh();
  };

  const deleteProduct = async (id: string) => {
    if (confirm("Permanently strip this product from the master spice ledger?")) {
      await mutateDb(`/api/db/products/${id}`, "DELETE", {});
      triggerDbRefresh();
    }
  };

  const handlePOItemChange = (idx: number, field: "rawMaterialId" | "qty", val: string | number) => {
    const updated = [...poItems];
    updated[idx] = { ...updated[idx], [field]: val };
    setPoItems(updated);
  };

  const addPOItemRow = () => {
    setPoItems([...poItems, { rawMaterialId: "RM001", qty: 200 }]);
  };

  const handleCreatePO = async () => {
    const supp = db.suppliers.find(s => s.id === poSupplierId);
    if (!supp) return;

    const itemsPayload = poItems.map(item => {
      const rm = db.raw_materials.find(x => x.id === item.rawMaterialId);
      const unitCost = rm ? rm.costPerKg : 300;
      return {
        rawMaterialId: item.rawMaterialId,
        name: rm ? rm.name : "Raw Material",
        qty: Number(item.qty),
        unitCost,
        total: item.qty * unitCost
      };
    });

    const totalAmount = itemsPayload.reduce((sum, item) => sum + item.total, 0);

    const payload = {
      supplierId: poSupplierId,
      supplierName: supp.name,
      date: new Date().toISOString().split("T")[0],
      items: itemsPayload,
      totalAmount,
      status: "Pending"
    };

    await mutateDb("/api/db/purchase_orders", "POST", payload);
    triggerDbRefresh();
    alert(`Purchase Order drafted successfully towards ${supp.name}.`);
    setPoItems([{ rawMaterialId: "RM001", qty: 250 }]);
  };

  const completePOReceipt = async (poId: string) => {
    await mutateDb(`/api/db/purchase_orders/${poId}/receive`, "PUT", {});
    triggerDbRefresh();
    alert("Raw material shipments checked & reconciled into active stocks successfully.");
  };

  return (
    <div className="space-y-6" id="inventory-view-root">
      
      {/* Sub tabs line */}
      <div className="flex border-b border-gray-200">
        {[
          { key: "products", label: "Branded Finished Spices", icon: Award },
          { key: "raw_materials", label: "Raw Plant Materials", icon: Scale },
          { key: "po", label: "Supplier Procurement Orders", icon: FileText },
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

      {/* Main content layer */}
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
        
        {/* --- PRODUCTS REGISTER --- */}
        {activeSubTab === "products" && (
          <div className="space-y-4">
            
            {/* Header tools */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 text-brand-charcoal/30 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search products by branded SKU or category..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="bg-gray-50 border border-gray-300 rounded-xl pl-9 pr-4 py-2 text-xs focus:ring-1 focus:ring-brand-gold outline-none w-full text-brand-charcoal"
                />
              </div>

              <button
                onClick={() => {
                  setSelectedProduct(null);
                  setPName("");
                  setPCategory("Ground Spices");
                  setPPackSize("250g");
                  setPCostPrice(200);
                  setPRetailPrice(320);
                  setPWholesalePrice(260);
                  setPStock(1000);
                  setShowProductModal(true);
                }}
                className="bg-brand-green text-brand-gold font-display font-extrabold text-xs px-4 py-2.5 rounded-xl hover:bg-brand-darkgreen transition flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Add Branded Spice Item
              </button>
            </div>

            {/* Grid distribution */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              {db.products
                .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.category.toLowerCase().includes(searchTerm.toLowerCase()))
                .map(prod => {
                  const profitLkr = prod.wholesalePrice - prod.costPrice;
                  const profitMargin = ((profitLkr / prod.wholesalePrice) * 100).toFixed(1);
                  
                  return (
                    <div key={prod.id} className="border border-gray-150 rounded-2xl p-4 hover:border-brand-gold/40 hover:shadow-md transition bg-gradient-to-b from-white to-brand-cream/10 space-y-3 relative group">
                      
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] bg-brand-green/5 text-brand-midgreen font-bold px-2 py-0.5 rounded-full uppercase">
                            {prod.category}
                          </span>
                          <h4 className="text-sm font-display font-bold text-brand-darkgreen mt-1.5 leading-snug">
                            {prod.name}
                          </h4>
                        </div>
                        <span className="font-mono text-xs text-brand-gold-dark font-extrabold">{prod.packSize}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] bg-white p-2.5 rounded-xl border border-gray-100">
                        <div>
                          <span className="text-brand-charcoal/40 text-[9px] block">COST PRICE</span>
                          <span className="font-mono font-bold text-brand-charcoal">LKR {prod.costPrice}</span>
                        </div>
                        <div>
                          <span className="text-brand-charcoal/40 text-[9px] block">WHOLESALE</span>
                          <span className="font-mono font-black text-brand-green">LKR {prod.wholesalePrice}</span>
                        </div>
                        <div className="col-span-2 border-t border-gray-100 pt-1.5 flex justify-between items-center text-[10px]">
                          <span className="text-brand-emerald bg-brand-emerald/10 px-1 py-0.2 rounded font-bold">LKR {profitLkr} gain ({profitMargin}%)</span>
                          <span className="text-gray-400">Retail: LKR {prod.retailPrice}</span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center border-t border-dashed border-gray-200 pt-2 text-xs">
                        <div>
                          <span className="text-[10px] text-brand-charcoal/50">Warehouse Stock</span>
                          <div className={`font-mono font-black ${prod.currentStock < 1000 ? "text-red-600 animate-pulse" : "text-brand-darkgreen"}`}>
                            {prod.currentStock.toLocaleString()} units
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setSelectedProduct(prod);
                              setPName(prod.name);
                              setPCategory(prod.category);
                              setPPackSize(prod.packSize);
                              setPCostPrice(prod.costPrice);
                              setPRetailPrice(prod.retailPrice);
                              setPWholesalePrice(prod.wholesalePrice);
                              setPStock(prod.currentStock);
                              setShowProductModal(true);
                            }}
                            className="p-1.5 text-brand-charcoal hover:bg-gray-100 rounded-lg transition"
                            title="Edit Product"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteProduct(prod.id)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"
                            title="Delete Product"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Barcode representation */}
                      <div className="bg-gray-50 p-2 rounded-lg flex items-center justify-between border border-gray-200 text-[10px] font-mono select-all">
                        <span className="flex items-center gap-1 text-[9px] text-brand-charcoal/50">
                          <Barcode className="w-3.5 h-3.5" />
                          UPC:
                        </span>
                        <span>{prod.barcode}</span>
                      </div>
                    </div>
                  )
                })}
            </div>

          </div>
        )}

        {/* --- RAW MATERIALS REGISTER --- */}
        {activeSubTab === "raw_materials" && (
          <div className="space-y-4">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <span className="text-xs text-brand-charcoal/50">Spice plant components sieved & dry in Galle roller warehouses</span>

              <button
                onClick={() => setShowRMModal(true)}
                className="bg-brand-green/5 hover:bg-brand-green/10 text-brand-midgreen border border-brand-green/20 font-display font-extrabold text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Register Dry Raw Stock
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-brand-darkgreen uppercase text-[10px] font-bold tracking-widest">
                    <th className="p-3">RM Code</th>
                    <th className="p-3">Material Name</th>
                    <th className="p-3 text-center">In-Stock Balance</th>
                    <th className="p-3 text-center">Safety Target</th>
                    <th className="p-3 text-center">Purchase Cost</th>
                    <th className="p-3 text-center">Expiration Alert</th>
                    <th className="p-3 text-right">Compliance Grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {db.raw_materials.map((rm, i) => {
                    const isAlert = rm.currentStock <= rm.safetyStock;
                    return (
                      <tr key={i} className={`hover:bg-gray-50/70 ${isAlert ? "bg-red-50/30" : ""}`}>
                        <td className="p-3 font-mono font-bold text-brand-gold-dark">{rm.id}</td>
                        <td className="p-3">
                          <div className="font-semibold text-brand-darkgreen">{rm.name}</div>
                          <div className="text-[9px] text-brand-charcoal/40 font-mono">Batch Code: {rm.batchCode}</div>
                        </td>
                        <td className="p-3 text-center">
                          <span className={`font-mono font-extrabold text-xs ${isAlert ? "text-red-700 animate-pulse" : "text-brand-darkgreen"}`}>
                            {rm.currentStock.toLocaleString()}
                          </span>
                        </td>
                        <td className="p-3 text-center font-mono text-brand-charcoal/40">{rm.safetyStock}</td>
                        <td className="p-3 text-center font-mono font-semibold text-brand-charcoal">LKR {rm.costPerKg}/{rm.unit}</td>
                        <td className="p-3 text-center">
                          <span className="font-mono text-red-600 font-medium">{rm.expiryDate}</span>
                        </td>
                        <td className="p-3 text-right">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                            isAlert ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"
                          }`}>
                            {isAlert ? "RESTOCK REQUIRED" : "COMPLIANT-OK"}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* --- SUPPLIER PURCHASE ORDERS (PO) --- */}
        {activeSubTab === "po" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Draft PO Form */}
            <div className="lg:col-span-1 bg-brand-cream/20 p-5 rounded-xl border border-brand-gold/15 space-y-4">
              <h3 className="text-xs uppercase font-extrabold tracking-widest text-brand-darkgreen pb-2 border-b border-brand-gold/10">
                Draft Farm Procurement Order
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-brand-charcoal/50 uppercase block mb-1">Select Herb Supplier</label>
                  <select
                    value={poSupplierId}
                    onChange={e => setPoSupplierId(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-brand-gold outline-none text-brand-charcoal"
                  >
                    {db.suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-brand-charcoal/50 uppercase block flex justify-between">
                    Raw Components Requested
                    <button onClick={addPOItemRow} className="text-brand-midgreen hover:underline">Add Spice Row</button>
                  </label>

                  {poItems.map((row, idx) => (
                    <div key={idx} className="flex gap-2">
                      <select
                        value={row.rawMaterialId}
                        onChange={e => handlePOItemChange(idx, "rawMaterialId", e.target.value)}
                        className="flex-1 bg-white border border-gray-300 rounded-xl px-2 py-1.5 text-xs focus:ring-1 focus:ring-brand-gold outline-none text-brand-charcoal"
                      >
                        {db.raw_materials.map(rm => (
                          <option key={rm.id} value={rm.id}>{rm.name} (LKR {rm.costPerKg}/kg)</option>
                        ))}
                      </select>
                      <input
                        type="number"
                        value={row.qty}
                        onChange={e => handlePOItemChange(idx, "qty", Number(e.target.value))}
                        className="w-20 bg-white border border-gray-300 rounded-xl px-2 py-1.5 text-xs text-center focus:ring-1 focus:ring-brand-gold outline-none text-brand-charcoal"
                      />
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleCreatePO}
                  className="w-full bg-brand-green hover:bg-brand-darkgreen text-brand-gold font-bold text-xs py-2.5 rounded-xl transition shadow-md mt-2"
                >
                  Issue Purchase Order
                </button>
              </div>

            </div>

            {/* List current POs */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-xs uppercase font-extrabold tracking-widest text-brand-darkgreen">Procurement Order Queue</h3>
              
              <div className="space-y-3">
                {db.purchase_orders.map(po => (
                  <div key={po.id} className="border border-gray-200 rounded-xl p-4 space-y-2 relative bg-white">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-mono text-xs font-bold text-brand-darkgreen">{po.poNumber}</span>
                        <p className="text-xs text-brand-charcoal/60 mt-0.5">Supplier: <span className="font-semibold text-brand-darkgreen">{po.supplierName}</span></p>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                        po.status === "Received" ? "bg-green-150 text-green-800" : "bg-amber-100 text-amber-800"
                      }`}>
                        {po.status}
                      </span>
                    </div>

                    <div className="space-y-1 py-2 border-t border-b border-gray-100 my-2">
                      {po.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs text-brand-charcoal/80">
                          <span>{item.qty} kg × {item.name}</span>
                          <span className="font-mono">LKR {(item.qty * item.unitCost).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      <div>
                        <span className="text-[10px] text-brand-charcoal/40 block">TOTAL VAL</span>
                        <span className="font-mono font-extrabold text-brand-darkgreen">LKR {po.totalAmount.toLocaleString()}</span>
                      </div>

                      {po.status === "Pending" && (
                        <button
                          onClick={() => completePOReceipt(po.id)}
                          className="bg-brand-gold hover:bg-brand-gold-dark text-white font-semibold text-[11px] px-3 py-1.5 rounded-lg transition flex items-center gap-1"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          Reconcile shipment
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

            </div>

          </div>
        )}

      </div>

      {/* --- ADD PRODUCT MODAL --- */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full border border-gray-200 shadow-2xl p-6 space-y-4">
            <h3 className="text-md font-display font-black text-brand-darkgreen tracking-tight">
              {selectedProduct ? "Edit Finished Spice Line" : "Create Finished Spice Line"}
            </h3>

            <form onSubmit={handleProductSubmit} className="space-y-3.5">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Branded Item Title</label>
                <input
                  type="text"
                  required
                  value={pName}
                  onChange={e => setPName(e.target.value)}
                  placeholder="e.g. CEYVANA Cinnamon Powder"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-brand-gold outline-none text-brand-charcoal"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Category</label>
                  <select
                    value={pCategory}
                    onChange={e => setPCategory(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-brand-gold outline-none text-brand-charcoal"
                  >
                    <option value="Ground Spices">Ground Spices</option>
                    <option value="Blended Spices">Blended Spices</option>
                    <option value="Whole Spices">Whole Spices</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Pack Size</label>
                  <select
                    value={pPackSize}
                    onChange={e => setPPackSize(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-brand-gold outline-none text-brand-charcoal"
                  >
                    <option value="100g">100g</option>
                    <option value="250g">250g</option>
                    <option value="500g">500g</option>
                    <option value="1kg">1kg</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Cost LKR</label>
                  <input
                    type="number"
                    required
                    value={pCostPrice}
                    onChange={e => setPCostPrice(Number(e.target.value))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-center focus:ring-1 focus:ring-brand-gold outline-none text-brand-charcoal"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Wholesale LKR</label>
                  <input
                    type="number"
                    required
                    value={pWholesalePrice}
                    onChange={e => setPWholesalePrice(Number(e.target.value))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-center focus:ring-1 focus:ring-brand-gold outline-none text-brand-charcoal"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Retail LKR</label>
                  <input
                    type="number"
                    required
                    value={pRetailPrice}
                    onChange={e => setPRetailPrice(Number(e.target.value))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-center focus:ring-1 focus:ring-brand-gold outline-none text-brand-charcoal"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Starting Stock units</label>
                <input
                  type="number"
                  required
                  value={pStock}
                  onChange={e => setPStock(Number(e.target.value))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-brand-gold outline-none text-brand-charcoal"
                />
              </div>

              <div className="flex gap-2 pt-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="px-4 py-2 bg-gray-100 text-brand-charcoal rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-green hover:bg-brand-darkgreen text-brand-gold rounded-xl text-xs font-bold"
                >
                  Save Branded Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- ADD RAW MATERIAL MODAL --- */}
      {showRMModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full border border-gray-200 p-6 space-y-4">
            <h3 className="text-md font-display font-black text-brand-darkgreen">Register Dry Raw Stock</h3>

            <form onSubmit={handleRMSubmit} className="space-y-3.5">
              <div>
                <label className="text-[10px] font-bold text-gray-500 block mb-1 uppercase">Material Name</label>
                <input
                  type="text"
                  required
                  value={rmName}
                  onChange={e => setRmName(e.target.value)}
                  placeholder="e.g. Cardamom Seeds (Matale Grade)"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-brand-gold outline-none text-brand-charcoal"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-500 block mb-1 uppercase">Initial Weight</label>
                  <input
                    type="number"
                    required
                    value={rmStock}
                    onChange={e => setRmStock(Number(e.target.value))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-center focus:ring-1 focus:ring-brand-gold outline-none text-brand-charcoal"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 block mb-1 uppercase">Unit</label>
                  <input
                    type="text"
                    required
                    value={rmUnit}
                    onChange={e => setRmUnit(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-center focus:ring-1 focus:ring-brand-gold outline-none text-brand-charcoal"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-500 block mb-1 uppercase">Cost Per Unit LKR</label>
                  <input
                    type="number"
                    required
                    value={rmCost}
                    onChange={e => setRmCost(Number(e.target.value))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-center focus:ring-1 focus:ring-brand-gold outline-none text-brand-charcoal"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 block mb-1 uppercase">Safety Target</label>
                  <input
                    type="number"
                    required
                    value={rmSafety}
                    onChange={e => setRmSafety(Number(e.target.value))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-center focus:ring-1 focus:ring-brand-gold outline-none text-brand-charcoal"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-500 block mb-1 uppercase">Supplier Code</label>
                  <select
                    value={rmSupplierId}
                    onChange={e => setRmSupplierId(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-brand-gold outline-none text-brand-charcoal"
                  >
                    {db.suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 block mb-1 uppercase">Expiry Date</label>
                  <input
                    type="date"
                    required
                    value={rmExpiry}
                    onChange={e => setRmExpiry(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-center focus:ring-1 focus:ring-brand-gold outline-none text-brand-charcoal"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowRMModal(false)}
                  className="px-4 py-2 bg-gray-100 text-brand-charcoal rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-green hover:bg-brand-darkgreen text-brand-gold rounded-xl text-xs font-bold"
                >
                  Register Material
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
