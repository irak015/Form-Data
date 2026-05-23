import React, { useEffect, useState } from "react";
import {
  Search,
  Users,
  RefreshCw,
  MapPin,
  Calendar,
  Layers,
  Link,
  Clipboard,
  Check,
  AlertCircle,
  Hash,
  Sparkles,
  Info,
  ExternalLink,
  Trash2,
  Download
} from "lucide-react";
import { FormData } from "../types";

const GOOGLE_SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSg_03u2i0zOOsbt3s4jh8xYIzh2qLjNhCAIIOOcN-EqLRMznK8CSINqLsCOGkUcrVCkLjDeFiy9eXZ/pub?gid=0&single=true&output=csv";

interface MemberRosterProps {
  refreshTrigger: number;
}

interface RosterMember extends FormData {
  isLocal?: boolean;
}

export const MemberRoster: React.FC<MemberRosterProps> = ({ refreshTrigger }) => {
  const [members, setMembers] = useState<RosterMember[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState<string>("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [showClearAllConfirm, setShowClearAllConfirm] = useState<boolean>(false);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  
  // Custom Web App URL configuration stored in localStorage
  const [appsScriptUrl, setAppsScriptUrl] = useState<string>(() => {
    const saved = localStorage.getItem("irak_apps_script_url");
    const latestDefaultUrl = "https://script.google.com/macros/s/AKfycbyDhLnQUC3EAm8Oo__ROoVwgsUsV2E4naf1CBsxR0KceHjHMfOb1EkdJ-yePAh9-2zEOQ/exec";
    
    // If there is no saved URL, or if the saved URL matches any old outdated default setups:
    const isOutdatedDefault = !saved || 
      saved === "https://script.google.com/macros/s/AKfycbyjK-EHa-6q7nUfx6sOr-W7rkBd_gcnXaB8yypdP8WUKgs8XlyC6n6_CrSalfyHcaM7Fw/exec" ||
      saved === "https://script.google.com/macros/s/AKfycbweKOTtIcaeqmmVxmOy0SR1PK7HF9vASf7njmvVx3N3qWhmPxVqMkCN8FyVh6L88ExNcA/exec" ||
      saved === "https://script.google.com/macros/s/AKfycbyErWH2UKs1IJYtdyQgk7UodVpNA3JoTrTg_rbVzgOUGwFZtXHWozY7m8dntb64iSw1Kw/exec" ||
      saved === "https://script.google.com/macros/s/AKfycbyP7oUEESkqVEKTD1l1S4oaQFeLBzyTiZVdvDBT-RKXuYSIjpFGGtV_jP24etr8LHJfrA/exec" ||
      saved === "https://script.google.com/macros/s/AKfycbxLP2XVK5fsoFFHPt5Au_5t0WErTn4pNpVP67lL-R-1T-32GNQ0KhOw7n-cHjefBVVcMw/exec" ||
      saved === "https://script.google.com/macros/s/AKfycbzyAup_g8n_u-NIyVWbO06NX2KZGAioxmuMjmtpIRHO5nicBSIndCJ8xXktsOisTuwHbg/exec";
      
    if (!isOutdatedDefault && saved) {
      return saved;
    }
    localStorage.setItem("irak_apps_script_url", latestDefaultUrl);
    return latestDefaultUrl;
  });
  const [showScriptSetup, setShowScriptSetup] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const saveAppsScriptUrl = (url: string) => {
    setAppsScriptUrl(url);
    localStorage.setItem("irak_apps_script_url", url);
  };

  // Load and Parse Google Sheet CSV + Merge with Local Submissions
  const loadRoster = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch live published CSV data
      const response = await fetch(GOOGLE_SHEET_CSV_URL + `&_t=${Date.now()}`); // bypass browser cache
      if (!response.ok) {
        throw new Error("Gagal mengambil data dari server Google Sheets.");
      }
      const csvText = await response.text();
      
      // 2. Parse CSV text correctly
      const parsedRows = parseCSV(csvText);
      const fetchedMembers: RosterMember[] = [];

      // Check header row: NAMA LENGKAP,NAMA PANGGILAN,TEMPAT LAHIR,TANGGAL LAHIR,ALAMAT,RT,LAMPIRAN FOTO
      if (parsedRows.length > 1) {
        for (let i = 1; i < parsedRows.length; i++) {
          const row = parsedRows[i];
          if (row.length >= 6) {
            fetchedMembers.push({
              namaLengkap: row[0] || "",
              namaPanggilan: row[1] || "",
              tempatLahir: row[2] || "",
              tanggalLahir: row[3] || "",
              alamat: row[4] || "",
              rt: row[5] || "",
              foto: row[6] || null,
              fotoName: row[6] ? "Profil URL" : null,
              fotoSize: null
            });
          }
        }
      }

      // 3. Load locally stored active subscriptions to merge
      const storedSubmissionsString = localStorage.getItem("irak_local_submissions");
      let localMembers: RosterMember[] = [];
      if (storedSubmissionsString) {
        try {
          const parsed = JSON.parse(storedSubmissionsString);
          if (Array.isArray(parsed)) {
            localMembers = parsed.map((m: any) => ({ ...m, isLocal: true }));
          }
        } catch (e) {
          console.error("Gagal mem-parsing submisi lokal", e);
        }
      }

      // Deduplicate locally submitted profiles based on username/namaPanggilan to avoid duplicates
      const merged = [...localMembers];
      fetchedMembers.forEach((sheetMember) => {
        const alreadyExists = merged.some(
          (m) => m.namaPanggilan.toLowerCase() === sheetMember.namaPanggilan.toLowerCase()
        );
        if (!alreadyExists) {
          merged.push(sheetMember);
        }
      });

      setMembers(merged);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Koneksi terganggu. Gagal sinkronisasi data.");
      
      // Fallback to local persistence if offline
      const stored = localStorage.getItem("irak_local_submissions");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setMembers(parsed.map((m: any) => ({ ...m, isLocal: true })));
          }
        } catch (e) {
          console.error("Gagal mem-parsing submisi lokal", e);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfirm = (namaPanggilan: string) => {
    const stored = localStorage.getItem("irak_local_submissions");
    if (stored) {
      try {
        const localList: FormData[] = JSON.parse(stored);
        const filtered = localList.filter(
          (m) => m.namaPanggilan.toLowerCase() !== namaPanggilan.toLowerCase()
        );
        localStorage.setItem("irak_local_submissions", JSON.stringify(filtered));
        setDeleteConfirm(null);
        loadRoster();
      } catch (e) {
        console.error("Error deleting local member:", e);
      }
    }
  };

  const handleClearAllLocal = () => {
    localStorage.removeItem("irak_local_submissions");
    setShowClearAllConfirm(false);
    loadRoster();
  };

  useEffect(() => {
    loadRoster();
  }, [refreshTrigger]);

  // Safe CSV string parsing helper
  const parseCSV = (text: string): string[][] => {
    const lines: string[][] = [];
    let row: string[] = [];
    let inQuotes = false;
    let currentVal = "";
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];
      
      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          currentVal += '"';
          i++; // skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        row.push(currentVal.trim());
        currentVal = "";
      } else if ((char === "\r" || char === "\n") && !inQuotes) {
        if (char === "\r" && nextChar === "\n") {
          i++;
        }
        row.push(currentVal.trim());
        if (row.length > 0 && row.some(cell => cell !== "")) {
          lines.push(row);
        }
        row = [];
        currentVal = "";
      } else {
        currentVal += char;
      }
    }
    if (currentVal || row.length > 0) {
      row.push(currentVal.trim());
      if (row.some(cell => cell !== "")) {
        lines.push(row);
      }
    }
    return lines;
  };

  // Simple Search Filter
  const filteredMembers = members.filter((m) => {
    const query = search.toLowerCase();
    return (
      m.namaLengkap.toLowerCase().includes(query) ||
      m.namaPanggilan.toLowerCase().includes(query) ||
      m.tempatLahir.toLowerCase().includes(query) ||
      m.alamat.toLowerCase().includes(query) ||
      m.rt.includes(query)
    );
  });

  const getAgeString = (dob: string): string => {
    if (!dob) return "";
    let birthDate: Date;
    
    if (dob.includes("/")) {
      const parts = dob.split("/");
      if (parts.length === 3) {
        // parts[0] = DD, parts[1] = MM, parts[2] = YYYY
        birthDate = new Date(`${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`);
      } else {
        birthDate = new Date(dob);
      }
    } else {
      birthDate = new Date(dob);
    }
    
    if (isNaN(birthDate.getTime())) return "";
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age >= 0 ? `${age} th` : "";
  };

  const copyAppsScriptCode = () => {
    const code = `/**
 * Google Apps Script - Integrasi Tulis Form IRAK 015 & Google Drive
 * 
 * Skenario Penggunaan:
 * Rekam otomatis data pendaftaran live ke Google Sheets dan simpan file foto ke Google Drive
 * agar langsung bisa dilihat dan tampil (formula =IMAGE) di Google Sheets Anda.
 */
function doPost(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getActiveSheet();
  
  try {
    var data = JSON.parse(e.postData.contents);
    
    // Validasi data minimal
    if (!data.namaLengkap || !data.namaPanggilan) {
      return ContentService.createTextOutput(JSON.stringify({ 
        "status": "error", 
        "message": "Data namaLengkap atau namaPanggilan kosong" 
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    var fotoCellVal = "";
    
    // Upload foto ke Google Drive & simpan sebagai formula visual =IMAGE("url")
    if (data.foto && data.foto.indexOf("base64,") !== -1) {
      try {
        var base64Parts = data.foto.split("base64,");
        var header = base64Parts[0];
        var base64Data = base64Parts[1];
        
        var contentType = header.substring(header.indexOf(":") + 1, header.indexOf(";"));
        var ext = "png";
        if (contentType.indexOf("jpeg") !== -1 || contentType.indexOf("jpg") !== -1) ext = "jpg";
        else if (contentType.indexOf("gif") !== -1) ext = "gif";
        else if (contentType.indexOf("webp") !== -1) ext = "webp";
        
        var filename = "foto_" + data.namaPanggilan.toLowerCase() + "_" + new Date().getTime() + "." + ext;
        var decoded = Utilities.base64Decode(base64Data);
        var blob = Utilities.newBlob(decoded, contentType, filename);
        
        // Simpan ke Google Drive folder ID: 1yjex00ENe639kozcNO9_NnxWuMaN2SN5
        var folder = DriveApp.getFolderById("1yjex00ENe639kozcNO9_NnxWuMaN2SN5");
        
        var file = folder.createFile(blob);
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        
        var fileId = file.getId();
        var imageUrl = "https://docs.google.com/uc?export=view&id=" + fileId;
        fotoCellVal = '=IMAGE("' + imageUrl + '")';
      } catch (uploadError) {
        fotoCellVal = "Gagal upload: " + uploadError.toString();
      }
    } else if (data.foto) {
      fotoCellVal = '=IMAGE("' + data.foto + '")';
    }
    
    var rtString = data.rt ? data.rt.toString() : "";
    if (rtString && !rtString.startsWith("'")) {
      rtString = "'" + rtString;
    }

    var tanggalLahirVal = data.tanggalLahir ? data.tanggalLahir.toString() : "";
    if (tanggalLahirVal && tanggalLahirVal.indexOf("-") !== -1) {
      var dateParts = tanggalLahirVal.split("-");
      if (dateParts.length === 3) {
        tanggalLahirVal = dateParts[2] + "/" + dateParts[1] + "/" + dateParts[0];
      }
    }

    sheet.appendRow([
      data.namaLengkap,
      data.namaPanggilan,
      data.tempatLahir,
      tanggalLahirVal,
      data.alamat,
      rtString,
      fotoCellVal
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({ 
      "status": "success",
      "message": "Data berhasil dicatat dengan foto terintegrasi!" 
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ 
      "status": "error", 
      "message": error.toString() 
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * PENTING: JALANKAN FUNGSI INI SEKALI di editor Apps Script Anda!
 * Ini diperlukan untuk memicu popup otorisasi Google Drive agar script
 * Anda diizinkan membaca/menulis folder foto spreadsheet.
 */
function testAuthorize() {
  var folder = DriveApp.getFolderById("1yjex00ENe639kozcNO9_NnxWuMaN2SN5");
  Logger.log("Selamat! Otorisasi Google Drive Anda Sukses Disetujui!");
}
`;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadAppsScriptFile = () => {
    const code = `/**
 * Google Apps Script - Integrasi Tulis Form IRAK 015 & Google Drive
 * 
 * Panduan Pemasangan:
 * 1. Buka spreadsheet target Anda di Google Sheets.
 * 2. Klik menu 'Extensions' -> 'Apps Script'.
 * 3. Hapus semua kode bawaan, lalu tempel kode di bawah ini.
 * 4. Klik ikon Save (simpan).
 * 5. Pilih 'testAuthorize' pada menu tarikan fungsi, lalu klik 'Run' atau 'Jalankan'.
 * 6. Selesaikan dialog Authorization Required yang muncul (klik Izinkan / Allow).
 * 7. Klik 'Deploy' -> 'New Deployment'.
 * 8. Pilih tipe 'Web App'.
 * 9. Pada bagian 'Execute as', pilih 'Me'.
 * 10. Pada bagian 'Who has access', pilih 'Anyone'.
 * 11. Klik 'Deploy' dan salin URL Web App yang dihasilkan ke aplikasi Anda.
 */

function doPost(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getActiveSheet();
  
  try {
    var data = JSON.parse(e.postData.contents);
    
    if (!data.namaLengkap || !data.namaPanggilan) {
      return ContentService.createTextOutput(JSON.stringify({ 
        "status": "error", 
        "message": "Data namaLengkap atau namaPanggilan kosong" 
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    var fotoCellVal = "";
    
    if (data.foto && data.foto.indexOf("base64,") !== -1) {
      try {
        var base64Parts = data.foto.split("base64,");
        var header = base64Parts[0];
        var base64Data = base64Parts[1];
        
        var contentType = header.substring(header.indexOf(":") + 1, header.indexOf(";"));
        var ext = "png";
        if (contentType.indexOf("jpeg") !== -1 || contentType.indexOf("jpg") !== -1) ext = "jpg";
        else if (contentType.indexOf("gif") !== -1) ext = "gif";
        else if (contentType.indexOf("webp") !== -1) ext = "webp";
        
        var filename = "foto_" + data.namaPanggilan.toLowerCase() + "_" + new Date().getTime() + "." + ext;
        var decoded = Utilities.base64Decode(base64Data);
        var blob = Utilities.newBlob(decoded, contentType, filename);
        
        // Simpan ke Google Drive folder ID: 1yjex00ENe639kozcNO9_NnxWuMaN2SN5
        var folder = DriveApp.getFolderById("1yjex00ENe639kozcNO9_NnxWuMaN2SN5");
        
        var file = folder.createFile(blob);
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        
        var fileId = file.getId();
        var imageUrl = "https://docs.google.com/uc?export=view&id=" + fileId;
        fotoCellVal = '=IMAGE("' + imageUrl + '")';
      } catch (uploadError) {
        fotoCellVal = "Gagal upload: " + uploadError.toString();
      }
    } else if (data.foto) {
      fotoCellVal = '=IMAGE("' + data.foto + '")';
    }
    
    var rtString = data.rt ? data.rt.toString() : "";
    if (rtString && !rtString.startsWith("'")) {
      rtString = "'" + rtString;
    }

    var tanggalLahirVal = data.tanggalLahir ? data.tanggalLahir.toString() : "";
    if (tanggalLahirVal && tanggalLahirVal.indexOf("-") !== -1) {
      var dateParts = tanggalLahirVal.split("-");
      if (dateParts.length === 3) {
        tanggalLahirVal = dateParts[2] + "/" + dateParts[1] + "/" + dateParts[0];
      }
    }
    
    sheet.appendRow([
      data.namaLengkap,
      data.namaPanggilan,
      data.tempatLahir,
      tanggalLahirVal,
      data.alamat,
      rtString,
      fotoCellVal
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({ 
      "status": "success",
      "message": "Data berhasil dicatat ke spreadsheet!" 
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ 
      "status": "error", 
      "message": error.toString() 
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function testAuthorize() {
  var folder = DriveApp.getFolderById("1yjex00ENe639kozcNO9_NnxWuMaN2SN5");
  Logger.log("Otorisasi Google Drive Berhasil disetujui!");
}
`;
    const blob = new Blob([code], { type: "text/javascript" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "irak_google_apps_script_with_photos.js";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadCard = async (idx: number, namaPanggilan: string) => {
    const cardEl = document.getElementById(`roster-card-${idx}`);
    if (!cardEl) return;
    
    setDownloadingId(idx);
    try {
      const { toJpeg } = await import("html-to-image");
      
      // Small timeout to allow styling calculation
      await new Promise((r) => setTimeout(r, 120));
      
      const dataUrl = await toJpeg(cardEl, {
        quality: 0.95,
        backgroundColor: "#160a2c", // deep rich space background inside direct image file download
        style: {
          transform: "scale(1)",
          borderRadius: "24px",
        }
      });
      
      const link = document.createElement("a");
      link.download = `kartu_irak_015_${namaPanggilan.toLowerCase()}.jpg`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Gagal mengunduh kartu dari daftar roster:", error);
    } finally {
      setDownloadingId(null);
    }
  };

  // Check if we have registered local elements to display the clear option
  const hasLocalData = members.some((m) => m.isLocal);

  return (
    <div className="w-full bg-white/15 backdrop-blur-2xl border border-white/30 rounded-[32px] sm:rounded-[40px] p-5 sm:p-10 flex flex-col gap-6 shadow-[0_32px_64px_rgba(0,0,0,0.3)] mt-12 text-white">
      
      {/* Roster Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/20 pb-5">
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            <img 
              src="https://lh3.googleusercontent.com/d/1Ou1pplE9AB5yqruzqDlpRIhMzBtyKQdw" 
              alt="Logo Irak" 
              className="w-14 h-14 object-contain rounded-2xl bg-white/10 border border-white/20 p-1.5 shadow-md"
              referrerPolicy="no-referrer"
            />
            <div className="absolute -bottom-1 -right-1 bg-white/20 border border-white/30 backdrop-blur-md rounded-lg p-1">
              <Users className="w-3.5 h-3.5 text-white" />
            </div>
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black flex items-center gap-2">
              Daftar Anggota IRAK 015
            </h2>
            <p className="text-xs text-white/85 font-medium mt-0.5">
              Live database tersinkronisasi langsung dari Google Sheets
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {hasLocalData && (
            <div className="relative">
              {showClearAllConfirm ? (
                <div className="flex items-center gap-1 bg-[#120822] border border-red-500/40 rounded-xl p-1 shadow-md animate-fade-in absolute right-0 bottom-full mb-2 sm:mb-0 sm:bottom-auto sm:top-full sm:mt-2 z-35">
                  <button
                    onClick={handleClearAllLocal}
                    className="px-3 py-1.5 bg-red-600 text-white font-black text-[10px] tracking-wider uppercase rounded-lg hover:bg-red-700 transition-all cursor-pointer whitespace-nowrap"
                  >
                    Ya, Hapus!
                  </button>
                  <button
                    onClick={() => setShowClearAllConfirm(false)}
                    className="px-3 py-1.5 bg-white/10 text-white font-semibold text-[10px] tracking-wider uppercase rounded-lg hover:bg-white/20 transition-all cursor-pointer whitespace-nowrap"
                  >
                    Batal
                  </button>
                </div>
              ) : (
                <button
                  id="clear-all-local-btn"
                  onClick={() => setShowClearAllConfirm(true)}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer text-red-300"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Bersihkan Lokal</span>
                </button>
              )}
            </div>
          )}

          <button
            id="cloud-setup-toggle-btn"
            onClick={() => setShowScriptSetup(!showScriptSetup)}
            className="hidden flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
            style={{ display: 'none' }}
          >
            <Link className="w-3.5 h-3.5" />
            <span>Integrasi Foto Sheets</span>
          </button>

          <button
            id="refresh-roster-btn"
            onClick={loadRoster}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white text-[#A635FF] font-black text-xs uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Roster Search Bar */}
      <div className="relative w-full">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60">
          <Search className="w-5 h-5" />
        </span>
        <input
          id="roster-search-input"
          type="text"
          placeholder="Cari anggota remaja berdasarkan nama, panggilan, alamat..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white/10 border border-white/20 rounded-2xl pl-12 pr-5 py-4 text-white placeholder-white/40 focus:outline-none focus:bg-white/20 focus:ring-2 focus:ring-white/50 transition-all font-medium outline-none backdrop-blur-md text-sm sm:text-base"
        />
      </div>

      {/* Cloud Integration Instructions Panel */}
      {showScriptSetup && (
        <div className="bg-[#120822]/75 border border-white/20 rounded-3xl p-5 sm:p-8 flex flex-col gap-6 animate-fade-in text-left shadow-inner">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10 font-sans">
            <h3 className="text-base font-black uppercase tracking-wider flex items-center gap-2 text-pink-300">
              <Sparkles className="w-5 h-5 text-yellow-300 animate-pulse" /> Google Drive & Foto Spreadsheet Setup
            </h3>
            <span className="px-2 py-0.5 rounded bg-white/10 text-[9px] font-mono tracking-widest uppercase font-black text-white/60">
              Auto-Sync Foto v3.0
            </span>
          </div>

          <p className="text-xs text-white/80 leading-relaxed md:text-sm font-sans">
            Agar foto lampiran pendaftaran <strong>bisa langsung dilihat berupa gambar di spreadsheet Anda</strong>, Google Apps Script akan otomatis mengunggah base64 foto ke Google Drive di folder ID <strong>1yjex00ENe639kozcNO9_NnxWuMaN2SN5</strong> dan menyisipkan formula <code>=IMAGE("url_foto")</code> ke kolom lampiran. Ikuti langkah mudah berikut!
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 font-sans">
            {/* Steps block */}
            <div className="flex flex-col gap-4">
              <h4 className="text-xs font-bold uppercase tracking-widest text-[#3B82F6]">Langkah Pemasangan</h4>
              <ol className="text-xs text-white/90 space-y-3.5 leading-relaxed list-none pl-0">
                <li className="flex gap-2.5 items-start">
                  <span className="w-5 h-5 rounded-full bg-white/15 text-white font-mono font-black text-[10px] flex items-center justify-center shrink-0 border border-white/15">1</span>
                  <span>Buka Google Spreadsheet target Anda, lalu pilih menu <strong>Extensions &gt; Apps Script</strong> pada bilah atas.</span>
                </li>
                <li className="flex gap-2.5 items-start">
                  <span className="w-5 h-5 rounded-full bg-white/15 text-white font-mono font-black text-[10px] flex items-center justify-center shrink-0 border border-white/15">2</span>
                  <div className="flex flex-col gap-2 items-start w-full">
                    <span>Hapus seluruh kode standar bawaan, lalu salin script database otomatis di samping ini:</span>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={copyAppsScriptCode}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-pink-500/20 hover:bg-pink-500/30 border border-pink-500/30 text-[10px] font-black tracking-wider uppercase transition-all cursor-pointer"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Clipboard className="w-3.5 h-3.5 text-pink-300" />}
                        <span>{copied ? "Berhasil Disalin!" : "Salin Script"}</span>
                      </button>
                      <button
                        onClick={downloadAppsScriptFile}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-[10px] font-black tracking-wider uppercase transition-all cursor-pointer text-blue-300"
                        title="Unduh file .js berisi script utuh"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Unduh File Script</span>
                      </button>
                    </div>
                  </div>
                </li>
                <li className="flex gap-2.5 items-start bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-3">
                  <span className="w-5 h-5 rounded-full bg-yellow-500 text-black font-mono font-black text-[10px] flex items-center justify-center shrink-0">3</span>
                  <div className="flex flex-col gap-1">
                    <span className="text-yellow-300 font-bold uppercase tracking-wider text-[11px]">WAJIB SETUJUI IZIN DRIVE (SOLUSI ERROR)</span>
                    <p className="text-[11px] text-white/90 leading-relaxed">
                      Di bilah atas editor Apps Script, cari menu tarikan/dropdown fungsi, pilih nama fungsi <strong><code>testAuthorize</code></strong>, lalu klik tombol <strong>Run / Jalankan</strong> (sebelah kiri tombol Deploy).
                    </p>
                    <p className="text-[11px] text-white/80 leading-relaxed mt-1">
                      Sebuah jendela popup otorisasi akan muncul. Selesaikan ini dengan mengklik: <br />
                      <strong>Review Permissions / Tinjau Izin</strong> &gt; Pilih Akun Google Anda &gt; Klik tautan kecil <strong>Advanced / Lanjutan</strong> di bagian bawah &gt; Klik <strong>Go to Untitled Project / Buka (tidak aman)</strong> &gt; Terakhir klik <strong>Allow / Izinkan</strong>.
                    </p>
                  </div>
                </li>
                <li className="flex gap-2.5 items-start">
                  <span className="w-5 h-5 rounded-full bg-white/15 text-white font-mono font-black text-[10px] flex items-center justify-center shrink-0 border border-white/15">4</span>
                  <span>Setelah selesai memberikan izin, klik tombol <strong>Deploy &gt; New Deployment</strong> pada bilah kanan atas. Pilih tipe deployment sebagai <strong>Web App</strong>.</span>
                </li>
                <li className="flex gap-2.5 items-start">
                  <span className="w-5 h-5 rounded-full bg-white/15 text-white font-mono font-black text-[10px] flex items-center justify-center shrink-0 border border-white/15">5</span>
                  <span>Pastikan setelan <strong>Execute as: Me</strong> dan bagian <strong>Who has access: Anyone</strong> (Wajib, agar form diizinkan mengirim berkas), lalu klik Deploy.</span>
                </li>
                <li className="flex gap-2.5 items-start">
                  <span className="w-5 h-5 rounded-full bg-white/15 text-white font-mono font-black text-[10px] flex items-center justify-center shrink-0 border border-white/15">6</span>
                  <span>Salin tautan <strong>Web App URL</strong> yang diberikan oleh Google, lalu masukkan URL tersebut pada input di bawah.</span>
                </li>
              </ol>
            </div>

            {/* Code preview block */}
            <div className="flex flex-col gap-2 bg-[#0a0414]/90 border border-white/10 rounded-2xl p-4 shadow-2xl relative">
              <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2 text-[10px] font-mono tracking-wider text-white/50 uppercase">
                <span>Google Apps Script Template (v3.0)</span>
                <span className="text-emerald-400 font-bold">javascript</span>
              </div>
              <pre className="text-[10px] text-white/85 font-mono text-left max-h-[190px] overflow-y-auto leading-relaxed select-all">
{`function doPost(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getActiveSheet();
  try {
    var data = JSON.parse(e.postData.contents);
    var fotoCellVal = "";
    if (data.foto && data.foto.indexOf("base64,") !== -1) {
      var base64Parts = data.foto.split("base64,");
      var header = base64Parts[0];
      var base64Data = base64Parts[1];
      var contentType = header.substring(header.indexOf(":")+1, header.indexOf(";"));
      var ext = contentType.indexOf("jpeg") !== -1 ? "jpg" : "png";
      var filename = "foto_" + data.namaPanggilan + "_" + new Date().getTime() + "." + ext;
      
      var decoded = Utilities.base64Decode(base64Data);
      var blob = Utilities.newBlob(decoded, contentType, filename);
      // Simpan ke Google Drive folder ID: 1yjex00ENe639kozcNO9_NnxWuMaN2SN5
      var folder = DriveApp.getFolderById("1yjex00ENe639kozcNO9_NnxWuMaN2SN5");
      var file = folder.createFile(blob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      var fileId = file.getId();
      var imageUrl = "https://docs.google.com/uc?export=view&id=" + fileId;
      fotoCellVal = '=IMAGE("' + imageUrl + '")';
    } else if (data.foto) {
      fotoCellVal = '=IMAGE("' + data.foto + '")';
    }
    
    var rtString = data.rt ? data.rt.toString() : "";
    if (rtString && !rtString.startsWith("'")) {
      rtString = "'" + rtString;
    }

    var tanggalLahirVal = data.tanggalLahir ? data.tanggalLahir.toString() : "";
    if (tanggalLahirVal && tanggalLahirVal.indexOf("-") !== -1) {
      var dateParts = tanggalLahirVal.split("-");
      if (dateParts.length === 3) {
        tanggalLahirVal = dateParts[2] + "/" + dateParts[1] + "/" + dateParts[0];
      }
    }

    sheet.appendRow([
      data.namaLengkap,
      data.namaPanggilan,
      data.tempatLahir,
      tanggalLahirVal,
      data.alamat,
      rtString,
      fotoCellVal
    ]);
    return ContentService.createTextOutput(JSON.stringify({ "status": "success", "message": "Berhasil dicatat!" })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ "status": "error", "message": error.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

function testAuthorize() {
  var folder = DriveApp.getFolderById("1yjex00ENe639kozcNO9_NnxWuMaN2SN5");
  Logger.log("Otorisasi Google Drive Berhasil disetujui!");
}`}
              </pre>
              <div className="absolute bottom-2 right-2 flex gap-1">
                <button
                  onClick={copyAppsScriptCode}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 text-white transition-all cursor-pointer"
                  title="Salin Kode Cepat"
                >
                  <Clipboard className="w-3.5 h-3.5 text-white/80" />
                </button>
              </div>
            </div>
          </div>

          {/* Web App URL input */}
          <div className="flex flex-col gap-2 mt-2 pt-4 border-t border-white/15 font-sans">
            <label className="text-[10px] font-mono font-black text-white uppercase tracking-widest pl-1">
              Google Apps Script Web App URL
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                id="apps-script-url-input"
                type="text"
                placeholder="https://script.google.com/macros/s/.../exec"
                value={appsScriptUrl}
                onChange={(e) => saveAppsScriptUrl(e.target.value)}
                className="grow bg-white/10 border border-white/25 rounded-2xl px-4 py-3.5 text-xs text-white placeholder-white/30 focus:outline-none focus:bg-white/15 focus:ring-1 focus:ring-white/40 transition-all font-medium font-mono"
              />
              {appsScriptUrl && (
                <button
                  id="delete-cloud-integration-btn"
                  onClick={() => saveAppsScriptUrl("")}
                  className="px-4 py-3.5 rounded-2xl bg-red-600 hover:bg-red-700 border border-red-500 hover:border-red-400 text-xs font-bold text-white transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-[0.97]"
                  title="Hapus data integrasi cloud"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus Integrasi</span>
                </button>
              )}
            </div>
            <p className="text-[10px] text-emerald-300 italic flex items-center gap-1.5 mt-0.5 pl-1 font-medium font-mono font-sans">
              <Sparkles className="w-3 h-3 text-yellow-300 animate-pulse" /> 
              {appsScriptUrl ? "Koneksi cloud aktif! Setiap pendaftaran baru akan diunggah fotonya ke Google Drive dan langsung terintegrasi di Google Sheets." : "Mode lokal aktif! Berkas baru tersimpan ke web browser Anda secara instan."}
            </p>
          </div>
        </div>
      )}

      {/* Roster Display Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <RefreshCw className="w-8 h-8 text-white animate-spin" />
          <p className="text-sm font-semibold tracking-wider uppercase text-white/80">
            Mengunduh database remaja...
          </p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-10 px-5 gap-3 border border-red-500/20 bg-red-500/10 rounded-2xl text-center">
          <AlertCircle className="w-8 h-8 text-red-300 animate-bounce" />
          <div>
            <h4 className="text-sm font-bold text-white">Oops! Terjadi Gangguan</h4>
            <p className="text-xs text-white/80 mt-1 max-w-md leading-relaxed">{error}</p>
          </div>
          <button
            onClick={loadRoster}
            className="mt-2 px-4 py-2 bg-white text-[#A635FF] font-black text-xs tracking-wider rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
          >
            Coba Sinkronisasi Lagi
          </button>
        </div>
      ) : filteredMembers.length === 0 ? (
        <div className="py-16 text-center border border-white/15 bg-white/5 rounded-2xl flex flex-col items-center gap-2">
          <Users className="w-8 h-8 text-white/30" />
          <p className="text-sm font-bold text-white/70">
            {search ? `Tidak ada anggota yang cocok dengan "${search}"` : "Database kosong atau belum terisi."}
          </p>
          <p className="text-xs text-white/55">
            {search ? "Coba kata kunci lain ya, Sob!" : "Ayo jadilah pendaftar pertama pada form di atas!"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-2">
          {filteredMembers.map((member, idx) => {
            const initials = member.namaPanggilan.slice(0, 2).toUpperCase();
            const formattedDate = member.tanggalLahir
              ? (member.tanggalLahir.includes("/")
                  ? member.tanggalLahir
                  : member.tanggalLahir.split("-").reverse().join("/"))
              : "";
            const age = getAgeString(member.tanggalLahir);

            return (
              <div
                key={idx}
                id={`roster-card-${idx}`}
                className="relative group rounded-3xl bg-[#160a2c] hover:bg-[#20103c] border border-white/20 hover:border-white/35 p-5 flex flex-col gap-4 shadow-[0_8px_32px_rgba(0,0,0,0.15)] hover:shadow-[0_16px_48px_rgba(0,0,0,0.25)] transition-all duration-300 text-left hover:scale-[1.02]"
              >
                {/* Visual hologrid back design */}
                <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:16px_16px] rounded-3xl pointer-events-none" />

                {/* Floating Actions Panel (Download & Delete) */}
                <div className="absolute top-4 right-4 z-20 flex items-center gap-2 sm:opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  {/* Download Card JPEG Button */}
                  <button
                    onClick={() => handleDownloadCard(idx, member.namaPanggilan)}
                    disabled={downloadingId === idx}
                    type="button"
                    title={`Download kartu ${member.namaPanggilan} sebagai JPEG`}
                    className="p-2 bg-white/10 hover:bg-pink-600/30 text-white hover:text-pink-300 border border-white/20 hover:border-pink-500/30 rounded-xl transition-all cursor-pointer backdrop-blur-md active:scale-95"
                  >
                    {downloadingId === idx ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Download className="w-3.5 h-3.5" />
                    )}
                  </button>

                  {/* Delete Button (for local members only) */}
                  {member.isLocal && (
                    <div className="relative">
                      {deleteConfirm === member.namaPanggilan ? (
                        <div className="flex items-center gap-1 bg-[#120822]/95 border border-red-500/40 rounded-xl p-1 shadow-lg animate-fade-in absolute right-0 top-full mt-1.5 z-40">
                          <button
                            onClick={() => handleDeleteConfirm(member.namaPanggilan)}
                            className="px-2 py-1 bg-red-600 text-white font-black text-[9px] tracking-wider uppercase rounded hover:bg-red-700 transition-all cursor-pointer whitespace-nowrap"
                          >
                            Hapus
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="px-2 py-1 bg-white/10 text-white font-semibold text-[9px] tracking-wider uppercase rounded hover:bg-white/20 transition-all cursor-pointer whitespace-nowrap"
                          >
                            Batal
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirm(member.namaPanggilan)}
                          title="Hapus pendaftaran lokal ini"
                          className="p-2 bg-red-500/10 hover:bg-red-500/30 text-red-300 hover:text-red-200 border border-red-500/20 rounded-xl transition-all cursor-pointer backdrop-blur-md active:scale-95"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex gap-4 items-center relative z-10">
                  {/* Small avatar container */}
                  <div className="w-14 h-14 rounded-2xl overflow-hidden shrink-0 border border-white/30 shadow-md bg-gradient-to-br from-[#FF3D77] via-[#A635FF] to-[#3B82F6] p-[1px]">
                    {member.foto ? (
                      <img
                        src={member.foto}
                        alt={member.namaPanggilan}
                        className="w-full h-full object-cover rounded-[13px]"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          // Handle visual source block gracefully for invalid avatar URLs
                          (e.target as HTMLImageElement).style.display = "none";
                          const fallbackNode = (e.target as HTMLImageElement).nextElementSibling;
                          if (fallbackNode) (fallbackNode as HTMLElement).style.display = "flex";
                        }}
                      />
                    ) : null}
                    <div
                      style={{ display: member.foto ? "none" : "flex" }}
                      className="w-full h-full flex items-center justify-center bg-[#120822] text-white font-mono font-black text-sm uppercase rounded-[13px]"
                    >
                      {initials}
                    </div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <span className="text-[9px] font-mono tracking-widest text-white/50 block font-black uppercase">
                      GP-PASS // ACTIVE
                    </span>
                    <h4 className="text-base font-black truncate text-white leading-snug">
                      @{member.namaPanggilan.toLowerCase()}
                    </h4>
                    <p className="text-xs text-white/70 truncate leading-snug">
                      {member.namaLengkap}
                    </p>
                  </div>
                </div>

                {/* Sub details */}
                <div className="border-t border-white/10 pt-3 flex flex-col gap-1.5 text-left text-white/80 font-mono text-[11px] relative z-10">
                  <div className="flex items-center gap-1.5 truncate">
                    <MapPin className="w-3.5 h-3.5 text-white/60 shrink-0" />
                    <span>
                      {member.tempatLahir ? member.tempatLahir : "Mandalika"} (RT {member.rt})
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Calendar className="w-3.5 h-3.5 text-white/60 shrink-0" />
                      <span className="truncate">{formattedDate}</span>
                    </div>
                    {age && (
                      <span className="px-1.5 py-0.5 rounded bg-white/20 text-white font-bold text-[9px]">
                        {age}
                      </span>
                    )}
                  </div>

                  <div className="bg-white/10 border border-white/10 rounded-lg p-2 text-[10px] mt-1 line-clamp-2" title={member.alamat}>
                    {member.alamat}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Roster stats bar footer */}
      {!loading && !error && members.length > 0 && (
        <div className="flex items-center justify-between gap-3 border-t border-white/15 pt-5 text-[10px] text-white/60 font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Kapasitas Roster Aktif</span>
          </div>
          <span className="text-white font-bold uppercase">
            {filteredMembers.length} dari {members.length} remaja terdaftar
          </span>
        </div>
      )}

    </div>
  );
};
