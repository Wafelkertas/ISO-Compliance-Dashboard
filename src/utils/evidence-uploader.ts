import supabase from "./supabase";

export async function uploadEvidenceFile(file: File): Promise<string | null> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
    const filePath = `evidence/${fileName}`;

    const { error: uploadError } = await supabase.storage
        .from("evidence_file")
        .upload(filePath, file);

    if (uploadError) {
        console.error("Upload error:", uploadError);
        return null;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
        .from("evidence_file")
        .getPublicUrl(filePath);

    return urlData.publicUrl;
}