import {
    BrowserRouter as Router, Routes, Route, useNavigate,
} from "react-router-dom";
import {ComplianceOverview} from "./components/ComplianceOverview";
import {ComplianceCards} from "./components/ComplianceCards";
import {AuditTable} from "./components/AuditTable";
import {ComplianceChart} from "./components/ComplianceChart";
import {ActionItems} from "./components/ActionItems";
import {RiskMetrics} from "./components/RiskMetrics";
import {ChecklistForm} from "./components/ChecklistForm";
import {ClipboardCheck, LogOut} from "lucide-react";
import {ChecklistPage} from "./pages/ChecklistPage";
import {AuditPage} from "./pages/AuditPage";
import {ActionItemsPage} from "./pages/ActionItemsPage";
import {RiskPage} from "./pages/RiskPage";
import {LoginPage} from "./pages/LoginPage";
import ProtectedRoutePage from "./pages/ProtectedRoutePage";
import supabase from "./utils/supabase";


export default function App() {
    return (<Router>
            <Routes>
                <Route
                    path="/"
                    element={<ProtectedRoutePage>
                        <DashboardPage/>
                    </ProtectedRoutePage>}
                />
                <Route
                    path="/checklist"
                    element={<ProtectedRoutePage>
                        <ChecklistPage/>
                    </ProtectedRoutePage>}
                />
                <Route
                    path="/audits"
                    element={<ProtectedRoutePage>
                        <AuditPage/>
                    </ProtectedRoutePage>}
                />
                <Route
                    path="/actions"
                    element={<ProtectedRoutePage>
                        <ActionItemsPage/>
                    </ProtectedRoutePage>}
                />
                <Route
                    path="/risk"
                    element={<ProtectedRoutePage>
                        <RiskPage/>
                    </ProtectedRoutePage>}
                />
                <Route
                    path="/login"
                    element={<LoginPage/>}
                />
            </Routes>
        </Router>);
}

/* ---------------------------- DASHBOARD PAGE ---------------------------- */

function DashboardPage() {
    const navigate = useNavigate();

    async function handleLogout() {
        await supabase.auth.signOut();
        navigate("/login");    // redirect to login page
    }

    return (<div className="min-h-screen bg-gray-50">
            <header className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-gray-900">Sistem Manajemen Terintegrasi</h1>
                            <p className="text-gray-600 mt-1">
                                Halaman monitor kepatuhan Pusbang Ekosistem SDM Komdigi
                            </p>
                        </div>

                        <div className="flex items-center gap-4">
                            {/* Navigate instead of showChecklist */}
                            <button
                                onClick={() => navigate("/checklist")}
                                className="flex items-center gap-2 bg-white text-gray-700 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                            >
                                <ClipboardCheck className="w-5 h-5"/>
                                Fill Checklist
                            </button>

                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-2 px-4 py-2 border rounded-lg text-gray-700 bg-white hover:bg-gray-50"
                            >
                                <LogOut className="w-4 h-4" />
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <ComplianceOverview/>

                <div className="mt-8">
                    <h2 className="text-gray-900 mb-4">Standar Kepatuhan</h2>
                    <ComplianceCards/>
                </div>

                <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div>
                        <h2 className="text-gray-900 mb-4">Tren Kepatuhan</h2>
                        <ComplianceChart/>
                    </div>

                    <div>
                        <h2 className="text-gray-900 mb-4">Asesment Resiko</h2>
                        <RiskMetrics/>
                    </div>
                </div>

                <div className="mt-8">
                    <h2 className="text-gray-900 mb-4">Audit Terbaru</h2>
                    <AuditTable/>
                </div>

                <div className="mt-8">
                    <h2 className="text-gray-900 mb-4">Tindakan yang Harus Dilakukan</h2>
                    <ActionItems/>
                </div>
            </main>
        </div>);
}
