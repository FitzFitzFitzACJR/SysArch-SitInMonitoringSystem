import "server-only";
import QRCode from "qrcode";
import { qrPayload } from "../schemas";
import { RotateQrButton } from "./rotate-qr-button";

/**
 * The student's check-in code. Rendered as an SVG on the server; always black on white
 * (even in dark mode) because scanners need the contrast.
 */
export async function StudentQr({
  token,
  idNumber,
  rotatable,
}: {
  token: string;
  idNumber: string;
  rotatable?: boolean;
}) {
  // The payload is our own prefix + a random URL-safe token, and the SVG comes from the
  // qrcode library, so injecting it is safe.
  const svg = await QRCode.toString(qrPayload(token), {
    type: "svg",
    margin: 1,
    errorCorrectionLevel: "M",
    width: 240,
  });
  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="w-full max-w-60 rounded-lg bg-white p-2 [&_svg]:h-auto [&_svg]:w-full"
        role="img"
        aria-label={`Check-in QR code for ${idNumber}`}
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      <p className="text-muted-foreground text-center text-sm">
        Show this to the lab staff to check in and out. ID {idNumber}.
      </p>
      {rotatable && <RotateQrButton />}
    </div>
  );
}
