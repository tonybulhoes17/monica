import "server-only";
import QRCode from "qrcode";

/** Gera um QR code como data URL (PNG base64), pronto para <img src=...>. */
export async function generateQrDataUrl(text: string): Promise<string> {
  return QRCode.toDataURL(text, {
    margin: 1,
    width: 160,
    color: { dark: "#000000", light: "#ffffff" },
  });
}
