import React, { useEffect } from "react";
import { Sparkles, Check, ChevronRight, RefreshCw, Calendar, MapPin, Download, Award, Music } from "lucide-react";
import { FormData } from "../types";
import confetti from "canvas-confetti";

interface SuccessModalProps {
  data: FormData;
  onClose: () => void;
}

export const SuccessModal: React.FC<SuccessModalProps> = ({ data, onClose }) => {
  // Fire multiple waves of beautiful confetti on mount
  useEffect(() => {
    // 1. Initial burst
    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.6 },
      colors: ["#FF3D77", "#A635FF", "#3B82F6", "#FFFFFF", "#FFD700"],
    });

    // 2. Delayed left side burst
    const timer1 = setTimeout(() => {
      confetti({
        particleCount: 80,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.8 },
        colors: ["#FF3D77", "#A635FF", "#3B82F6"],
      });
    }, 400);

    // 3. Delayed right side burst
    const timer2 = setTimeout(() => {
      confetti({
        particleCount: 80,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.8 },
        colors: ["#FF3D77", "#A635FF", "#3B82F6"],
      });
    }, 700);

    // 4. Subtle center shower
    const timer3 = setTimeout(() => {
      confetti({
        particleCount: 50,
        spread: 100,
        origin: { y: 0.5 },
        colors: ["#FFD700", "#FFFFFF"],
      });
    }, 1200);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  // Extract age for the details table
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

  const formattedDate = data.tanggalLahir
    ? data.tanggalLahir.split("-").reverse().join("/")
    : "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xl animate-fade-in overflow-y-auto">
      {/* Neon Glow spots in background */}
      <div className="absolute top-1/4 left-1/4 w-[200px] sm:w-[350px] h-[200px] sm:h-[350px] bg-white/10 rounded-full blur-[100px] -z-10 animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-[200px] sm:w-[350px] h-[200px] sm:h-[350px] bg-white/15 rounded-full blur-[100px] -z-10 animate-bounce" style={{ animationDuration: "12s" }} />

      <div className="relative w-full max-w-2xl rounded-[40px] border border-white/30 bg-white/15 backdrop-blur-2xl p-6 sm:p-8 text-white shadow-[0_32px_64px_rgba(0,0,0,0.3)] my-8 max-h-[90vh] overflow-y-auto custom-scrollbar flex flex-col items-center">
        
        {/* Animated Check Success Circle */}
        <div className="p-1 rounded-full bg-white shadow-lg mb-6 animate-bounce">
          <div className="w-16 h-16 rounded-full bg-[#A635FF] flex items-center justify-center border border-white/20">
            <Check className="w-8 h-8 text-white" />
          </div>
        </div>

        <span className="text-white font-mono text-center text-xs font-black tracking-widest uppercase mb-1">
          SUBMISSION SUCCESSFUL // GEN-Z DATABASE
        </span>
        <h2 className="text-3xl sm:text-4xl font-black text-center tracking-tight text-white">
          Gokil! Profil Kamu Terdaftar
        </h2>
        <p className="text-white/80 text-center text-sm mt-2 max-w-md font-medium">
          Selamat @{data.namaPanggilan.toLowerCase()}! Data kamu bersemayam dengan aman di server kami. Check out kartu akses-mu di bawah:
        </p>

        {/* Dynamic Card Display */}
        <div className="w-full max-w-md mt-6 p-1 rounded-3xl bg-white/20 border border-white/30 shadow-xl overflow-hidden">
          <div className="w-full relative rounded-3xl overflow-hidden p-6 bg-white/10 backdrop-blur-lg flex flex-col justify-between aspect-[1.586/1] sm:aspect-auto min-h-[220px]">
            {/* Hologram details */}
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[9px] font-mono tracking-widest text-white/80 uppercase font-black">
                  MEMBER CARD // CONNECT PASS
                </span>
                <h4 className="text-base font-extrabold text-white mt-0.5">
                  GenZ Network Indonesia
                </h4>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-white/20 border border-white/30 text-[10px] text-white font-mono">
                ● ACTIVE
              </div>
            </div>

            {/* User Main Row */}
            <div className="flex gap-4 items-center my-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border border-white/30 bg-gradient-to-br from-[#FF3D77] via-[#A635FF] to-[#3B82F6] shrink-0 shadow-lg p-[1.5px]">
                <div className="w-full h-full rounded-xl overflow-hidden relative">
                  {data.foto ? (
                    <img src={data.foto} alt="Target Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-white/20 font-bold text-lg text-white font-mono">
                      {data.namaPanggilan.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-1 min-w-0 text-left">
                <h3 className="text-xl sm:text-2xl font-black text-white truncate block">
                  @{data.namaPanggilan.toLowerCase()}
                </h3>
                <span className="text-xs text-white/85 block truncate font-medium">
                  {data.namaLengkap}
                </span>
              </div>
            </div>

            {/* Bottom details */}
            <div className="border-t border-white/20 pt-3 mt-1 flex justify-between text-[11px] text-white/80 font-mono">
              <div>
                <span className="block text-[9px] text-white/60 font-medium">LOKASI & TTL</span>
                <span className="text-white font-bold">
                  {data.tempatLahir}, {formattedDate} (RT {data.rt})
                </span>
              </div>
              <div className="text-right">
                <span className="block text-[9px] text-white/60 font-medium">STATUS</span>
                <span className="text-white font-bold uppercase font-mono">
                  GOKIL LEVEL 100
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Table of full summary information */}
        <div className="w-full max-w-md mt-6 bg-[#A635FF]/10 border border-white/20 rounded-2xl p-4 sm:p-5 flex flex-col gap-3 text-left">
          <h4 className="text-xs font-bold tracking-widest text-white uppercase flex items-center gap-1.5 border-b border-white/10 pb-2">
            <Award className="w-4 h-4 text-white" /> Detil Berkas Registrasi
          </h4>

          <div className="grid grid-cols-3 text-xs sm:text-sm py-1 border-b border-white/5">
            <span className="text-white/60 font-semibold col-span-1">Nama Lengkap</span>
            <span className="text-white font-semibold col-span-2 text-right sm:text-left">{data.namaLengkap}</span>
          </div>

          <div className="grid grid-cols-3 text-xs sm:text-sm py-1 border-b border-white/5">
            <span className="text-white/60 font-semibold col-span-1">Username/Panggilan</span>
            <span className="text-white font-semibold col-span-2 text-right sm:text-left text-white">@{data.namaPanggilan.toLowerCase()}</span>
          </div>

          <div className="grid grid-cols-3 text-xs sm:text-sm py-1 border-b border-white/5">
            <span className="text-white/60 font-semibold col-span-1">Tempat Lahir</span>
            <span className="text-white/95 col-span-2 text-right sm:text-left">{data.tempatLahir}</span>
          </div>

          <div className="grid grid-cols-3 text-xs sm:text-sm py-1 border-b border-white/5">
            <span className="text-white/60 font-semibold col-span-1">Tanggal Lahir</span>
            <span className="text-white col-span-2 text-right sm:text-left font-mono">{formattedDate} ({getAge(data.tanggalLahir)})</span>
          </div>

          <div className="grid grid-cols-3 text-xs sm:text-sm py-1 border-b border-white/5">
            <span className="text-white/60 font-semibold col-span-1">Alamat Domisili</span>
            <span className="text-white/95 col-span-2 text-right sm:text-left truncate" title={data.alamat}>{data.alamat}</span>
          </div>

          <div className="grid grid-cols-3 text-xs sm:text-sm py-1">
            <span className="text-white/60 font-semibold col-span-1">Rukun Tetangga (RT)</span>
            <span className="text-white font-mono col-span-2 text-right sm:text-left font-bold">{data.rt}</span>
          </div>
        </div>

        {/* Command Buttons */}
        <div className="w-full max-w-md grid grid-cols-1 sm:grid-cols-2 gap-3 mt-8">
          <button
            id="download-ticket-btn"
            onClick={() => {
              // Create virtual credential download to trigger an actual download file to confirm real action
              const fileContent = JSON.stringify(data, null, 2);
              const blob = new Blob([fileContent], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `GenZ-Ticket-${data.namaPanggilan}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 py-3.5 px-5 font-semibold text-sm transition-all duration-300 active:scale-[0.98] cursor-pointer shadow-lg"
          >
            <Download className="w-4 h-4 text-white" />
            <span>Download Data Kartu</span>
          </button>

          <button
            id="reset-form-btn"
            onClick={onClose}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-white text-[#A635FF] font-black py-3.5 px-5 shadow-[0_10px_30px_rgba(255,255,255,0.3)] hover:scale-[1.02] active:scale-[0.98] hover:shadow-[0_15px_40px_rgba(255,255,255,0.4)] transition-all duration-300 text-sm cursor-pointer"
          >
            <RefreshCw className="w-4 h-4 text-[#A635FF] animate-spin" style={{ animationDuration: "3s" }} />
            <span>Daftar User Baru</span>
          </button>
        </div>

      </div>
    </div>
  );
};
