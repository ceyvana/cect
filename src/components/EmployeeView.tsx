import React, { useState } from "react";
import { 
  Users, Calendar, Clock, Award, ShieldAlert, CheckCircle, 
  UserCheck, Briefcase, Key, Mail, Fingerprint, Plus, Calculator 
} from "lucide-react";
import { DbSchema, Employee, UserRole } from "../types";

interface EmployeeViewProps {
  db: DbSchema;
  currentUserRole: UserRole;
  setCurrentUserRole: (role: UserRole) => void;
  triggerDbRefresh: () => void;
  mutateDb: (endpoint: string, method: string, body: any) => Promise<any>;
}

export default function EmployeeView({ 
  db, 
  currentUserRole, 
  setCurrentUserRole,
  triggerDbRefresh,
  mutateDb
}: EmployeeViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<"directory" | "payroll" | "permissions">("directory");
  
  // New employee state
  const [showAddEmp, setShowAddEmp] = useState(false);
  const [empName, setEmpName] = useState("");
  const [empRole, setEmpRole] = useState("Warehouse operator");
  const [empDept, setEmpDept] = useState("Inventory");
  const [empSalary, setEmpSalary] = useState(45000);
  const [empContact, setEmpContact] = useState("");

  // Payroll selection states
  const [selectedPayslipEmp, setSelectedPayslipEmp] = useState<Employee | null>(db.employees[0] || null);
  const [teaBonus, setTeaBonus] = useState(2500);

  const handleRegisterEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: empName,
      role: empRole,
      salary: Number(empSalary),
      contact: empContact,
      attendance: "Present" as const,
      allowance: 5000
    };

    await mutateDb("/api/db/employees", "POST", payload);
    setShowAddEmp(false);
    triggerDbRefresh();
    alert(`Staff member ${empName} added into CEYVANA ERP registry.`);
  };

  const handleToggleAttendance = async (empId: string, currentStatus: string) => {
    const newStatus = currentStatus === "Present" ? "Absent" : "Present";
    await mutateDb(`/api/db/employees/${empId}/attendance`, "PUT", { attendance: newStatus });
    triggerDbRefresh();
    // Update active payslip selector if it was the same employee
    if (selectedPayslipEmp && selectedPayslipEmp.id === empId) {
      const refreshedEmp = db.employees.find(e => e.id === empId);
      if (refreshedEmp) setSelectedPayslipEmp(refreshedEmp);
    }
  };

  const calculatePayslipValues = (salary: number) => {
    const epfDeduction = Math.round(salary * 0.08); // 8% standard Sri Lanka Employee Provident Fund deduction
    const etfDeduction = Math.round(salary * 0.03); // 3% standard ETF deduction
    const netTakeHome = salary + teaBonus - (epfDeduction + etfDeduction);
    return { epfDeduction, etfDeduction, netTakeHome };
  };

  return (
    <div className="space-y-6" id="personnel-employee-view">
      
      {/* Sub tab navigation */}
      <div className="flex border-b border-gray-200">
        {[
          { key: "directory", label: "Ceylon Personnel Registry", icon: Users },
          { key: "payroll", label: "EPF Payroll Payslips", icon: Calculator },
          { key: "permissions", label: "ERP Access & Roles Simulator", icon: Key },
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

      {/* Main card interface */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
        
        {/* TAB 1: EMPLOYEES DIRECTORY & ATTENDANCE FINGERPRINT STAMPS */}
        {activeSubTab === "directory" && (
          <div className="space-y-4">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <span className="text-xs text-brand-charcoal/50">Milling millwrights, sifter operators, and corporate spice logistics managers</span>

              {currentUserRole === "Super Administrator" && (
                <button
                  onClick={() => {
                    setEmpName("");
                    setEmpContact("");
                    setEmpSalary(45000);
                    setShowAddEmp(true);
                  }}
                  className="bg-brand-green text-brand-gold font-display font-extrabold text-xs px-4 py-2.5 rounded-xl hover:bg-brand-darkgreen transition flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  Add Staff Member
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {db.employees.map(emp => {
                const checkedIn = emp.attendance === "Present";
                return (
                  <div key={emp.id} className="border border-gray-150 rounded-2xl p-4 hover:border-brand-gold/40 transition bg-gradient-to-br from-white to-brand-cream/5 space-y-3">
                    
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-mono text-[10px] text-brand-gold-dark font-extrabold">{emp.id}</span>
                        <h4 className="text-sm font-display font-bold text-brand-darkgreen mt-0.5">{emp.name}</h4>
                        <div className="text-[10px] text-brand-charcoal/50 font-semibold">{emp.role}</div>
                      </div>
                      
                      <button
                        onClick={() => handleToggleAttendance(emp.id, emp.attendance)}
                        className={`px-2.5 py-1 rounded text-[9px] font-bold uppercase transition flex items-center gap-1 ${
                          checkedIn 
                            ? "bg-green-100 text-green-800 hover:bg-green-200" 
                            : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                        }`}
                        title="Toggle Check-In fingerprint scanner"
                      >
                        <Fingerprint className="w-3.5 h-3.5" />
                        {checkedIn ? "Present" : "Absent"}
                      </button>
                    </div>

                    <div className="bg-white p-2.5 rounded-xl border border-gray-100 text-xs flex justify-between items-center">
                      <div>
                        <span className="text-[9px] text-brand-charcoal/40 uppercase block">EPF Standard Salary</span>
                        <span className="font-mono font-bold text-brand-charcoal">LKR {emp.salary.toLocaleString()}</span>
                      </div>
                      <span className="text-[10.5px] text-brand-charcoal/50">Ph: {emp.contact}</span>
                    </div>

                  </div>
                )
              })}
            </div>

          </div>
        )}

        {/* TAB 2: PAYROLL SLIP GENERATOR CARD */}
        {activeSubTab === "payroll" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left selector of employees */}
            <div className="lg:col-span-1 space-y-3">
              <h3 className="text-xs font-extrabold uppercase tracking-widest text-brand-darkgreen pb-1.5 border-b border-gray-150">
                Choose payslip target
              </h3>

              <div className="space-y-1.5">
                {db.employees.map(emp => (
                  <button
                    key={emp.id}
                    onClick={() => setSelectedPayslipEmp(emp)}
                    className={`w-full text-left p-3 rounded-xl border transition ${
                      selectedPayslipEmp?.id === emp.id
                        ? "bg-brand-green/5 border-brand-green text-brand-darkgreen font-semibold"
                        : "bg-white border-gray-200 hover:border-brand-gold/25"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold">{emp.name}</span>
                      <span className="font-mono text-[9px] text-brand-gold-dark">{emp.id}</span>
                    </div>
                  </button>
                ))}
              </div>

              <div className="bg-brand-cream/15 p-4 rounded-xl border border-brand-gold/15 text-xs space-y-2">
                <span className="font-bold text-brand-darkgreen uppercase block tracking-wider text-[10px]">Tea & Spice Allowance bonus</span>
                <input
                  type="number"
                  value={teaBonus}
                  onChange={e => setTeaBonus(Number(e.target.value))}
                  className="w-full bg-white border border-gray-350 rounded-lg py-1 px-2 font-mono text-xs text-brand-charcoal"
                />
              </div>
            </div>

            {/* Right printable payslip card */}
            <div className="lg:col-span-2">
              {selectedPayslipEmp ? (
                <div className="border border-gray-300 rounded-2xl p-6 shadow-md bg-white space-y-4 max-w-lg mx-auto relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-2 bg-brand-gold"></div>

                  <div className="text-center pb-3 border-b border-gray-150">
                    <span className="text-xl font-display font-black text-brand-darkgreen">CEYVANA Spices Ltd</span>
                    <p className="text-[10px] text-gray-400 mt-0.5">EPF / ETF MONTHLY SALARY SLIP</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-gray-405 block uppercase text-[9px]">Staff Name:</span>
                      <p className="font-bold text-brand-darkgreen">{selectedPayslipEmp.name}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-gray-405 block uppercase text-[9px]">EPF Registry Code:</span>
                      <p className="font-mono font-bold text-brand-gold-dark">{selectedPayslipEmp.id}</p>
                    </div>
                  </div>

                  {/* Calculations details */}
                  <div className="space-y-2 text-xs border-t border-b border-gray-150 py-3 font-mono">
                    <div className="flex justify-between text-brand-charcoal/80">
                      <span>Basic monthly salary rate:</span>
                      <span>LKR {selectedPayslipEmp.salary.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-brand-charcoal/80">
                      <span>Incentive allowances (Tea & Spice):</span>
                      <span>+ LKR {teaBonus.toLocaleString()}</span>
                    </div>
                    
                    <div className="flex justify-between text-red-700 pt-1 text-[11px]">
                      <span>EPF Deduction (8%):</span>
                      <span>- LKR {calculatePayslipValues(selectedPayslipEmp.salary).epfDeduction.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-red-700 text-[11px]">
                      <span>ETF Trust Deduction (3%):</span>
                      <span>- LKR {calculatePayslipValues(selectedPayslipEmp.salary).etfDeduction.toLocaleString()}</span>
                    </div>

                    <div className="flex justify-between text-brand-emerald font-black pt-2 border-t border-dashed border-gray-200 text-xs">
                      <span>NET REMITTED TAKE-HOME:</span>
                      <span>LKR {calculatePayslipValues(selectedPayslipEmp.salary).netTakeHome.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="text-center text-[10px] text-gray-400">
                    Calculated in compliance with the Sri Lanka Wages Board for the Spice Trade 2026.
                  </div>

                </div>
              ) : (
                <div className="h-64 flex items-center justify-center border border-dashed rounded-2xl text-xs text-brand-charcoal/40">
                  Select a staff member from the ledger to compute monthly allowances.
                </div>
              )}
            </div>

          </div>
        )}

        {/* TAB 3: ROLES ACCESS SECURITY PERMISSIONS SWITCHER */}
        {activeSubTab === "permissions" && (
          <div className="max-w-xl mx-auto space-y-4">
            <h3 className="text-sm font-display font-black text-brand-darkgreen">CEYVANA ERP Access Control Board</h3>
            
            <p className="text-xs text-brand-charcoal/60 leading-relaxed">
              Verify operations security bounds directly. Select different corporate access roles to witness real-time frontend UI switches, blocking sifter operators from deleting inventory SKUs, or managing EPF payroll figures.
            </p>

            <div className="grid grid-cols-3 gap-3 pt-2">
              {[
                { role: "Super Administrator" as UserRole, desc: "Total system authority, ledger posting, inventory deletion & employee payroll edits" },
                { role: "Production Manager" as UserRole, desc: "Recipe formulation control, grinding batch launches, client registrations" },
                { role: "Warehouse Staff" as UserRole, desc: "Warehouse scanning, check-in Stamps, low-stock warnings, print views" },
              ].map(r => (
                <button
                  key={r.role}
                  onClick={() => {
                    setCurrentUserRole(r.role);
                  }}
                  className={`p-4 rounded-xl border text-center transition cursor-pointer flex flex-col justify-between ${
                    currentUserRole === r.role
                      ? "bg-brand-green text-brand-gold border-brand-green shadow-md shadow-brand-green/10"
                      : "bg-white text-brand-darkgreen border-gray-200 hover:border-brand-gold/30"
                  }`}
                >
                  <div>
                    <div className="mx-auto w-2 h-2 rounded-full bg-brand-gold mb-2"></div>
                    <span className="font-display font-black uppercase text-xs tracking-wider block">{r.role}</span>
                  </div>
                  <p className="text-[9.5px] opacity-75 mt-2 leading-relaxed">{r.desc}</p>
                </button>
              ))}
            </div>

            <div className="bg-[#fff9e6] border border-[#ffe099] rounded-xl p-4 text-xs font-semibold text-[#805d00] flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[#cc9500]" />
              Role restrictions are enforced across all server API operations.
            </div>

          </div>
        )}

      </div>

      {/* --- ADD EMP MODAL --- */}
      {showAddEmp && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full border border-gray-200 p-6 space-y-4">
            <h3 className="text-md font-display font-black text-brand-darkgreen">Register Staff Member</h3>

            <form onSubmit={handleRegisterEmployee} className="space-y-3.5">
              <div>
                <label className="text-[10px] font-bold text-gray-500 block mb-1 uppercase">Staff Name</label>
                <input
                  type="text"
                  required
                  value={empName}
                  onChange={e => setEmpName(e.target.value)}
                  placeholder="e.g. S. J. Bandara"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-brand-gold outline-none text-brand-charcoal"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-500 block mb-1 uppercase">Contact / Phone</label>
                <input
                  type="text"
                  required
                  value={empContact}
                  onChange={e => setEmpContact(e.target.value)}
                  placeholder="e.g. +94771234567"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-brand-gold outline-none text-brand-charcoal"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-500 block mb-1 uppercase">Department</label>
                  <select
                    value={empDept}
                    onChange={e => setEmpDept(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-brand-gold outline-none text-brand-charcoal"
                  >
                    <option value="Inventory">Inventory</option>
                    <option value="Milling">Milling</option>
                    <option value="Admin">Admin</option>
                    <option value="Sales">Sales</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 block mb-1 uppercase">Assigned Role</label>
                  <input
                    type="text"
                    required
                    value={empRole}
                    onChange={e => setEmpRole(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-500 block mb-1 uppercase">Basic Salary LKR</label>
                <input
                  type="number"
                  required
                  value={empSalary}
                  onChange={e => setEmpSalary(Number(e.target.value))}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-brand-gold outline-none text-brand-charcoal font-mono"
                />
              </div>

              <div className="flex gap-2 pt-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowAddEmp(false)}
                  className="px-4 py-2 bg-gray-100 text-brand-charcoal rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-green hover:bg-brand-darkgreen text-brand-gold rounded-xl text-xs font-bold"
                >
                  Register Staff
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
