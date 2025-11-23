import { useEffect, useMemo, useState } from "react";
import supabase from "../utils/supabase";
import { CheckCircle, AlertTriangle, XCircle } from "lucide-react";

/**
 * RiskMetrics (Risk Assessment) component
 * - Fetches counts of controls grouped by risk_level (Low/Medium/High)
 * - Renders UI exactly as your provided markup/CSS
 * - Returns loader / error states
 */

/* --- Types --- */
type RiskLevel = "Low" | "Medium" | "High";

interface RiskItem {
    level: RiskLevel;
    count: number;
    color: "green" | "yellow" | "red";
    icon: React.FC<any>;
}

/* --- Color helper (returns Tailwind classes for text/bg/border/progress) --- */
function getColorClasses(level: "green" | "yellow" | "red" | "gray") {
    switch (level) {
        case "green":
            return {
                text: "text-green-700",
                bg: "bg-green-50",
                border: "border-green-200",
                bar: "bg-green-400",
            };
        case "yellow":
            return {
                text: "text-yellow-700",
                bg: "bg-yellow-50",
                border: "border-yellow-200",
                bar: "bg-yellow-400",
            };
        case "red":
            return {
                text: "text-red-700",
                bg: "bg-red-50",
                border: "border-red-200",
                bar: "bg-red-400",
            };
        default:
            return {
                text: "text-gray-700",
                bg: "bg-gray-50",
                border: "border-gray-200",
                bar: "bg-gray-400",
            };
    }
}

/* --- RiskCard subcomponent (keeps main render tidy) --- */
function RiskCard({ item, total }: { item: RiskItem; total: number }) {
    const colors = getColorClasses(item.color);
    const percentage = total > 0 ? Math.round((item.count / total) * 100) : 0;
    const Icon = item.icon;
    return (
        <div className={`p-4 rounded-xl border ${colors.border} ${colors.bg}`}>
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <Icon className={`w-5 h-5 ${colors.text}`} />
                    <span className={`${colors.text} font-medium`}>{item.level} Risk</span>
                </div>
                <span className={`${colors.text} font-semibold`}>{item.count}</span>
            </div>

            <div className="w-full bg-white h-2 rounded-full overflow-hidden">
                <div
                    className={`h-full ${colors.bar}`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}

/* --- Main component --- */
export function RiskMetrics() {
    const [lowCount, setLowCount] = useState<number | null>(null);
    const [mediumCount, setMediumCount] = useState<number | null>(null);
    const [highCount, setHighCount] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch counts in parallel
    useEffect(() => {
        let mounted = true;
        async function fetchCounts() {
            setLoading(true);
            setError(null);

            try {
                const lowQ = supabase
                    .from("controls")
                    .select("*", { count: "exact", head: true })
                    .eq("risk_level", "Low");
                const medQ = supabase
                    .from("controls")
                    .select("*", { count: "exact", head: true })
                    .eq("risk_level", "Medium");
                const highQ = supabase
                    .from("controls")
                    .select("*", { count: "exact", head: true })
                    .eq("risk_level", "High");

                // run in parallel
                const [lowRes, medRes, highRes] = await Promise.all([lowQ, medQ, highQ]);

                if (!mounted) return;

                // extract counts (head:true returns { count })
                setLowCount((lowRes as any).count ?? 0);
                setMediumCount((medRes as any).count ?? 0);
                setHighCount((highRes as any).count ?? 0);
            } catch (err: any) {
                console.error("Failed to load risk counts:", err);
                setError(err?.message || "Failed to load risk counts");
            } finally {
                if (mounted) setLoading(false);
            }
        }

        fetchCounts();
        return () => {
            mounted = false;
        };
    }, []);

    const low = lowCount ?? 0;
    const medium = mediumCount ?? 0;
    const high = highCount ?? 0;
    const totalRisks = low + medium + high;

    // build risks array (this is the array you map over in your markup)
    const risks: RiskItem[] = useMemo(
        () => [
            { level: "Low", count: low, color: "green", icon: CheckCircle },
            { level: "Medium", count: medium, color: "yellow", icon: AlertTriangle },
            { level: "High", count: high, color: "red", icon: XCircle },
        ],
        [low, medium, high]
    );

    // Mitigation rate: in your previous logic you used (low / total). Keep that logic.
    const mitigationRate = totalRisks > 0 ? Math.round((low / totalRisks) * 100) : 0;

    /* --- Render --- */
    return (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="mb-6">
                <p className="text-gray-600">Total Identified Risks</p>

                {loading ? (
                    <p className="text-gray-900 mt-1">Loading…</p>
                ) : error ? (
                    <p className="text-red-600 mt-1">{error}</p>
                ) : (
                    <p className="text-gray-900 mt-1 text-xl font-semibold">
                        {totalRisks}
                    </p>
                )}
            </div>

            <div className="space-y-4">
                {/* Map exactly as your original layout expects */}
                {risks.map((risk) => (
                    <RiskCard key={risk.level} item={risk} total={totalRisks} />
                ))}
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Risk Mitigation Rate</span>
                    <span className="text-green-600 font-semibold">
            {loading ? "—" : `${mitigationRate}%`}
          </span>
                </div>
            </div>
        </div>
    );
}