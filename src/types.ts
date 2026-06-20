export interface RawMaterial {
  id: string;
  name: string;
  currentStock: number;
  unit: string;
  safetyStock: number;
  costPerKg: number;
  supplierId: string;
  expiryDate: string;
  batchCode: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  currentStock: number;
  packSize: string;
  costPrice: number;
  retailPrice: number;
  wholesalePrice: number;
  barcode: string;
  qrCode: string;
}

export interface Recipe {
  id: string;
  productId: string;
  ingredients: { rawMaterialId: string; percentage: number; amountKg: number; cost: number }[];
  laborCost: number;
  utilityCost: number;
  transportationCost: number;
  overheadCost: number;
  totalCostPerBatch: number;
  expectedYieldKg: number;
  instructions: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact: string;
  email: string;
  balanceDue: number;
}

export interface Customer {
  id: string;
  name: string;
  contact: string;
  region: string;
  creditLimit: number;
  balanceDue: number;
  type: "Wholesale" | "Retail" | "Distributor";
  loyaltyPoints: number;
}

export interface InvoiceItem {
  productId: string;
  name: string;
  packSize: string;
  qty: number;
  price: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  date: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  discount: number;
  totalAmount: number;
  paymentStatus: "Paid" | "Pending" | "Overdue";
  sharedWhatsApp: boolean;
  sharedEmail: boolean;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  date: string;
  items: { rawMaterialId: string; name: string; qty: number; unitCost: number; total: number }[];
  totalAmount: number;
  status: "Pending" | "Received";
}

export interface ProductionOrder {
  id: string;
  batchNumber: string;
  productId: string;
  productName: string;
  packSize: string;
  date: string;
  expiryDate: string;
  targetQuantity: number;
  actualYield: number;
  wasteQuantity: number;
  recipeId: string;
  status: "Scheduling" | "In_Progress" | "Completed";
  qualityStatus: "Passed" | "Failed" | "Pending";
  productionCost: number;
}

export interface LedgerEntry {
  id: string;
  date: string;
  book: "Cash" | "Bank" | "Supplier_Day_Book" | "Customer_Day_Book" | "Expense_Ledger" | "Income_Ledger" | "Stock_Ledger";
  type: "Debit" | "Credit";
  category: string;
  description: string;
  amount: number;
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  contact: string;
  attendance: "Present" | "Absent" | "Leave";
  salary: number;
  allowance: number;
}

export interface DbSchema {
  raw_materials: RawMaterial[];
  products: Product[];
  recipes: Recipe[];
  suppliers: Supplier[];
  customers: Customer[];
  invoices: Invoice[];
  purchase_orders: PurchaseOrder[];
  production_orders: ProductionOrder[];
  ledger: LedgerEntry[];
  employees: Employee[];
}

export type UserRole =
  | "Super Administrator"
  | "Owner"
  | "Production Manager"
  | "Inventory Manager"
  | "Sales Manager"
  | "Accounts Manager"
  | "Warehouse Staff"
  | "Distributor"
  | "Cashier"
  | "Employee"
  | "Read-only Auditor";

export interface AIState {
  forecasting: {
    bestSellers: { name: string; projectedGrowthPercent: number; explanation: string }[];
    demandTrends: { month: string; chiliForecastUnits: number; turmericForecastUnits: number; cinnamonForecastUnits: number; demandDrivers: string }[];
    salesForecastData: { date: string; forecastSalesLkr: number; optimisticSalesLkr: number }[];
    requiredReprocurement: { materialName: string; forecastRequiredKg: number; priority: "High" | "Medium" | "Low" }[];
    strategicOpportunities: string[];
  } | null;
  profitAnalysis: {
    businessHealthScore: number;
    profitabilityByProduct: { productName: string; grossMarginPercent: number; profitabilityGrade: "Excellent" | "Good" | "Needs Attention" }[];
    regionalPerformance: { region: string; totalRevenueLkr: number; estimatedMarginPercent: number }[];
    leakagesAndInefficiencies: { source: string; estimatedLossLkr: number; mitigationStrategy: string }[];
    costReductionOpportunities: { opportunity: string; savingsLkr: number; priority: "High" | "Medium" | "Low" }[];
    executiveSummary: string;
  } | null;
  productionPlanning: {
    productionRecommendations: { productId: string; name: string; suggestedBatchQty: number; priority: "High" | "Medium"; justification: string }[];
    resourceDemands: { rmId: string; name: string; currentStock: number; requiredPurchaseKg: number; estimatedPriceLkr: number }[];
    productionSchedule: { day: string; tasks: string[]; machineAllotment: string }[];
  } | null;
}
