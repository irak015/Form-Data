import React, { useRef, useState } from "react";
import { Upload, X, Image as ImageIcon, AlertCircle } from "lucide-react";

interface DragDropUploadProps {
  foto: string | null;
  fotoName: string | null;
  fotoSize: string | null;
  onChange: (data: { foto: string | null; name: string | null; size: string | null }) => void;
}

export const DragDropUpload: React.FC<DragDropUploadProps> = ({
  foto,
  fotoName,
  fotoSize,
  onChange,
}) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    setError(null);

    // Validate if it is an image
    if (!file.type.startsWith("image/")) {
      setError("Hanya bisa upload file gambar ya, Sob! (PNG, JPG, WEBP, GIF)");
      return;
    }

    // Since we compress the image client-side, we can support convenient initial phone files up to 15MB
    const maxSize = 15 * 1024 * 1024; // 15MB
    if (file.size > maxSize) {
      setError("Gede banget filenya! Maksimal 15MB ya, Sob.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        // Target max dimension
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        // Maintain aspect ratio
        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        
        if (!ctx) {
          // Fallback to original uncompressed file if canvas is unsuited
          const sizeStr = (file.size / 1024).toFixed(1) + " KB";
          onChange({
            foto: reader.result as string,
            name: file.name,
            size: sizeStr,
          });
          return;
        }

        // Draw image into canvas and extract compressed JPEG (75% quality is perfect balance)
        ctx.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL("image/jpeg", 0.75);

        // Calculate size in KB from base64 string length (~3/4 bytes per char)
        const approxBytes = Math.round((compressedBase64.length * 3) / 4);
        const sizeStr = (approxBytes / 1024).toFixed(1) + " KB (Kompresi Otomatis)";

        onChange({
          foto: compressedBase64,
          name: file.name,
          size: sizeStr,
        });
      };
      
      img.onerror = () => {
        // Fallback to original on loading error
        const sizeStr = (file.size / 1024).toFixed(1) + " KB";
        onChange({
          foto: reader.result as string,
          name: file.name,
          size: sizeStr,
        });
      };
      
      img.src = reader.result as string;
    };
    
    reader.onerror = () => {
      setError("Gagal membaca file gambar.");
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange({
      foto: null,
      name: null,
      size: null,
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <span className="text-xs font-bold text-white uppercase tracking-widest ml-1 flex items-center gap-2">
        <ImageIcon className="w-3.5 h-3.5" />
        <span>Lampiran Foto</span>
      </span>

      <div
        id="drag-drop-zone"
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={foto ? undefined : onButtonClick}
        className={`relative w-full rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-6 text-center transition-all duration-300 backdrop-blur-md cursor-pointer group min-h-[140px] ${
          foto
            ? "border-emerald-400 bg-white/10"
            : isDragActive
            ? "border-white bg-white/20 scale-[1.01] shadow-[0_0_20px_rgba(255,255,255,0.3)]"
            : "border-white/30 bg-white/10 hover:border-white/60 hover:bg-white/15"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleChange}
        />

        {foto ? (
          <div className="flex items-center gap-4 w-full">
            {/* Image preview with fancy glow border */}
            <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-emerald-400/50 shadow-lg shrink-0">
              <img
                src={foto}
                alt="File preview"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* File info */}
            <div className="flex flex-col text-left overflow-hidden grow">
              <span className="text-white text-sm font-semibold truncate">
                {fotoName}
              </span>
              <span className="text-white/50 text-[11px] font-mono mt-0.5">
                Ukuran: {fotoSize}
              </span>
              <span className="inline-flex max-w-[max-content] items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 text-[10px] font-medium mt-1.5">
                ● Berhasil Diunggah!
              </span>
            </div>

            {/* Action buttons */}
            <button
              id="remove-photo-button"
              onClick={handleRemove}
              className="p-2 sm:p-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/25 border border-red-500/20 text-red-400 hover:text-red-300 transition-all cursor-pointer shadow-md group/btn"
              title="Ganti Foto"
            >
              <X className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="p-3.5 rounded-2xl bg-white/10 text-pink-300 group-hover:bg-gradient-to-r group-hover:from-pink-500 group-hover:to-purple-500 group-hover:text-white transition-all duration-300 shadow-md">
              <Upload className="w-6 h-6 animate-bounce" />
            </div>
            <div className="mt-1">
              <span className="text-white font-medium text-sm">
                Sret! Drag & drop foto kece-mu di sini, atau{" "}
                <span className="text-pink-300 hover:text-pink-200 underline font-semibold transition-colors">
                  cari file
                </span>
              </span>
              <p className="text-white/40 text-[11px] mt-1">
                Format standard PNG, JPG, WEBP, atau GIF (Maksimal 5MB)
              </p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <span className="flex items-center gap-1.5 text-xs text-rose-400 p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 mt-1 font-medium">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </span>
      )}
    </div>
  );
};
