import { CheckCircle, AlertTriangle, Clock, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import supabase from "../utils/supabase";

export function ComplianceOverview() {
    const [overallCompliance, setOverallCompliance] = useState<number | null>(null);
    const [activeStandards, setActiveStandards] = useState<number | null>(null);
    const [pendingActions, setPendingActions] = useState<number | null>(null);
    const [nonConformities, setNonConformities] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    // ----------------------------------------
    // Fetch ACTIVE period (latest non-closed)
    // ----------------------------------------
    async function getActivePeriodId() {
        const { data, error } = await supabase
            .from("checklist_periods")
            .select("*")
            .eq("is_closed", false)
            .order("start_date", { ascending: false })
            .limit(1)
            .single();

        if (error || !data) return null;
        return data.id;
    }

    // ----------------------------------------
    // KPI: Overall Compliance
    // ----------------------------------------
    async function getOverallCompliance(activePeriodId: number) {
        const { count: total } = await supabase
            .from("checklist_responses")
            .select("*", { count: "exact", head: true })
            .eq("checklist_period_id", activePeriodId);

        const { count: compliant } = await supabase
            .from("checklist_responses")
            .select("*", { count: "exact", head: true })
            .eq("checklist_period_id", activePeriodId)
            .eq("status", "compliant");

        if (total && compliant !== null) {
            setOverallCompliance(Math.round((compliant / total) * 100));
        } else {
            setOverallCompliance(0);
        }
    }

    // ----------------------------------------
    // KPI: Active Standards
    // ----------------------------------------
    async function getActiveStandards() {
        const { data, error } = await supabase.from("frameworks").select("id");

        setActiveStandards(error ? 0 : data.length);
    }

    // ----------------------------------------
    // KPI: Pending Actions (status != closed)
    // ----------------------------------------
    async function getPendingActions(activePeriodId: number) {
        const { count } = await supabase
            .from("checklist_responses")
            .select("*", { count: "exact", head: true })
            .eq("checklist_period_id", activePeriodId)
            .neq("status", "compliant");

        setPendingActions(count ?? 0);
    }

    // ----------------------------------------
    // KPI: Non-Conformities
    // ----------------------------------------
    async function getNonConformities(activePeriodId: number) {
        const { count } = await supabase
            .from("checklist_responses")
            .select("*", { count: "exact", head: true })
            .eq("checklist_period_id", activePeriodId)
            .eq("status", "non_conformity");

        setNonConformities(count ?? 0);
    }

    // ----------------------------------------
    // Fetch all KPI in one lifecycle
    // ----------------------------------------
    useEffect(() => {
        async function load() {
            const periodId = await getActivePeriodId();

            if (!periodId) {
                console.error("No active checklist period found.");
                setLoading(false);
                return;
            }

            await Promise.all([
                getOverallCompliance(periodId),
                getActiveStandards(),
                getPendingActions(periodId),
                getNonConformities(periodId),
            ]);

            setLoading(false);
        }

        load();
    }, []);

    // ----------------------------------------
    // Loading UI
    // ----------------------------------------
    if (loading) {
        return <p className="text-gray-500">Loading compliance data...</p>;
    }

    const stats = [
        {
            label: "Kepatuhan Keseluruhan",
            value: overallCompliance !== null ? `${overallCompliance}%` : "0%",
            icon: CheckCircle,
            color: "text-green-600",
            bgColor: "bg-green-50",
        },
        {
            label: "Standar Aktif",
            value: activeStandards ?? "0",
            icon: TrendingUp,
            color: "text-blue-600",
            bgColor: "bg-blue-50",
        },
        {
            label: "Tindakan Tertunda",
            value: pendingActions ?? "0",
            icon: Clock,
            color: "text-yellow-600",
            bgColor: "bg-yellow-50",
        },
        {
            label: "Ketidaksesuaian",
            value: nonConformities ?? "0",
            icon: AlertTriangle,
            color: "text-red-600",
            bgColor: "bg-red-50",
        },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat) => {
                const Icon = stat.icon;
                return (
                    <div key={stat.label} className="bg-white rounded-lg border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600">{stat.label}</p>
                                <p className="text-gray-900 mt-2 text-xl font-semibold">{stat.value}</p>
                            </div>
                            <div className={`${stat.bgColor} ${stat.color} p-3 rounded-lg`}>
                                <Icon className="w-6 h-6" />
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}