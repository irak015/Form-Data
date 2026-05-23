import React, { useState } from "react";
import { Sparkles, MapPin, Calendar, CheckSquare, ShieldCheck, HelpCircle, Download } from "lucide-react";
import { FormData } from "../types";

interface InteractiveCardProps {
  data: FormData;
}

export const InteractiveCard: React.FC<InteractiveCardProps> = ({ data }) => {
  const [downloading, setDownloading] = useState<boolean>(false);

  const handleDownload = async () => {
    const cardEl = document.getElementById("virtual-card-capture");
    if (!cardEl) return;

    setDownloading(true);
    try {
      const { toJpeg } = await import("html-to-image");
      
      // Short delay to allow browser to calculate full layout perfectly
      await new Promise((r) => setTimeout(r, 120));

      const dataUrl = await toJpeg(cardEl, {
        quality: 0.95,
        backgroundColor: "#120822", // beautiful deep violet/space background to fill transparent regions
        cacheBust: true,
        style: {
          transform: "scale(1)",
          borderRadius: "28px",
        },
      });

      const link = document.createElement("a");
      const filename = data.namaPanggilan 
        ? `kartu_irak_015_${data.namaPanggilan.toLowerCase()}.jpg` 
        : "kartu_irak_015_anggota.jpg";
      link.download = filename;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Gagal mendownload kartu virtual sebagai JPEG:", error);
    } finally {
      setDownloading(false);
    }
  };

  // Calculate dynamic age if date of birth is valid
  const getAge = (dobString: string): string => {
    if (!dobString) return "";
    const birthDate = new Date(dobString);
    if (isNaN(birthDate.getTime())) return "";
    
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age >= 0 ? `${age} Tahun` : "";
  };

  const age = getAge(data.tanggalLahir);

  // Generate a procedural geometric dynamic background pattern based on nickname initials when foto is empty
  const getInitials = (name: string) => {
    if (!name) return "✨";
    return name.slice(0, 2).toUpperCase();
  };

  const initials = getInitials(data.namaPanggilan || data.namaLengkap);

  // Form completion progress tracker
  const getCompletionPercentage = (): number => {
    let filled = 0;
    const total = 7; // namaLengkap, namaPanggilan, tempatLahir, tanggalLahir, alamat, rt, foto
    if (data.namaLengkap.trim()) filled++;
    if (data.namaPanggilan.trim()) filled++;
    if (data.tempatLahir.trim()) filled++;
    if (data.tanggalLahir) filled++;
    if (data.alamat.trim()) filled++;
    if (data.rt.trim()) filled++;
    if (data.foto) filled++;
    return Math.round((filled / total) * 100);
  };

  const completionPercent = getCompletionPercentage();

  return (
    <div className="w-full flex flex-col gap-4">
      {/* ProgressBar */}
      <div className="w-full bg-white/10 border border-white/20 rounded-2xl p-4 backdrop-blur-md">
        <div className="flex justify-between items-center mb-1.5 label text-xs font-bold uppercase tracking-widest text-white">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-white animate-spin" />
            Kartu Profil Completion
          </span>
          <span className="text-white font-black">{completionPercent}%</span>
        </div>
        <div className="w-full h-2.5 bg-black/20 rounded-full overflow-hidden p-[1px] border border-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#FF3D77] via-[#A635FF] to-[#3B82F6] transition-all duration-700 ease-out shadow-[0_0_10px_rgba(255,255,255,0.4)]"
            style={{ width: `${completionPercent}%` }}
          />
        </div>
      </div>

      {/* Main Glassmorphic Hologram Card */}
      <div id="virtual-card-capture" className="relative w-full aspect-[1.586/1] xs:aspect-[1.586/1] sm:aspect-auto rounded-[28px] overflow-hidden p-6 text-white border border-white/30 backdrop-blur-2xl shadow-[0_32px_64px_rgba(0,0,0,0.25)] flex flex-col justify-between group/card transition-all duration-500 hover:border-white/50 hover:shadow-[0_32px_64px_rgba(255,255,255,0.15)] bg-white/10">
        
        {/* Animated glow background inside the card */}
        <div className="absolute inset-0 bg-gradient-to-tr from-[#FF3D77]/20 via-[#A635FF]/20 to-[#3B82F6]/20 opacity-70" />
        <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-[#A635FF]/20 rounded-full blur-3xl group-hover/card:translate-x-12 group-hover/card:translate-y-12 transition-transform duration-1000" />
        <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-[#3B82F6]/10 rounded-full blur-3xl" />
        
        {/* Abstract Cyberpunk Grid Accents */}
        <div className="absolute inset-0 opacity-10 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:24px_24px]" />

        {/* Card Header */}
        <div className="relative flex justify-between items-start z-10">
          <div>
            <span className="text-[10px] font-mono tracking-widest text-white/80 uppercase font-black">
              YOUTH CARD // ID-ACCESS
            </span>
            <h3 className="text-lg font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white mt-0.5">
              GenZ Connect
            </h3>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 border border-white/30 backdrop-blur-md">
            <ShieldCheck className="w-4 h-4 text-white" />
            <span className="text-[10px] font-mono font-bold tracking-wider text-white/90">
              verified
            </span>
          </div>
        </div>

        {/* Card Body with photo and details */}
        <div className="relative flex gap-5 my-5 z-10 items-center">
          
          {/* Avatar Area */}
          <div className="relative group/avatar shrink-0 w-24 h-24 sm:w-28 sm:h-28 rounded-2xl p-[1.5px] bg-gradient-to-br from-[#FF3D77] via-[#A635FF] to-[#3B82F6] shadow-[0_8px_20px_rgba(0,0,0,0.3)] hover:scale-105 transition-transform duration-300">
            <div className="w-full h-full bg-[#120822] rounded-2xl overflow-hidden relative">
              {data.foto ? (
                <img
                  src={data.foto}
                  alt="Avatar"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover/avatar:scale-110"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-tr from-[#FF3D77]/20 via-[#A635FF]/20 to-[#3B82F6]/20 text-center p-2">
                  <span className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-[#FF3D77] to-[#3B82F6] animate-pulse font-mono">
                    {initials}
                  </span>
                  <span className="text-[9px] text-white/40 mt-1 uppercase font-mono font-bold tracking-wider">
                     no pic
                  </span>
                </div>
              )}
            </div>
            {/* Hologram barcode footer decorative accent */}
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-white text-[#A635FF] px-2 py-0.5 rounded-md text-[8px] font-mono font-black border border-[#A635FF] shadow-md uppercase">
              GP-{initials}-{data.rt ? data.rt : "RT00"}
            </div>
          </div>

          {/* Details Section */}
          <div className="flex flex-col gap-1.5 overflow-hidden text-left grow">
            {/* Nickname / Handle */}
            <div>
              <span className="text-2xl sm:text-3xl font-black tracking-tight text-white hover:text-cyan-300 transition-colors truncate block">
                {data.namaPanggilan ? `@${data.namaPanggilan.toLowerCase()}` : "@username"}
              </span>
              <span className="text-xs text-white/60 font-medium block truncate -mt-0.5 font-mono">
                {data.namaLengkap ? data.namaLengkap : "Nama Lengkap Kece-mu"}
              </span>
            </div>

            {/* Birth / Place-Date */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10px] text-white/80">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-white shrink-0" />
                <span>
                  {data.tempatLahir ? data.tempatLahir : "Mandalika"}
                  {data.tanggalLahir ? `, ${data.tanggalLahir.split("-").reverse().join("/")}` : ", 20/05/2005"}
                </span>
              </span>
              {age && (
                <span className="px-1.5 py-0.5 rounded bg-white/20 text-white border border-white/20 text-[9px] font-bold">
                  {age}
                </span>
              )}
            </div>

            {/* Location (Alamat) */}
            <div className="flex items-center gap-1.5 text-xs text-white/95 max-w-full">
              <MapPin className="w-3.5 h-3.5 text-white shrink-0" />
              <span className="truncate font-semibold text-[11px] sm:text-xs">
                {data.alamat ? `${data.alamat}` : "Alamat Keren-mu"} 
                {data.rt && <span className="text-white font-mono text-[10px] ml-1 bg-white/20 border border-white/30 px-1 py-0.2 rounded">RT {data.rt}</span>}
              </span>
            </div>
          </div>
        </div>

        {/* Card Footer */}
        <div className="relative border-t border-white/20 pt-3 mt-1 flex justify-between items-center z-10">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-white animate-ping" />
            <span className="text-[9px] font-mono text-white/70 tracking-wider">
              ONLINE STATE ACTIVE
            </span>
          </div>
          {/* Fake cool chip design */}
          <div className="w-9 h-6 rounded-md bg-gradient-to-br from-amber-300 via-yellow-200 to-amber-400 opacity-80 relative overflow-hidden border border-white/20">
            <div className="absolute inset-x-0.5 top-1 h-[1px] bg-black/40" />
            <div className="absolute inset-y-0.5 left-2 w-[1px] bg-black/40" />
            <div className="absolute inset-y-0.5 right-2.5 w-[1px] bg-black/40" />
          </div>
        </div>
      </div>

      {/* Action Download Cards Button */}
      <button
        type="button"
        id="download-preview-card-btn"
        disabled={downloading || !data.namaPanggilan}
        onClick={handleDownload}
        className="w-full flex items-center justify-center gap-2 py-3.5 px-5 rounded-2xl bg-gradient-to-r from-[#FF3D77] to-[#A635FF] hover:from-[#ff5b8e] hover:to-[#b152ff] disabled:from-white/10 disabled:to-white/10 text-white font-black text-xs uppercase tracking-wider transition-all duration-300 shadow-lg hover:shadow-[0_12px_32px_rgba(166,53,255,0.35)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer active:scale-[0.98]"
        title={data.namaPanggilan ? "Download kartu identitas digital JPEG" : "Harap isi nama panggilan Anda terlebih dahulu"}
      >
        {downloading ? (
          <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin shrink-0" />
        ) : (
          <Download className="w-4 h-4 shrink-0 text-white" />
        )}
        <span>{downloading ? "Ekspor Gambar JPEG..." : "Unduh Kartu Anggota (JPEG)"}</span>
      </button>
    </div>
  );
};
