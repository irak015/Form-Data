export interface FormData {
  namaLengkap: string;
  namaPanggilan: string;
  tempatLahir: string;
  tanggalLahir: string;
  alamat: string;
  rt: string;
  foto: string | null; // DataURL or ObjectURL of uploaded photo
  fotoName: string | null;
  fotoSize: string | null;
}
