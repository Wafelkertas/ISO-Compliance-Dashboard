import {JSX, useEffect, useState} from "react";
import supabase from "../utils/supabase";
import {CheckCircle, AlertTriangle, Clock} from "lucide-react";

export function AuditTable() {
    const [audits, setAudits] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Map checklist_periods → Audit rows
    async function loadAudits() {
        setLoading(true);

        // 1. Load periods
        const {data: periods} = await supabase
            .from("checklist_periods")
            .select("*")
            .order("start_date", {ascending: false});

        if (!periods) {
            setAudits([]);
            setLoading(false);
            return;
        }

        // 2. Load all frameworks (ISO 27001, ISO 9001, ...)
        const {data: frameworks} = await supabase
            .from("frameworks")
            .select("*");

        const result: any[] = [];

        for (const p of periods) {
            // 3. Count findings (non-compliant responses)
            const {count: findings} = await supabase
                .from("checklist_responses")
                .select("*", {count: "exact", head: true})
                .eq("checklist_period_id", p.id)
                .neq("status", "compliant");

            // 4. Derive framework name
            // If your period does not store framework_id, pick the first framework as placeholder
            const framework = frameworks?.find((f) => f.id === p.framework_id) || frameworks?.[0];

            // 5. Build audit row from period
            result.push({
                id: p.id,
                standard: framework?.code || "ISO",
                type: "Internal", // single-user system
                date: p.start_date,
                auditor: "System", // no users yet
                findings: findings ?? 0,
                status: p.is_closed ? "Completed" : "In Progress",
                color: p.is_closed ? "green" : "yellow",
            });
        }

        setAudits(result);
        setLoading(false);
    }

    useEffect(() => {
        loadAudits();
    }, []);

    const statusColors: Record<string, string> = {
        green: "bg-green-100 text-green-800",
        yellow: "bg-yellow-100 text-yellow-800",
        blue: "bg-blue-100 text-blue-800",
        gray: "bg-gray-100 text-gray-800",
    };

    const statusIcons: Record<string, JSX.Element> = {
        green: <CheckCircle className="w-4 h-4 text-green-600"/>,
        yellow: <Clock className="w-4 h-4 text-yellow-600"/>,
        blue: <Clock className="w-4 h-4 text-blue-600"/>,
        gray: <AlertTriangle className="w-4 h-4 text-gray-600"/>,
    };

    const getBadge = (color: string, status: string) => (<span
            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${statusColors[color] || statusColors.gray}`}
        >
      {statusIcons[color] || statusIcons.gray}
            {status}
    </span>);

    if (loading) {
        return (<div className="bg-white rounded-lg border border-gray-200 p-6">
                <p className="text-gray-500">Loading audits...</p>
            </div>);
    }

    return (<div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                        <th className="px-6 py-3 text-left text-gray-600">Standard</th>
                        <th className="px-6 py-3 text-left text-gray-600">Type</th>
                        <th className="px-6 py-3 text-left text-gray-600">Date</th>
                        <th className="px-6 py-3 text-left text-gray-600">Auditor</th>
                        <th className="px-6 py-3 text-left text-gray-600">Findings</th>
                        <th className="px-6 py-3 text-left text-gray-600">Status</th>
                    </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-200">
                    {audits.map((audit) => (<tr key={audit.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-gray-900">{audit.standard}</td>
                            <td className="px-6 py-4 text-gray-600">{audit.type}</td>
                            <td className="px-6 py-4 text-gray-600">
                                {new Date(audit.date).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 text-gray-600">{audit.auditor}</td>
                            <td className="px-6 py-4 text-gray-600">{audit.findings}</td>
                            <td className="px-6 py-4">
                                {getBadge(audit.color, audit.status)}
                            </td>
                        </tr>))}
                    </tbody>
                </table>
            </div>
        </div>);
}