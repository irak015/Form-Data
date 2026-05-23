import React, { useState } from "react";
import {
  Sparkles,
  User,
  MapPin,
  Calendar,
  Hash,
  Send,
  Trash2,
  Share2,
  Smile,
  Instagram,
  Zap,
} from "lucide-react";
import { FormData } from "./types";
import { GlassInput } from "./components/GlassInput";
import { DragDropUpload } from "./components/DragDropUpload";
import { InteractiveCard } from "./components/InteractiveCard";
import { SuccessModal } from "./components/SuccessModal";
import { MemberRoster } from "./components/MemberRoster";

export default function App() {
  const [formData, setFormData] = useState<FormData>({
    namaLengkap: "",
    namaPanggilan: "",
    tempatLahir: "",
    tanggalLahir: "",
    alamat: "",
    rt: "",
    foto: null,
    fotoName: null,
    fotoSize: null,
  });

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showSuccess, setShowSuccess] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [refreshRoster, setRefreshRoster] = useState<number>(0);

  // Real-time character warnings & input validations
  const handleInputChange = (
    field: keyof FormData,
    value: string
  ) => {
    // Basic auto-formatting or constraints
    if (field === "rt") {
      // RT only allows numbers up to 3 digits
      const numericVal = value.replace(/[^0-9]/g, "").slice(0, 3);
      setFormData((prev) => ({ ...prev, [field]: numericVal }));
      if (errors.rt) {
        setErrors((prev) => {
          const updated = { ...prev };
          delete updated.rt;
          return updated;
        });
      }
      return;
    }

    if (field === "namaPanggilan") {
      // Nickname must not contain spaces or funky characters for a nice handle tag
      const alphaNumericNoSpace = value.replace(/[^a-zA-Z0-9]/g, "").slice(0, 15);
      setFormData((prev) => ({ ...prev, [field]: alphaNumericNoSpace }));
      if (errors.namaPanggilan) {
        setErrors((prev) => {
          const updated = { ...prev };
          delete updated.namaPanggilan;
          return updated;
        });
      }
      return;
    }

    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clean up error if values are supplied
    if (errors[field]) {
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };

  const validateForm = (): boolean => {
    const tempErrors: Record<string, string> = {};

    if (!formData.namaLengkap.trim()) {
      tempErrors.namaLengkap = "Nama lengkap wajib diisi ya, Sob!";
    }
    if (!formData.namaPanggilan.trim()) {
      tempErrors.namaPanggilan = "Nama panggilan wajib diisi!";
    }
    if (!formData.tempatLahir.trim()) {
      tempErrors.tempatLahir = "Tempat lahir gak boleh kosong.";
    }
    if (!formData.tanggalLahir) {
      tempErrors.tanggalLahir = "Tanggal lahir kudu ditentukan.";
    }
    if (!formData.alamat.trim()) {
      tempErrors.alamat = "Alamat rumah belum kamu tentukan.";
    }
    if (!formData.rt) {
      tempErrors.rt = "Format RT bener-bener wajib (hanya angka).";
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      // Highlight the first element or slide window
      const firstErrorKey = Object.keys(errors)[0] || "drag-drop-zone";
      const el = document.getElementById(firstErrorKey);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    // High quality loading micro-animation
    setIsSubmitting(true);
    
    // Save to local storage cache to display instantly on active roster list
    const existing = localStorage.getItem("irak_local_submissions");
    let submissions: FormData[] = [];
    if (existing) {
      try {
        submissions = JSON.parse(existing);
      } catch (e) {
        submissions = [];
      }
    }
    
    // Add new submission
    submissions.unshift(formData);
    
    // Deduplicate
    const uniqueSubmissions = submissions.filter((val, index, self) =>
      self.findIndex(t => t.namaPanggilan.toLowerCase() === val.namaPanggilan.toLowerCase()) === index
    );
    localStorage.setItem("irak_local_submissions", JSON.stringify(uniqueSubmissions));

    // Optional Cloud Writeback integration if URL is configured
    const appsScriptUrl = localStorage.getItem("irak_apps_script_url");
    if (appsScriptUrl && appsScriptUrl.trim()) {
      try {
        // Format tanggalLahir to DD/MM/YYYY and RT as plain text with single quote prefix
        const formattedTanggalLahir = formData.tanggalLahir
          ? formData.tanggalLahir.split("-").reverse().join("/")
          : "";
        const formattedRt = formData.rt ? `'${formData.rt}` : "";

        const payload = {
          ...formData,
          tanggalLahir: formattedTanggalLahir,
          rt: formattedRt,
        };

        await fetch(appsScriptUrl.trim(), {
          method: "POST",
          mode: "no-cors", // Required to skip browser preflight blocks for Apps Script redirects
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
      } catch (err) {
        console.error("Cloud Web App writeback error:", err);
      }
    }

    // Add a tiny buffer for a seamless, satisfying transition
    await new Promise((resolve) => setTimeout(resolve, 800));

    setIsSubmitting(false);
    setRefreshRoster((prev) => prev + 1); // trigger live list refresh
    setShowSuccess(true);
  };

  const handleResetForm = () => {
    setFormData({
      namaLengkap: "",
      namaPanggilan: "",
      tempatLahir: "",
      tanggalLahir: "",
      alamat: "",
      rt: "",
      foto: null,
      fotoName: null,
      fotoSize: null,
    });
    setErrors({});
    setShowSuccess(false);
  };

  return (
    <div className="min-h-screen w-full relative overflow-x-hidden bg-gradient-to-br from-[#FF3D77] via-[#A635FF] to-[#3B82F6] font-sans flex flex-col items-center">
      
      {/* Decorative Blur Orbs for background depth */}
      <div className="absolute top-0 left-[-10%] w-[450px] h-[450px] bg-white/10 rounded-full blur-[120px] -z-10 pointer-events-none" />
      <div className="absolute top-[40%] right-[-5%] w-[400px] h-[400px] bg-white/10 rounded-full blur-[100px] -z-10 pointer-events-none animate-pulse" style={{ animationDuration: "8s" }} />

      {/* Grid Pattern BG */}
      <div className="absolute inset-0 opacity-[0.05] bg-[linear-gradient(rgba(255,255,255,0.1)_1.5px,transparent_1.5px),linear-gradient(90deg,rgba(255,255,255,0.1)_1.5px,transparent_1.5px)] bg-[size:32px_32px] -z-10 pointer-events-none" />

      {/* Main Container */}
      <div id="main-frame" className="w-full max-w-6xl px-3 py-6 sm:px-6 sm:py-16 md:py-20 flex flex-col items-center grow z-10">
        
        {/* Header Block with high visual hierarchy */}
        <div className="text-center flex flex-col items-center mb-8 sm:mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 backdrop-blur-md text-white text-xs font-bold tracking-wider uppercase mb-4 animate-bounce">
            <Zap className="w-3.5 h-3.5 text-yellow-300 fill-yellow-300" />
            <span>EKSIS</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-tight px-2 max-w-3xl">
            IRAK 015
          </h1>
          
          <p className="text-white/95 text-base sm:text-lg md:text-xl mt-4 max-w-2xl font-semibold tracking-wide uppercase">
            Ikatan Remaja Aktif RW. 015<br />
            <span className="text-white/85 text-xs sm:text-sm font-normal tracking-widest block mt-1 uppercase font-mono">
              Pesona Gading Cibitung
            </span>
          </p>
        </div>

        {/* Dynamic Split Layout: Form & Preview Card (Order-optimized for mobile first) */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Column A: Left side dynamic Glassmorphism Input Form (ordered 2nd on mobile, 1st on desktop) */}
          <div className="order-2 lg:order-1 lg:col-span-7 w-full bg-white/15 backdrop-blur-2xl border border-white/30 rounded-[32px] sm:rounded-[40px] p-5 sm:p-10 flex flex-col gap-6 shadow-[0_32px_64px_rgba(0,0,0,0.3)] min-w-0">
            <div className="flex justify-between items-center border-b border-white/20 pb-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                  <Smile className="w-6 h-6 text-white" /> Formulir Identitas
                </h2>
                <p className="text-xs text-white/80 mt-1 font-medium">
                  Harap isi data yang valid ya, Sob! Kolom tanda (*) itu wajib diisi.
                </p>
              </div>
            </div>

            <form onSubmit={handleFormSubmit} className="flex flex-col gap-5">
              
              {/* Row: Nama Lengkap */}
              <div id="namaLengkap">
                <GlassInput
                  id="nama-lengkap"
                  label="Nama Lengkap"
                  icon={User}
                  placeholder="Contoh: Ryan Pratama Putra"
                  value={formData.namaLengkap}
                  onChange={(e) => handleInputChange("namaLengkap", e.target.value)}
                  required
                />
                {errors.namaLengkap && (
                  <p className="text-xs text-rose-400 font-semibold mt-1.5 pl-1 italic">
                    {errors.namaLengkap}
                  </p>
                )}
              </div>

              {/* Row: Nama Panggilan */}
              <div id="namaPanggilan">
                <GlassInput
                  id="nama-panggilan"
                  label="Nama Panggilan / Alias"
                  icon={Smile}
                  placeholder="Contoh: ryanp"
                  value={formData.namaPanggilan}
                  onChange={(e) => handleInputChange("namaPanggilan", e.target.value)}
                  maxLength={15}
                  required
                  hint="Hanya berupa huruf & angka tanpa spasi. Akan digunakan sebagai handle-mu!"
                />
                {errors.namaPanggilan && (
                  <p className="text-xs text-rose-400 font-semibold mt-1.5 pl-1 italic">
                    {errors.namaPanggilan}
                  </p>
                )}
              </div>

              {/* Double Column: Tempat Lahir & Tanggal Lahir */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div id="tempatLahir">
                  <GlassInput
                    id="tempat-lahir"
                    label="Tempat Lahir"
                    icon={MapPin}
                    placeholder="Contoh: Jakarta"
                    value={formData.tempatLahir}
                    onChange={(e) => handleInputChange("tempatLahir", e.target.value)}
                    required
                  />
                  {errors.tempatLahir && (
                    <p className="text-xs text-rose-400 font-semibold mt-1.5 pl-1 italic">
                      {errors.tempatLahir}
                    </p>
                  )}
                </div>

                <div id="tanggalLahir">
                  <GlassInput
                    id="tanggal-lahir"
                    label="Tanggal Lahir"
                    icon={Calendar}
                    type="date"
                    value={formData.tanggalLahir}
                    onChange={(e) => handleInputChange("tanggalLahir", e.target.value)}
                    required
                  />
                  {errors.tanggalLahir && (
                    <p className="text-xs text-rose-400 font-semibold mt-1.5 pl-1 italic">
                      {errors.tanggalLahir}
                    </p>
                  )}
                </div>
              </div>

              {/* Row: Alamat Domisili */}
              <div id="alamat">
                <GlassInput
                  id="alamat-tinggal"
                  label="Alamat Tempat Tinggal"
                  icon={MapPin}
                  isTextArea
                  placeholder="Contoh: I.7/10"
                  value={formData.alamat}
                  onChange={(e) => handleInputChange("alamat", e.target.value)}
                  required
                />
                {errors.alamat && (
                  <p className="text-xs text-rose-400 font-semibold mt-1.5 pl-1 italic">
                    {errors.alamat}
                  </p>
                )}
              </div>

              {/* Row: RT */}
              <div id="rt">
                <GlassInput
                  id="rt-nomor"
                  label="Rukun Tetangga (RT)"
                  icon={Hash}
                  placeholder="Contoh: 005"
                  value={formData.rt}
                  onChange={(e) => handleInputChange("rt", e.target.value)}
                  required
                  hint="Hanya angka integer max 3 digit (contoh: 004, 12, dll)"
                />
                {errors.rt && (
                  <p className="text-xs text-rose-400 font-semibold mt-1.5 pl-1 italic">
                    {errors.rt}
                  </p>
                )}
              </div>

              {/* Row: Drag and Drop Upload */}
              <DragDropUpload
                foto={formData.foto}
                fotoName={formData.fotoName}
                fotoSize={formData.fotoSize}
                onChange={(result) => {
                  setFormData((prev) => ({
                    ...prev,
                    foto: result.foto,
                    fotoName: result.name,
                    fotoSize: result.size,
                  }));
                }}
              />

              {/* Clear Table and Submit Buttons with gorgeous youth styling effects */}
              <div className="flex gap-4 mt-6">
                
                {/* Submit button with hover transitions */}
                <button
                  id="submit-register-btn"
                  type="submit"
                  disabled={isSubmitting}
                  className="grow bg-white text-[#A635FF] font-black text-lg py-4.5 px-6 rounded-2xl shadow-[0_10px_30px_rgba(255,255,255,0.3)] hover:scale-[1.02] active:scale-[0.98] hover:shadow-[0_15px_40px_rgba(255,255,255,0.4)] transition-all duration-300 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 rounded-full border-2 border-[#A635FF] border-t-transparent animate-spin" />
                  ) : (
                    <Send className="w-5 h-5 text-[#A635FF]" />
                  )}
                  <span className="tracking-wider uppercase">
                    {isSubmitting ? "Sedang Mengirim..." : "KIRIM SEKARANG 🚀"}
                  </span>
                </button>

                {/* Reset button to wipe clean */}
                <button
                  id="clear-form-btn"
                  type="button"
                  onClick={handleResetForm}
                  className="rounded-2xl px-5 py-4 bg-white/10 hover:bg-red-500/20 border border-white/20 hover:border-red-500/40 text-white hover:text-red-300 transition-all duration-300 cursor-pointer"
                  title="Wipe Clean Form"
                >
                  <Trash2 className="w-5 h-5 shrink-0" />
                </button>
              </div>

            </form>
          </div>

          {/* Column B: Right side virtual active hologram ticket preview (ordered 1st on mobile, 2nd on desktop) */}
          <div className="order-1 lg:order-2 lg:col-span-5 w-full flex flex-col gap-6 lg:sticky lg:top-8">
            <div className="flex flex-col gap-1 text-left sm:text-center lg:text-left px-2">
              <span className="text-[10px] font-mono tracking-widest text-white/80 font-black uppercase">
                AUTOMATIC SYNCHRONIZATION
              </span>
              <h3 className="text-xl font-bold tracking-tight text-white flex items-center justify-start sm:justify-center lg:justify-start gap-1.5 mt-0.5">
                <Zap className="w-5 h-5 text-white" /> Live Virtual Preview
              </h3>
              <p className="text-xs text-white/80">
                Kartu digitalmu tersinkronisasi langsung saat kamu mengetik data lho!
              </p>
            </div>

            <InteractiveCard data={formData} />
          </div>

        </div>

        {/* Member Directory Live Database Section */}
        <MemberRoster refreshTrigger={refreshRoster} />

      </div>

      {/* Success Modal screen on final complete */}
      {showSuccess && (
        <SuccessModal data={formData} onClose={handleResetForm} />
      )}
    </div>
  );
}
