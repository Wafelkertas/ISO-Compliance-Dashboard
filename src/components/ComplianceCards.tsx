import {Lock} from "lucide-react";
import {useEffect, useState} from "react";
import supabase from "../utils/supabase";

export function ComplianceCards() {
    const [standards, setStandards] = useState<any[]>([]);
    const [activePeriodId, setActivePeriodId] = useState<number | null>(null);

    // Load active period
    async function loadActivePeriod() {
        const {data} = await supabase
            .from("checklist_periods")
            .select("*")
            .eq("is_closed", false)
            .order("start_date", {ascending: false})
            .limit(1)
            .single();

        if (data) {
            setActivePeriodId(data.id);
        }
    }

    // Compute compliance per framework
    async function loadCompliance() {
        if (!activePeriodId) return;

        // Get all standards (frameworks)
        const {data: frameworks} = await supabase
            .from("frameworks")
            .select("*");

        if (!frameworks) return;

        const results = [];

        for (const fw of frameworks) {
            // Count total controls under this framework
            const {count: totalControls} = await supabase
                .from("controls")
                .select("*", {count: "exact", head: true})
                .eq("framework_id", fw.id);

            // Count compliant responses within this period
            const {count: compliantControls} = await supabase
                .from("checklist_responses")
                .select("*", {count: "exact", head: true})
                .eq("framework_id", fw.id)
                .eq("checklist_period_id", activePeriodId)
                .eq("status", "compliant");

            const compliance = totalControls && compliantControls ? Math.round((compliantControls / totalControls) * 100) : 0;

            // Determine status color
            let status = "Needs Review";
            let color = "yellow";

            if (compliance >= 90) {
                status = "Compliant";
                color = "green";
            } else if (compliance < 70) {
                status = "Non-Compliant";
                color = "red";
            }

            results.push({
                id: fw.code, name: fw.name, compliance, status, icon: Lock, nextAudit: "2025-04-20", // Replace with real audit table later
                color,
            });
        }

        setStandards(results);
    }

    useEffect(() => {
        loadActivePeriod();
    }, []);

    useEffect(() => {
        if (activePeriodId) {
            loadCompliance();
        }
    }, [activePeriodId]);

    // UI helpers
    const getStatusColor = (color: string) => {
        switch (color) {
            case "green":
                return "bg-green-100 text-green-800";
            case "yellow":
                return "bg-yellow-100 text-yellow-800";
            case "red":
                return "bg-red-100 text-red-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    const getProgressColor = (compliance: number) => {
        if (compliance >= 95) return "bg-green-500";
        if (compliance >= 85) return "bg-yellow-500";
        return "bg-red-500";
    };

    return (<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

            {/* Loading indicator */}
            {standards.length === 0 && (<p className="text-gray-500">Loading compliance data…</p>)}

            {standards.map((standard) => {
                const Icon = standard.icon;

                return (<div key={standard.id} className="bg-white rounded-lg border border-gray-200 p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="bg-blue-50 text-blue-600 p-2 rounded-lg">
                                    <Icon className="w-5 h-5"/>
                                </div>
                                <div>
                                    <h3 className="text-gray-900">{standard.id}</h3>
                                    <p className="text-gray-600 text-sm">{standard.name}</p>
                                </div>
                            </div>
                        </div>

                        {/* Compliance Rate */}
                        <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-gray-600 text-sm">Compliance Rate</span>
                                <span className="text-gray-900">{standard.compliance}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className={`h-2 rounded-full ${getProgressColor(standard.compliance)}`}
                                    style={{width: `${standard.compliance}%`}}
                                />
                            </div>
                        </div>

                        {/* Status + Next Audit */}
                        <div className="flex items-center justify-between">
              <span className={`px-3 py-1 rounded-full text-xs ${getStatusColor(standard.color)}`}>
                {standard.status}
              </span>
                            <span className="text-gray-600 text-sm">
                Next: {new Date(standard.nextAudit).toLocaleDateString()}
              </span>
                        </div>
                    </div>);
            })}
        </div>);
}