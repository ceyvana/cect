import React, { useState } from "react";
import { 
  Calculator, Layers, Award, ShieldCheck, Scale, CheckCircle2, 
  Clock, Plus, Grid, TrendingUp, Info, List, Percent, ChevronRight 
} from "lucide-react";
import { DbSchema, Recipe, ProductionOrder, Product, RawMaterial } from "../types";

interface ProductionViewProps {
  db: DbSchema;
  triggerDbRefresh: () => void;
  mutateDb: (endpoint: string, method: string, body: any) => Promise<any>;
}

export default function ProductionView({ db, triggerDbRefresh, mutateDb }: ProductionViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<"recipes" | "orders" | "calculator">("recipes");

  // Formulation State
  const [targetRecipeProdId, setTargetRecipeProdId] = useState("P001");
  const [selectedRecipeItem, setSelectedRecipeItem] = useState<Recipe | null>(db.recipes[0] || null);
  
  // Cost Calculator States
  const [ccRaw, setCcRaw] = useState(120);
  const [ccPkg, setCcPkg] = useState(15);
  const [ccLabor, setCcLabor] = useState(25);
  const [ccUtility, setCcUtility] = useState(12);
  const [ccTransport, setCcTransport] = useState(18);
  const [ccOverhead, setCcOverhead] = useState(15);
  const [ccSellingPrice, setCcSellingPrice] = useState(320);

  // Scheduling Order state
  const [schedProduct, setSchedProduct] = useState("P001");
  const [schedQty, setSchedQty] = useState(2000);
  const [schedInstructions, setSchedInstructions] = useState("REC001");

  const buildNewRecipe = async () => {
    // Basic form logic
    const prod = db.products.find(p => p.id === targetRecipeProdId);
    if (!prod) return;

    const payload = {
      productId: targetRecipeProdId,
      ingredients: [
        { rawMaterialId: "RM001", percentage: 95, amountKg: 0.95, cost: 427.5 },
        { rawMaterialId: "RM009", percentage: 5, amountKg: 0.05, cost: 4.0 }
      ],
      laborCost: 20,
      utilityCost: 15,
      transportationCost: 20,
      overheadCost: 15,
      totalCostPerBatch: 501.5,
      expectedYieldKg: 1,
      instructions: "Dehydrate, blend, roast under direct air control, sift via Mesh 40 and packet in standard Kraft zip locks."
    };

    await mutateDb("/api/db/recipes", "POST", payload);
    triggerDbRefresh();
    alert(`Created formulation recipe successfully for ${prod.name}.`);
  };

  const handleLaunchBatch = async () => {
    const prod = db.products.find(p => p.id === schedProduct);
    if (!prod) return;

    // Calculate total costs
    const recipeObj = db.recipes.find(r => r.productId === schedProduct) || db.recipes[0];
    const unitEstCost = recipeObj ? recipeObj.totalCostPerBatch : prod.costPrice;
    const estTotalCost = unitEstCost * schedQty;

    const payload = {
      productId: schedProduct,
      productName: prod.name,
      packSize: prod.packSize,
      date: new Date().toISOString().split("T")[0],
      expiryDate: new Date(Date.now() + 365*24*60*60*1000).toISOString().split("T")[0],
      targetQuantity: Number(schedQty),
      recipeId: recipeObj ? recipeObj.id : "REC001",
      status: "In_Progress",
      productionCost: estTotalCost
    };

    await mutateDb("/api/db/production_orders", "POST", payload);
    triggerDbRefresh();
    alert(`Batch production launched. Industrial roller pulverizers are working...`);
  };

  const handleCompleteBatch = async (orderId: string, success: boolean, yieldQty: number, wasteQty: number) => {
    const payload = {
      status: "Completed",
      actualYield: yieldQty,
      wasteQuantity: wasteQty,
      qualityStatus: success ? "Passed" : "Failed"
    };

    await mutateDb(`/api/db/production_orders/${orderId}`, "PUT", payload);
    triggerDbRefresh();
    alert(`Batch reconciled. Finished goods sieved into Galle warehouse inventory.`);
  };

  // Cost calculations
  const totalCostCombined = ccRaw + ccPkg + ccLabor + ccUtility + ccTransport + ccOverhead;
  const marginLkr = ccSellingPrice - totalCostCombined;
  const marginPercent = ((marginLkr / ccSellingPrice) * 100).toFixed(1);

  return (
    <div className="space-y-6" id="production-view-root">
      
      {/* Sub tabs bar */}
      <div className="flex border-b border-gray-200">
        {[
          { key: "recipes", label: "Ceylon Recipe Board", icon: List },
          { key: "orders", label: "Milling Batches Queue", icon: Layers },
          { key: "calculator", label: "Spice Costing Studio", icon: Calculator },
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

      {/* Main Panel Wrapper */}
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
        
        {/* TAB 1: FORMULATIONS RECIPE BOARD */}
        {activeSubTab === "recipes" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left list of recipes */}
            <div className="lg:col-span-1 space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-gray-150">
                <h3 className="text-xs font-extrabold uppercase tracking-widest text-brand-darkgreen">Active Recipe Formulations</h3>
                <span className="text-[10px] text-brand-charcoal/40 font-mono">Standards compliance</span>
              </div>

              <div className="space-y-2">
                {db.recipes.map(rec => {
                  const prod = db.products.find(p => p.id === rec.productId);
                  const isSelected = selectedRecipeItem?.id === rec.id;
                  
                  return (
                    <button
                      key={rec.id}
                      onClick={() => setSelectedRecipeItem(rec)}
                      className={`w-full text-left p-3 rounded-xl border transition ${
                        isSelected 
                          ? "bg-brand-green/5 border-brand-green text-brand-darkgreen shadow-sm" 
                          : "bg-white border-gray-200 hover:border-brand-gold/30"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-mono text-[10px] font-bold text-brand-gold-dark">{rec.id}</span>
                        <span className="text-[10px] font-mono font-extrabold text-brand-green">Yield: {rec.expectedYieldKg} kg</span>
                      </div>
                      <h4 className="text-xs font-bold text-brand-darkgreen mt-1">
                        {prod ? prod.name : "Branded Product"} {prod ? `(${prod.packSize})` : ""}
                      </h4>
                      <p className="text-[10px] text-brand-charcoal/50 mt-1 truncate leading-snug">{rec.instructions}</p>
                    </button>
                  )
                })}
              </div>

              {/* Formulation builder shortcut */}
              <div className="bg-brand-cream/20 p-4 rounded-xl border border-brand-gold/15 space-y-2 text-xs">
                <p className="font-bold text-brand-darkgreen flex items-center gap-1.5 uppercase tracking-wide">
                  <Grid className="w-4 h-4 text-brand-gold" />
                  Formulate New Spice Recipe
                </p>
                <p className="text-brand-charcoal/50 leading-relaxed">
                  Fast schedule a formulation template based on standard 95% drying ratios of dry red chili rhizomes.
                </p>
                
                <div className="space-y-2 pt-2">
                  <select
                    value={targetRecipeProdId}
                    onChange={e => setTargetRecipeProdId(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-lg px-2 py-1 text-xs text-brand-charcoal"
                  >
                    {db.products.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.packSize})</option>
                    ))}
                  </select>

                  <button
                    onClick={buildNewRecipe}
                    className="w-full bg-brand-green text-brand-gold font-bold py-2 rounded-lg text-[11px] hover:bg-brand-darkgreen transition text-center"
                  >
                    Initialize Formula
                  </button>
                </div>
              </div>

            </div>

            {/* Right details panel */}
            <div className="lg:col-span-2 space-y-4">
              {selectedRecipeItem ? (
                <div className="border border-brand-gold/20 rounded-2xl p-5 space-y-4 shadow-sm bg-gradient-to-b from-white to-brand-cream/10">
                  
                  <div className="flex justify-between items-center pb-2 border-b border-brand-gold/10">
                    <div>
                      <span className="font-mono text-xs text-brand-gold-dark font-black">FORMULATION ID: {selectedRecipeItem.id}</span>
                      <h3 className="text-md font-display font-black text-brand-darkgreen mt-1">
                        {db.products.find(p => p.id === selectedRecipeItem.productId)?.name}
                      </h3>
                    </div>
                    <span className="bg-brand-green text-brand-gold font-mono font-bold text-xs px-3 py-1 rounded-lg">
                      LKR {selectedRecipeItem.totalCostPerBatch.toLocaleString()} batch budget
                    </span>
                  </div>

                  {/* Percentage analysis */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-brand-darkgreen mb-2 flex items-center gap-1">
                      <Percent className="w-4 h-4 text-brand-gold" />
                      Constituents Percentage Analysis
                    </h4>
                    <div className="space-y-2.5">
                      {selectedRecipeItem.ingredients.map((ing, idx) => {
                        const material = db.raw_materials.find(rm => rm.id === ing.rawMaterialId);
                        return (
                          <div key={idx} className="space-y-1">
                            <div className="flex justify-between text-xs font-semibold text-brand-charcoal">
                              <span>{material ? material.name : "Ingredients"} ({ing.amountKg} kg)</span>
                              <span>{ing.percentage}% Ratio</span>
                            </div>
                            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                              <div 
                                className="bg-brand-green h-full rounded-full" 
                                style={{ width: `${ing.percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Factory Directions */}
                  <div className="bg-white p-4 rounded-xl border border-gray-150 text-xs">
                    <h4 className="font-bold text-brand-darkgreen uppercase tracking-wide flex items-center gap-1 mb-1">
                      <ShieldCheck className="w-4 h-4 text-brand-gold" />
                      Milling & Safety Directions
                    </h4>
                    <p className="text-brand-charcoal/70 leading-relaxed font-serif text-[13px]">{selectedRecipeItem.instructions}</p>
                  </div>

                  {/* Cost analysis components */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div className="p-2.5 bg-gray-50 rounded-lg text-center">
                      <span className="text-brand-charcoal/40 text-[10px] block font-semibold uppercase">Labor Allowance</span>
                      <span className="font-mono font-bold text-brand-darkgreen mt-0.5 block">LKR {selectedRecipeItem.laborCost}</span>
                    </div>
                    <div className="p-2.5 bg-gray-50 rounded-lg text-center">
                      <span className="text-brand-charcoal/40 text-[10px] block font-semibold uppercase">Utility Allocation</span>
                      <span className="font-mono font-bold text-brand-darkgreen mt-0.5 block">LKR {selectedRecipeItem.utilityCost}</span>
                    </div>
                    <div className="p-2.5 bg-gray-50 rounded-lg text-center">
                      <span className="text-brand-charcoal/40 text-[10px] block font-semibold uppercase">Transport Over</span>
                      <span className="font-mono font-bold text-brand-darkgreen mt-0.5 block">LKR {selectedRecipeItem.transportationCost}</span>
                    </div>
                    <div className="p-2.5 bg-gray-50 rounded-lg text-center">
                      <span className="text-brand-charcoal/40 text-[10px] block font-semibold uppercase">Overhead Buffers</span>
                      <span className="font-mono font-bold text-brand-darkgreen mt-0.5 block">LKR {selectedRecipeItem.overheadCost}</span>
                    </div>
                  </div>

                </div>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center border border-dashed border-gray-200 rounded-2xl text-center">
                  <p className="text-xs text-brand-charcoal/40">Select a formula recipe template to examine grinding bounds.</p>
                </div>
              )}
            </div>

          </div>
        )}

        {/* TAB 2: ACTIVE PRODUCTION ORDERS BATCH QUEUE */}
        {activeSubTab === "orders" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left controller: launch batch */}
            <div className="lg:col-span-1 bg-brand-cream/20 p-5 rounded-xl border border-brand-gold/15 space-y-4">
              <h3 className="text-xs uppercase font-extrabold tracking-widest text-brand-darkgreen pb-2 border-b border-brand-gold/10 flex items-center justify-between">
                Schedule Grinding Run
                <Plus className="w-3.5 h-3.5 text-brand-gold" />
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-brand-charcoal/50 block mb-1 uppercase">Target Product SKU</label>
                  <select
                    value={schedProduct}
                    onChange={e => setSchedProduct(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-xl px-2.5 py-2 text-xs focus:ring-1 focus:ring-brand-gold outline-none text-brand-charcoal"
                  >
                    {db.products.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.packSize})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-brand-charcoal/50 block mb-1 uppercase">Production Volume (units)</label>
                  <input
                    type="number"
                    value={schedQty}
                    onChange={e => setSchedQty(Number(e.target.value))}
                    className="w-full bg-white border border-gray-300 rounded-xl px-2.5 py-2 text-xs focus:ring-1 focus:ring-brand-gold outline-none text-brand-charcoal"
                  />
                </div>

                <button
                  onClick={handleLaunchBatch}
                  className="w-full bg-brand-green hover:bg-brand-darkgreen text-brand-gold font-bold text-xs py-2.5 rounded-xl transition shadow-md mt-2"
                >
                  Spin Industrial Pulverizers
                </button>
              </div>
            </div>

            {/* Right queue lists */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-xs uppercase font-extrabold tracking-widest text-brand-darkgreen">Active Grinding queue</h3>
              
              <div className="space-y-3">
                {db.production_orders.map(order => (
                  <div key={order.id} className="border border-gray-200 rounded-xl p-4 bg-white relative space-y-3">
                    
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-mono text-xs font-bold text-brand-darkgreen">{order.batchNumber}</span>
                        <h4 className="text-xs font-bold text-brand-darkgreen mt-0.5">{order.productName} ({order.packSize})</h4>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                        order.status === "Completed" 
                          ? "bg-green-100 text-green-800" 
                          : order.status === "In_Progress"
                          ? "bg-blue-100 text-blue-800 animate-pulse"
                          : "bg-gray-100 text-gray-700"
                      }`}>
                        {order.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs py-2 border-t border-b border-gray-100">
                      <div>
                        <span className="text-brand-charcoal/40 text-[9px] uppercase tracking-wide block font-semibold">Scheduled Date</span>
                        <span className="font-mono font-semibold">{order.date}</span>
                      </div>
                      <div>
                        <span className="text-brand-charcoal/40 text-[9px] uppercase tracking-wide block font-semibold">Target run</span>
                        <span className="font-mono font-bold text-brand-darkgreen">{order.targetQuantity} units</span>
                      </div>
                      <div>
                        <span className="text-brand-charcoal/40 text-[9px] uppercase tracking-wide block font-semibold">Yield Sifted</span>
                        <span className="font-mono font-bold text-brand-green">{order.status === "Completed" ? `${order.actualYield} units` : "Milling..."}</span>
                      </div>
                      <div>
                        <span className="text-brand-charcoal/40 text-[9px] uppercase tracking-wide block font-semibold">Quality compliance</span>
                        <span className={`font-bold ${order.qualityStatus === "Passed" ? "text-brand-emerald" : "text-amber-700 font-bold"}`}>{order.qualityStatus}</span>
                      </div>
                    </div>

                    {order.status === "In_Progress" && (
                      <div className="flex gap-2 justify-end pt-1">
                        <button
                          onClick={() => handleCompleteBatch(order.id, false, order.targetQuantity - 30, 30)}
                          className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-[10px] font-bold px-3 py-1.5 rounded-lg transition"
                        >
                          Flag Waste Failure
                        </button>
                        <button
                          onClick={() => handleCompleteBatch(order.id, true, order.targetQuantity - 5, 5)}
                          className="bg-brand-green hover:bg-brand-darkgreen text-brand-gold text-[10px] font-bold px-3.5 py-1.5 rounded-lg transition flex items-center gap-1.5 shadow-sm"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Pass QC Check
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* TAB 3: SPICE COSTING STUDIO */}
        {activeSubTab === "calculator" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Sliders input */}
            <div className="lg:col-span-1 bg-brand-cream/15 p-5 rounded-xl border border-brand-gold/15 space-y-4">
              <h3 className="text-xs uppercase font-extrabold tracking-widest text-brand-darkgreen pb-2 border-b border-brand-gold/10">
                Formula Slider Inputs
              </h3>

              <div className="space-y-4 text-xs">
                <div>
                  <div className="flex justify-between block mb-1">
                    <span className="font-bold text-brand-charcoal/50 uppercase text-[10px]">Raw Spice Component</span>
                    <span className="font-mono font-bold text-brand-charcoal">LKR {ccRaw}</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="1000"
                    value={ccRaw}
                    onChange={e => setCcRaw(Number(e.target.value))}
                    className="w-full uppercase cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between block mb-1">
                    <span className="font-bold text-brand-charcoal/50 uppercase text-[10px]">Premium Packaging (Bag/Box)</span>
                    <span className="font-mono font-bold text-brand-charcoal">LKR {ccPkg}</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="120"
                    value={ccPkg}
                    onChange={e => setCcPkg(Number(e.target.value))}
                    className="w-full cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between block mb-1">
                    <span className="font-bold text-brand-charcoal/50 uppercase text-[10px]">Grinding Labor Hourly</span>
                    <span className="font-mono font-bold text-brand-charcoal">LKR {ccLabor}</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="150"
                    value={ccLabor}
                    onChange={e => setCcLabor(Number(e.target.value))}
                    className="w-full cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between block mb-1">
                    <span className="font-bold text-brand-charcoal/50 uppercase text-[10px]">Vantage Utility Overhead</span>
                    <span className="font-mono font-bold text-brand-charcoal">LKR {ccUtility}</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="100"
                    value={ccUtility}
                    onChange={e => setCcUtility(Number(e.target.value))}
                    className="w-full cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between block mb-1">
                    <span className="font-bold text-brand-charcoal/50 uppercase text-[10px]">Transportation & Port Cargo</span>
                    <span className="font-mono font-bold text-brand-charcoal">LKR {ccTransport}</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="120"
                    value={ccTransport}
                    onChange={e => setCcTransport(Number(e.target.value))}
                    className="w-full cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between block mb-1">
                    <span className="font-bold text-brand-charcoal/50 uppercase text-[10px]">Factory Administrative Buffer</span>
                    <span className="font-mono font-bold text-brand-charcoal">LKR {ccOverhead}</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="120"
                    value={ccOverhead}
                    onChange={e => setCcOverhead(Number(e.target.value))}
                    className="w-full cursor-pointer"
                  />
                </div>

                <div className="border-t border-brand-gold/10 pt-3">
                  <div className="flex justify-between block mb-1">
                    <span className="font-bold text-brand-gold-dark uppercase text-[10px]">Selling Target price (LKR)</span>
                    <span className="font-mono font-extrabold text-brand-darkgreen">LKR {ccSellingPrice}</span>
                  </div>
                  <input
                    type="range"
                    min={totalCostCombined}
                    max="2000"
                    value={ccSellingPrice}
                    onChange={e => setCcSellingPrice(Number(e.target.value))}
                    className="w-full cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Calculated cost matrix */}
            <div className="lg:col-span-2">
              <div className="border border-brand-gold/25 rounded-2xl p-5 space-y-4 bg-gradient-to-br from-white via-brand-cream/5 to-white shadow-md">
                
                <h3 className="text-xs uppercase font-extrabold tracking-widest text-brand-darkgreen tracking-wider pb-2 border-b border-gray-150">
                  Formulated Pricing Evaluation Card
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  
                  <div className="bg-gray-50 p-4 rounded-xl text-center">
                    <span className="text-brand-charcoal/40 text-[10px] uppercase font-bold block">Combined Manufacturing Cost</span>
                    <p className="font-mono text-lg font-black text-brand-darkgreen mt-1">LKR {totalCostCombined.toLocaleString()}</p>
                  </div>

                  <div className="bg-brand-green/5 p-4 rounded-xl text-center border border-brand-green/10">
                    <span className="text-brand-gold-dark text-[10px] uppercase font-bold block">Proposed RSP</span>
                    <p className="font-mono text-lg font-black text-brand-green mt-1">LKR {ccSellingPrice.toLocaleString()}</p>
                  </div>

                </div>

                {/* Return values analysis */}
                <div className="bg-white border border-gray-150 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-brand-charcoal/50">Gain Per Branded Package</span>
                    <p className="text-md font-mono font-black text-brand-darkgreen mt-0.5">LKR {marginLkr} Profit Margin</p>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] bg-brand-emerald/10 text-brand-emerald font-extrabold px-3 py-1 rounded-full uppercase">
                      +{marginPercent}% margin
                    </span>
                  </div>
                </div>

                <div className="text-xs text-brand-charcoal/50 leading-relaxed bg-brand-cream/20 p-4 rounded-xl border border-brand-gold/10">
                  <span className="font-bold text-brand-gold uppercase tracking-wider text-[10px] block mb-1">Ceylon Export Advisory Commentary:</span>
                  A margins score of <b>{marginPercent}%</b> is recommended for ground Ceylon cinnamon or cloves wholesale contracts. If exporting towards European boundaries, maintain overhead allocations below 15% to buffer cargo shipping fluctuations.
                </div>

              </div>
            </div>

          </div>
        )}

      </div>

    </div>
  );
}
