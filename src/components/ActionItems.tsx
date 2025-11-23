import { Circle, CheckCircle } from "lucide-react";

export function ActionItems() {
  const actions = [
    {
      id: 1,
      title: "Update risk assessment documentation for ISO 14001",
      standard: "ISO 14001",
      priority: "High",
      dueDate: "2025-11-25",
      assignee: "Emma Wilson",
      completed: false,
    },
    {
      id: 2,
      title: "Complete corrective action for access control findings",
      standard: "ISO 27001",
      priority: "High",
      dueDate: "2025-11-22",
      assignee: "James Taylor",
      completed: false,
    },
    {
      id: 3,
      title: "Schedule annual management review meeting",
      standard: "ISO 9001",
      priority: "Medium",
      dueDate: "2025-12-01",
      assignee: "Sarah Johnson",
      completed: false,
    },
    {
      id: 4,
      title: "Update emergency response procedures",
      standard: "ISO 45001",
      priority: "Medium",
      dueDate: "2025-11-28",
      assignee: "Michael Chen",
      completed: true,
    },
    {
      id: 5,
      title: "Review and update business continuity plan",
      standard: "ISO 22301",
      priority: "Low",
      dueDate: "2025-12-10",
      assignee: "David Martinez",
      completed: false,
    },
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High":
        return "bg-red-100 text-red-800";
      case "Medium":
        return "bg-yellow-100 text-yellow-800";
      case "Low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="divide-y divide-gray-200">
        {actions.map((action) => (
          <div key={action.id} className="p-6 hover:bg-gray-50">
            <div className="flex items-start gap-4">
              <div className="mt-1">
                {action.completed ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <Circle className="w-5 h-5 text-gray-400" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className={`text-gray-900 ${action.completed ? "line-through text-gray-500" : ""}`}>
                      {action.title}
                    </h3>
                    <div className="flex items-center gap-3 mt-2 text-sm">
                      <span className="text-gray-600">{action.standard}</span>
                      <span className="text-gray-400">•</span>
                      <span className="text-gray-600">Assigned to {action.assignee}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs ${getPriorityColor(action.priority)}`}>
                      {action.priority}
                    </span>
                    <span className={`text-sm ${action.completed ? "text-gray-500" : "text-gray-600"}`}>
                      Due {new Date(action.dueDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
