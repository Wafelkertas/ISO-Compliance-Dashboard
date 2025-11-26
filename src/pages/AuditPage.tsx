import {AuditTable} from "../components/AuditTable";

export function AuditPage() {
    return (
        <div className="max-w-7xl mx-auto px-4 py-6">
            <h1 className="text-xl font-semibold mb-4">Daftar Audit</h1>
            <AuditTable />
        </div>
    );
}