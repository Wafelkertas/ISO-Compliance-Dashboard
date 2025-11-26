import { useEffect, useMemo, useRef, useState } from "react";
import supabase from "../utils/supabase";
import { UploadCloud, Check } from "lucide-react";
import { uploadEvidenceFile } from "../utils/evidence-uploader"; // helper described earlier
import { useNavigate } from "react-router-dom";

type Framework = {
    id: number;
    code?: string;
    name?: string;
    controls?: Control[];
};

type Control = {
    id: number;
    control_code?: string;
    title?: string;
    description?: string | null;
    question?: string | null;
    risk_level?: "High" | "Medium" | "Low" | string | null;
    framework_id?: number | null;
};

type ChecklistPeriod = {
    id: number;
    name?: string;
    start_date?: string | null;
    end_date?: string | null;
    is_closed?: boolean | null;
};

type ResponseRow = {
    id?: number;
    checklist_period_id: number;
    control_id: number;
    status: "compliant" | "non_conformity" | "not_applicable" | string;
    remarks?: string | null;
    evidence_url?: string | null;
};

export function ChecklistForm() {
    const navigate = useNavigate();
    const [frameworks, setFrameworks] = useState<Framework[]>([]);
    const [periods, setPeriods] = useState<ChecklistPeriod[]>([]);
    const [selectedPeriodId, setSelectedPeriodId] = useState<number | null>(null);
    // local map: controlId -> ResponseRow (loaded from DB + updated locally)
    const [responses, setResponses] = useState<Record<number, ResponseRow>>({});
    const [loading, setLoading] = useState(false);
    const [globalError, setGlobalError] = useState<string | null>(null);

    // saving state per control
    const [savingMap, setSavingMap] = useState<Record<number, boolean>>({});
    const saveTimeouts = useRef<Record<number, number | null>>({});

    // Load frameworks + nested controls
    async function loadFrameworks() {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("frameworks")
                .select(
                    `id, code, name, controls(id, control_code, title, description, question, risk_level, framework_id)`
                )
                .order("id", { ascending: true });

            if (error) throw error;
            setFrameworks((data as any) || []);
        } catch (err: any) {
            console.error("loadFrameworks error", err);
            setGlobalError("Failed to load frameworks");
        } finally {
            setLoading(false);
        }
    }

    // Load checklist periods for dropdown
    async function loadPeriods() {
        try {
            const { data, error } = await supabase
                .from("checklist_periods")
                .select("*")
                .order("start_date", { ascending: false });

            if (error) throw error;
            setPeriods(data || []);
            if (data && data.length > 0) {
                setSelectedPeriodId(data[0].id);
            }
        } catch (err: any) {
            console.error("loadPeriods error", err);
            setGlobalError("Failed to load periods");
        }
    }

    // Load responses for selected period (map them)
    async function loadResponses(periodId: number) {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("checklist_responses")
                .select("id, checklist_period_id, control_id, status, remarks, evidence_url")
                .eq("checklist_period_id", periodId);

            if (error) throw error;

            const map: Record<number, ResponseRow> = {};
            (data || []).forEach((r: any) => {
                map[r.control_id] = {
                    id: r.id,
                    checklist_period_id: r.checklist_period_id,
                    control_id: r.control_id,
                    status: r.status,
                    remarks: r.remarks,
                    evidence_url: r.evidence_url,
                };
            });

            setResponses(map);
        } catch (err: any) {
            console.error("loadResponses error", err);
            setGlobalError("Failed to load responses for the period");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadFrameworks();
        loadPeriods();
    }, []);

    // when period changes, load responses
    useEffect(() => {
        if (selectedPeriodId && typeof selectedPeriodId === "number") {
            loadResponses(selectedPeriodId);
        } else {
            setResponses({});
        }
        // clear any saving map/timeouts
        setSavingMap({});
        Object.keys(saveTimeouts.current).forEach((k) => {
            const v = saveTimeouts.current[Number(k)];
            if (v) {
                window.clearTimeout(v);
                saveTimeouts.current[Number(k)] = null;
            }
        });
    }, [selectedPeriodId]);

    const allControls = useMemo(() => {
        const arr: Control[] = [];
        for (const fw of frameworks) {
            if (fw.controls) {
                for (const c of fw.controls) arr.push(c);
            }
        }
        return arr;
    }, [frameworks]);

    // helper to mark saving state
    function setSaving(controlId: number, val: boolean) {
        setSavingMap((s) => ({ ...s, [controlId]: val }));
    }

    // update a single field in DB using .update() because cronjob precreates rows
    async function updateResponseField(
        controlId: number,
        patch: Partial<ResponseRow>
    ) {
        if (!selectedPeriodId) {
            console.warn("No period selected; skipping update");
            return;
        }

        setSaving(controlId, true);
        setGlobalError(null);

        try {
            const updatePayload: any = { ...patch };

            // Perform the update: filter by checklist_period_id and control_id
            const { error } = await supabase
                .from("checklist_responses")
                .update(updatePayload)
                .eq("checklist_period_id", selectedPeriodId as number)
                .eq("control_id", controlId);

            if (error) {
                console.error("updateResponseField error", error);
                setGlobalError("Failed to save changes");
            } else {
                // locally patch the responses map to reflect saved state
                setResponses((prev) => {
                    const existing = prev[controlId] || {
                        checklist_period_id: selectedPeriodId as number,
                        control_id: controlId,
                        status: "not_applicable",
                        remarks: null,
                        evidence_url: null,
                    };
                    const merged = { ...existing, ...patch };
                    return { ...prev, [controlId]: merged };
                });
            }
        } catch (err: any) {
            console.error("updateResponseField catch", err);
            setGlobalError("Unexpected save error");
        } finally {
            setSaving(controlId, false);
        }
    }

    // Status change: immediate save
    function handleStatusChange(controlId: number, newStatus: ResponseRow["status"]) {
        // update local UI immediately
        setResponses((prev) => {
            const existing = prev[controlId] || {
                checklist_period_id: selectedPeriodId as number,
                control_id: controlId,
                status: "not_applicable",
                remarks: null,
                evidence_url: null,
            };
            return { ...prev, [controlId]: { ...existing, status: newStatus } };
        });

        // save
        updateResponseField(controlId, { status: newStatus });
    }

    // Remarks autosave (debounced)
    function handleRemarksChange(controlId: number, newRemarks: string) {
        // update local UI immediately
        setResponses((prev) => {
            const existing = prev[controlId] || {
                checklist_period_id: selectedPeriodId as number,
                control_id: controlId,
                status: "not_applicable",
                remarks: null,
                evidence_url: null,
            };
            return { ...prev, [controlId]: { ...existing, remarks: newRemarks } };
        });

        // debounce save: 500ms
        if (saveTimeouts.current[controlId]) {
            window.clearTimeout(saveTimeouts.current[controlId] as number);
        }

        const t = window.setTimeout(() => {
            updateResponseField(controlId, { remarks: newRemarks });
            saveTimeouts.current[controlId] = null;
        }, 500);

        saveTimeouts.current[controlId] = t;
    }

    // Evidence upload: upload file then update evidence_url column
    async function handleEvidenceUpload(controlId: number, file?: File) {
        if (!file) return;
        if (!selectedPeriodId) {
            setGlobalError("Please select a checklist period first");
            return;
        }

        setSaving(controlId, true);

        try {
            // uploadEvidenceFile should upload to Supabase Storage and return publicUrl
            const publicUrl = await uploadEvidenceFile(file);

            if (!publicUrl) {
                setGlobalError("Upload failed");
                setSaving(controlId, false);
                return;
            }

            // update database
            await updateResponseField(controlId, { evidence_url: publicUrl });
        } catch (err: any) {
            console.error("handleEvidenceUpload error", err);
            setGlobalError("Upload error");
        } finally {
            setSaving(controlId, false);
        }
    }

    // remove evidence: clear DB and local state. Optionally delete from storage
    async function removeEvidence(controlId: number) {
        if (!selectedPeriodId) return;

        setSaving(controlId, true);
        try {
            // Update DB to null evidence_url
            await updateResponseField(controlId, { evidence_url: null });

            // Optionally: you can delete object from storage if you stored the path
            // If you want to delete from storage, you'd need to store the object path.
        } catch (err: any) {
            console.error("removeEvidence error", err);
            setGlobalError("Failed to remove evidence");
        } finally {
            setSaving(controlId, false);
        }
    }

    function onBackClick(): void {
        navigate("/");
    }

    // small UI helpers
    function formatDate(iso?: string | null) {
        if (!iso) return "-";
        try {
            return new Date(iso).toLocaleDateString();
        } catch {
            return iso;
        }
    }

    return (
        <div className="max-w-6xl mx-auto p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Checklist</h2>
                <div className="flex gap-3 items-center">
                    <button
                        type="button"
                        onClick={onBackClick}
                        className="px-3 py-2 rounded-md border bg-white text-gray-700 hover:bg-gray-50"
                    >
                        Back
                    </button>
                </div>
            </div>

            {/* Period selector */}
            <div className="mb-6">
                <label className="block text-sm text-gray-600 mb-2">Checklist Period</label>
                <div className="flex gap-3">
                    <select
                        className="px-3 py-2 rounded-md border border-gray-300 bg-white"
                        value={selectedPeriodId ?? ""}
                        onChange={(e) => {
                            const v = e.target.value;
                            setSelectedPeriodId(v ? Number(v) : null);
                        }}
                    >
                        <option value="">-- Select period --</option>
                        {periods.map((p) => (
                            <option key={p.id} value={p.id}>
                                {p.name} ({formatDate(p.start_date)} — {formatDate(p.end_date)})
                            </option>
                        ))}
                    </select>

                    {/*<button*/}
                    {/*    type="button"*/}
                    {/*    onClick={async () => {*/}
                    {/*        // New period helper: create month period for today*/}
                    {/*        const now = new Date();*/}
                    {/*        const name = `${now.toLocaleString("default", { month: "long" })} ${now.getFullYear()}`;*/}
                    {/*        const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();*/}
                    {/*        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();*/}

                    {/*        const { data, error } = await supabase*/}
                    {/*            .from("checklist_periods")*/}
                    {/*            .insert([{ name, start_date: start, end_date: end, is_closed: false }])*/}
                    {/*            .select()*/}
                    {/*            .single();*/}

                    {/*        if (error) {*/}
                    {/*            console.error("create period error", error);*/}
                    {/*            setGlobalError("Failed to create period");*/}
                    {/*        } else {*/}
                    {/*            setPeriods((prev) => [data, ...prev]);*/}
                    {/*            setSelectedPeriodId(data.id);*/}
                    {/*        }*/}
                    {/*    }}*/}
                    {/*    className="px-3 py-2 rounded-md border bg-white hover:bg-gray-50"*/}
                    {/*>*/}
                    {/*    + New Period*/}
                    {/*</button>*/}
                </div>
                {globalError && <p className="text-sm text-red-600 mt-2">{globalError}</p>}
            </div>

            {loading && <p className="text-gray-500">Loading...</p>}

            {/* Framework groups */}
            {!loading &&
                frameworks.map((fw) => (
                    <div key={fw.id} className="mb-6">
                        <div className="flex items-center justify-between mb-3">
                            <div>
                                <h3 className="text-md font-semibold text-gray-800">{fw.code ?? fw.name}</h3>
                                <p className="text-sm text-gray-500">{fw.name}</p>
                            </div>
                            <div className="text-sm text-gray-500">Controls: {fw.controls?.length ?? 0}</div>
                        </div>

                        <div className="bg-white border border-gray-100 rounded-lg shadow-sm divide-y">
                            {(fw.controls || []).map((control) => {
                                const resp = responses[control.id];
                                const curStatus = resp?.status ?? "";
                                const curRemarks = resp?.remarks ?? "";
                                const curEvidence = resp?.evidence_url ?? "";
                                const isSaving = !!savingMap[control.id];

                                return (
                                    <div key={control.id} className="p-4">
                                        <div className="flex justify-between gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <div className="text-sm text-gray-500">{control.control_code}</div>
                                                        <div className="text-gray-900 font-medium">{control.title}</div>
                                                        {control.description && <div className="text-sm text-gray-600 mt-1">{control.description}</div>}
                                                        {control.question && <div className="text-sm text-gray-600 mt-1 italic">Pertanyaan: {control.question}</div>}
                                                    </div>

                                                    <div className="ml-4 flex-shrink-0 text-right">
                                                        <div className="text-xs text-gray-500 mb-2">Risk</div>
                                                        <div
                                                            className={`px-2 py-1 rounded text-xs font-medium ${
                                                                control.risk_level === "High"
                                                                    ? "bg-red-100 text-red-700"
                                                                    : control.risk_level === "Medium"
                                                                        ? "bg-yellow-100 text-yellow-700"
                                                                        : "bg-green-100 text-green-700"
                                                            }`}
                                                        >
                                                            {control.risk_level ?? "Low"}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="mt-3 flex items-center gap-4">
                                                    {/* Radio statuses */}
                                                    <label className="inline-flex items-center gap-2">
                                                        <input
                                                            type="radio"
                                                            name={`status-${control.id}`}
                                                            checked={curStatus === "compliant"}
                                                            onChange={() => handleStatusChange(control.id, "compliant")}
                                                            className="w-4 h-4"
                                                        />
                                                        <span className="text-sm text-gray-700">Compliant</span>
                                                    </label>

                                                    <label className="inline-flex items-center gap-2">
                                                        <input
                                                            type="radio"
                                                            name={`status-${control.id}`}
                                                            checked={curStatus === "non_conformity"}
                                                            onChange={() => handleStatusChange(control.id, "non_conformity")}
                                                            className="w-4 h-4"
                                                        />
                                                        <span className="text-sm text-gray-700">Non-conformity</span>
                                                    </label>

                                                    <label className="inline-flex items-center gap-2">
                                                        <input
                                                            type="radio"
                                                            name={`status-${control.id}`}
                                                            checked={curStatus === "not_applicable"}
                                                            onChange={() => handleStatusChange(control.id, "not_applicable")}
                                                            className="w-4 h-4"
                                                        />
                                                        <span className="text-sm text-gray-700">N/A</span>
                                                    </label>
                                                </div>

                                                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    <input
                                                        type="text"
                                                        placeholder="Remarks (optional)"
                                                        value={curRemarks ?? ""}
                                                        onChange={(e) => handleRemarksChange(control.id, e.target.value)}
                                                        className="w-full px-3 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-200"
                                                    />

                                                    <div className="flex items-center gap-3">
                                                        <input
                                                            id={`file-${control.id}`}
                                                            type="file"
                                                            accept="image/*,application/pdf"
                                                            capture="environment"
                                                            className="hidden"
                                                            onChange={async (e) => {
                                                                const file = e.target.files?.[0];
                                                                if (!file) return;
                                                                await handleEvidenceUpload(control.id, file);
                                                                // clear input so same file can be chosen again later
                                                                (e.target as HTMLInputElement).value = "";
                                                            }}
                                                        />

                                                        <button
                                                            type="button"
                                                            onClick={() => document.getElementById(`file-${control.id}`)?.click()}
                                                            className="px-3 py-2 rounded-md bg-gray-100 hover:bg-gray-200 border flex items-center gap-2"
                                                        >
                                                            <UploadCloud className="w-4 h-4" />
                                                            Upload Evidence
                                                        </button>

                                                        {curEvidence ? (
                                                            <>
                                                                <a href={curEvidence} target="_blank" rel="noreferrer" className="text-blue-600 underline text-sm">
                                                                    View
                                                                </a>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeEvidence(control.id)}
                                                                    className="text-red-600 text-sm ml-2"
                                                                >
                                                                    Remove
                                                                </button>
                                                            </>
                                                        ) : null}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Right column: saving indicator */}
                                            <div className="w-36 flex flex-col items-end">
                                                <div className="text-sm text-gray-600">{isSaving ? "Saving..." : "Saved"}</div>
                                                <div className="mt-2">
                                                    {isSaving ? (
                                                        <div className="text-xs text-gray-500">…</div>
                                                    ) : (
                                                        <div className="text-green-600">
                                                            <Check className="w-4 h-4 inline" />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
        </div>
    );
}