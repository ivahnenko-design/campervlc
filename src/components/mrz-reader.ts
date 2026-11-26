// Reads the machine-readable zone (the lines with <<<) of a passport, ID card
// or residence card photo in the guest's browser with Tesseract: free, and the
// photo never leaves the phone for this. Returns the signing form fields, or
// null when no MRZ with valid check digits was found.
import { mrzToFields, parseMrz, refineNames } from "../../shared/mrz.js";

/** Grey copy of the lower part of the photo (where the MRZ is), with a CSS filter. */
async function lowerPart(dataUrl: string, fromTop: number, filter: string): Promise<Blob> {
  const img = new Image();
  img.src = dataUrl;
  await img.decode();
  const sy = Math.round(img.naturalHeight * fromTop);
  const sh = img.naturalHeight - sy;
  const scale = Math.min(2, 1600 / img.naturalWidth);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.naturalWidth * scale);
  canvas.height = Math.round(sh * scale);
  const ctx = canvas.getContext("2d")!;
  ctx.filter = filter;
  ctx.drawImage(img, 0, sy, img.naturalWidth, sh, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("canvas"))), "image/png"),
  );
}

export async function readMrz(photos: string[]): Promise<Record<string, string> | null> {
  if (!photos.length) return null;
  const { createWorker, PSM } = await import("tesseract.js");
  const worker = await createWorker("eng");
  try {
    await worker.setParameters({
      tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<",
      tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
    });
    // OCR of the "<" filler is noisy (read as K / L), so each photo is read in
    // several passes (crop, contrast). The first clean reading is taken and its
    // name words are checked against all passes (refineNames).
    for (const photo of photos) {
      const texts: string[] = [];
      const seen: NonNullable<ReturnType<typeof parseMrz>>[] = [];
      for (const [fromTop, filter] of [
        [0.5, "grayscale(1) contrast(1.6)"],
        [0.5, "grayscale(1)"],
        [0.5, "none"],
        [0, "grayscale(1) contrast(1.6)"],
      ] as const) {
        const { data } = await worker.recognize(await lowerPart(photo, fromTop, filter));
        const mrz = parseMrz(data.text);
        if (!mrz) continue;
        texts.push(data.text);
        seen.push(mrz);
      }
      if (seen.length)
        return mrzToFields(refineNames(seen.find((m) => m.namesClean) || seen[0], texts));
    }
    return null;
  } finally {
    await worker.terminate();
  }
}
