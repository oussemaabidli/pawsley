import { useRef, useState } from "react";
import { uploadImage } from "@/lib/upload";
import { Button } from "@/components/ui/button";
import { ImageIcon, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ImageUploadProps {
  /** Supabase Storage bucket name */
  bucket: string;
  /** Folder path inside the bucket */
  folder?: string;
  /** Current image URL (controlled) */
  value: string;
  /** Called with the new public URL after a successful upload, or "" when cleared */
  onChange: (url: string) => void;
  /** Tailwind aspect-ratio class, e.g. "aspect-square" or "aspect-video" */
  aspect?: string;
}

export function ImageUpload({
  bucket,
  folder = "",
  value,
  onChange,
  aspect = "aspect-square",
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    setUploading(true);
    try {
      const result = await uploadImage(bucket, file, folder);
      onChange(result.url);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mt-1">
      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          // Reset so the same file can be re-selected
          e.target.value = "";
        }}
      />

      {value ? (
        /* Preview */
        <div
          className={cn(
            "relative overflow-hidden rounded border border-border bg-secondary",
            aspect,
          )}
        >
          <img
            src={value}
            alt="Preview"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity hover:opacity-100">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                "Replace"
              )}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              onClick={() => onChange("")}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      ) : (
        /* Empty / upload zone */
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className={cn(
            "flex w-full flex-col items-center justify-center gap-2 rounded border border-dashed border-border bg-secondary/40 text-muted-foreground transition-colors hover:border-primary hover:bg-secondary",
            aspect,
          )}
        >
          {uploading ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <>
              <ImageIcon className="h-6 w-6" />
              <span className="text-xs">Click to upload image</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}
