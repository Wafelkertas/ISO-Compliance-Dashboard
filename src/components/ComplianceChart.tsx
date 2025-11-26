import {useEffect, useState} from "react";
import supabase from "../utils/supabase";
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

export function ComplianceChart() {
    const [chartData, setChartData] = useState<any[]>([]);
    const [frameworks, setFrameworks] = useState<any[]>([]);

    // -------------------------------------------
    // 1. Load frameworks (ISO 27001, ISO 9001, etc.)
    // -------------------------------------------
    async function loadFrameworks() {
        const {data} = await supabase.from("frameworks").select("*");
        setFrameworks(data || []);
    }

    // -------------------------------------------
    // 2. Load monthly periods (checklist_periods)
    // -------------------------------------------
    async function loadComplianceTrend() {
        const {data: periods} = await supabase
            .from("checklist_periods")
            .select("*")
            .order("start_date", {ascending: true});

        if (!periods) return;

        const results: any[] = [];

        for (const period of periods) {
            const row: any = {
                month: formatMonth(period.start_date), // "Oct 2025"
            };

            // For each framework, compute compliance for this period
            for (const fw of frameworks) {
                const compliance = await computeComplianceForFramework(fw.id, period.id);

                row[fw.code] = compliance; // e.g., row["ISO 27001"] = 92
            }

            results.push(row);
        }

        setChartData(results);
    }

    // -------------------------------------------
    // 3. Compute compliance for single framework x period
    // -------------------------------------------
    async function computeComplianceForFramework(frameworkId: number, periodId: number) {
        // Total controls in this framework
        const {count: totalControls} = await supabase
            .from("controls")
            .select("*", {count: "exact", head: true})
            .eq("framework_id", frameworkId);

        // Compliant controls in this period
        const {count: compliantControls} = await supabase
            .from("checklist_responses")
            .select("*", {count: "exact", head: true})
            .eq("framework_id", frameworkId)
            .eq("checklist_period_id", periodId)
            .eq("status", "compliant");

        if (!totalControls || totalControls === 0) return 0;
        return Math.round((compliantControls / totalControls) * 100);
    }

    // -------------------------------------------
    // Format "2025-10-01" -> "Oct"
    // -------------------------------------------
    function formatMonth(dateString: string) {
        return new Date(dateString).toLocaleString("en-US", {month: "short"});
    }

    // -------------------------------------------
    // 4. Load everything
    // -------------------------------------------
    useEffect(() => {
        async function load() {
            await loadFrameworks();
        }

        load();
    }, []);

    useEffect(() => {
        if (frameworks.length > 0) {
            loadComplianceTrend();
        }
    }, [frameworks]);

    // -------------------------------------------
    // 5. Dynamic color mapping by framework code
    // -------------------------------------------
    const frameworkColors: Record<string, string> = {
        "ISO 9001": "#10b981", // green
        "ISO 27001": "#3b82f6", // blue
        "ISO 14001": "#f59e0b", // amber
        "ISO 45001": "#8b5cf6", // purple
    };

    return (<div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Compliance Trend
            </h2>

            <ResponsiveContainer width="100%" height={320}>
                <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb"/>
                    <XAxis dataKey="month" stroke="#6b7280"/>
                    <YAxis domain={[0, 100]} stroke="#6b7280"/>
                    <Tooltip formatter={(value) => `${value}%`}/>
                    <Legend/>

                    {/* Generate one line per framework dynamically */}
                    {frameworks.map((fw) => (<Line
                            key={fw.code}
                            type="monotone"
                            dataKey={fw.code}
                            stroke={frameworkColors[fw.code] || "#000"}
                            strokeWidth={2}
                            dot={{r: 5}}
                            activeDot={{r: 7}}
                            name={fw.code}
                        />))}
                </LineChart>
            </ResponsiveContainer>
        </div>);
}