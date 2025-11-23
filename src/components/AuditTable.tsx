import { CheckCircle, AlertTriangle, Clock } from "lucide-react";

export function AuditTable() {
  const audits = [
    {
      id: 1,
      standard: "ISO 9001",
      type: "Internal",
      date: "2025-11-05",
      auditor: "Sarah Johnson",
      findings: 2,
      status: "Completed",
      statusColor: "green",
    },
    {
      id: 2,
      standard: "ISO 27001",
      type: "External",
      date: "2025-10-22",
      auditor: "Global Cert Ltd",
      findings: 4,
      status: "Completed",
      statusColor: "green",
    },
    {
      id: 3,
      standard: "ISO 14001",
      type: "Internal",
      date: "2025-11-12",
      auditor: "Michael Chen",
      findings: 5,
      status: "In Progress",
      statusColor: "yellow",
    },
    {
      id: 4,
      standard: "ISO 45001",
      type: "Surveillance",
      date: "2025-11-18",
      auditor: "Safety First Inc",
      findings: 1,
      status: "Scheduled",
      statusColor: "blue",
    },
    {
      id: 5,
      standard: "ISO 22301",
      type: "Internal",
      date: "2025-10-15",
      auditor: "David Martinez",
      findings: 3,
      status: "Completed",
      statusColor: "green",
    },
  ];

  const getStatusIcon = (statusColor: string) => {
    switch (statusColor) {
      case "green":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "yellow":
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case "blue":
        return <Clock className="w-4 h-4 text-blue-600" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (statusColor: string) => {
    switch (statusColor) {
      case "green":
        return "bg-green-100 text-green-800";
      case "yellow":
        return "bg-yellow-100 text-yellow-800";
      case "blue":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
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
            {audits.map((audit) => (
              <tr key={audit.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-gray-900">{audit.standard}</td>
                <td className="px-6 py-4 text-gray-600">{audit.type}</td>
                <td className="px-6 py-4 text-gray-600">
                  {new Date(audit.date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-gray-600">{audit.auditor}</td>
                <td className="px-6 py-4 text-gray-600">{audit.findings}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs ${getStatusColor(audit.statusColor)}`}>
                    {getStatusIcon(audit.statusColor)}
                    {audit.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
