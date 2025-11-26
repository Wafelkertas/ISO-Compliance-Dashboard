import { useEffect, useState } from "react";
import { CheckCircle, Circle } from "lucide-react";
import supabase from "../utils/supabase";
import { getPaginationPages } from "../utils/paginator";

export function ActionItems() {
  const [items, setItems] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const pageSize = 10;

  async function loadTotalPages() {
    const { count } = await supabase
      .from("checklist_responses")
      .select("*", { count: "exact", head: true })
      .neq("status", "compliant");
    console.log("TOTAL NON-COMPLIANT ITEMS =", count);

    if (count) {
      setTotalPages(Math.ceil(count / pageSize));
    }
  }

  async function loadItems() {
    setLoading(true);

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data } = await supabase
      .from("checklist_responses")
      .select(
        `
        id,
        status,
        checklist_periods:checklist_period_id ( end_date ),
        controls:control_id (
          title,
          risk_level,
          frameworks:framework_id ( name )
        )
      `,
      )
      .neq("status", "compliant")
      .range(from, to);

    setItems(data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadTotalPages();
  }, []);

  useEffect(() => {
    loadItems();
  }, [page]);

  const priorityColors: Record<string, string> = {
    High: "bg-red-500 text-white-200",
    Medium: "bg-yellow-100 text-yellow-700",
    Low: "bg-green-100 text-green-700",
  };
  console.log("RENDER => current page =", page);
  console.log("PAGES FROM PAGINATOR =>", getPaginationPages(page, totalPages));

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Action Items</h2>

      <div className="divide-y divide-gray-200">
        {items.map((item) => {
          const title = item.controls?.title ?? "Unknown task";
          const risk = item.controls?.risk_level ?? "Low";
          const iso = item.controls?.frameworks?.name ?? "ISO";
          const due = new Date(
            item.checklist_periods?.end_date,
          ).toLocaleDateString();
          const done = item.status === "compliant" || item.status === "closed";

          return (
            <div
              key={item.id}
              className="flex items-start justify-between py-4"
            >
              <div className="flex items-start gap-4">
                {done ? (
                  <CheckCircle className="w-5 h-5 text-green-600 mt-1" />
                ) : (
                  <Circle className="w-5 h-5 text-gray-400 mt-1" />
                )}

                <div>
                  <p
                    className={`text-gray-900 ${done ? "line-through text-gray-400" : ""}`}
                  >
                    {title}
                  </p>
                  <p className="text-gray-600 text-sm">
                    {iso} • Due {due}
                  </p>
                </div>
              </div>

              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${priorityColors[risk] || priorityColors.Low}`}
              >
                {risk}
              </span>
            </div>
          );
        })}
      </div>

      {/* Numbered Pagination */}
      {/* Numbered Pagination (Bottom Right) */}
      <div className="flex justify-end mt-6">
        <div className="flex items-center gap-2">
          {/* PREV button */}
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-3 py-1 rounded-full border text-sm disabled:opacity-40"
          >
            Prev
          </button>

          {getPaginationPages(page, totalPages).map((p, index) =>
            typeof p === "string" ? (
              <span key={index} className="px-2 text-gray-400">
                …
              </span>
            ) : (
              <button
                type="button"
                key={index}
                onClick={() => setPage(Number(p))}
                className={`px-3 py-1 rounded-full text-sm border transition
  ${Number(p) === page
                    ? "!bg-blue-600 !text-white !border-blue-600"
                    : "bg-white text-gray-700 hover:bg-gray-100"
                }`}>
                {p}
              </button>
            ),
          )}

          {/* NEXT button */}
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="px-3 py-1 rounded-full border text-sm disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>

      {loading && (
        <p className="text-center text-gray-500 text-sm mt-2">Loading…</p>
      )}
    </div>
  );
}
