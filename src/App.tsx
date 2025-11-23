import { ComplianceOverview } from "./components/ComplianceOverview";
import { ComplianceCards } from "./components/ComplianceCards";
import { AuditTable } from "./components/AuditTable";
import { ComplianceChart } from "./components/ComplianceChart";
import { ActionItems } from "./components/ActionItems";
import { RiskMetrics } from "./components/RiskMetrics";
import supabase from "./utils/supabase"
import {useEffect, useState} from "react";
import {categorizeRisk}  from "./utils/risk-mapper"

export default function App() {



    useEffect(() => {
        // getControl();
        // classifyAllControls()
    }, [])

    return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-gray-900">Sistem Manajemen Terintegrasi</h1>
          <p className="text-gray-600 mt-1">Halaman monitor kepatuhan Pusbang Ekosistem SDM Komdigi</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ComplianceOverview />
        
        <div className="mt-8">
          <h2 className="text-gray-900 mb-4">ISO Standards Compliance</h2>
          <ComplianceCards />
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h2 className="text-gray-900 mb-4">Compliance Trend</h2>
            <ComplianceChart />
          </div>
          <div>
            <h2 className="text-gray-900 mb-4">Risk Assessment</h2>
            <RiskMetrics />
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-gray-900 mb-4">Recent Audits</h2>
          <AuditTable />
        </div>

        <div className="mt-8">
          <h2 className="text-gray-900 mb-4">Action Items</h2>
          <ActionItems />
        </div>
      </main>
    </div>
  );


}

async function getControl() {
    const data = await supabase.from('controls').select()

    console.log("getControl", data)
}

async function classifyAllControls() {
    const { data: controls } = await supabase
        .from("controls")
        .select("*");

    for (const control of controls) {
        const risk = categorizeRisk(control.title); // your mapper
        await supabase
            .from("controls")
            .update({ risk_level: risk })
            .eq("id", control.id);
    }
}

