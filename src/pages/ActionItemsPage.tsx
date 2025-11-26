import {ActionItems} from "../components/ActionItems";

export function ActionItemsPage() {
    return (
        <div className="max-w-7xl mx-auto px-4 py-6">
            <h1 className="text-xl font-semibold mb-4">Tindakan yang Harus Dilakukan</h1>
            <ActionItems />
        </div>
    );
}