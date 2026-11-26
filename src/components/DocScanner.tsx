import { useEffect, useRef, useState } from "react";
import { Camera, CheckCircle, ImageUp, Loader2, RotateCcw, X } from "lucide-react";

// Photo of an ID document or a driving licence for the contract. On a phone
// "Scan" opens the rear camera full screen with a card-shaped frame; the shot
// is cropped to the frame. "Upload" takes a photo or a file the usual way.
// Either way the image is shrunk to a JPEG of at most MAX_SIDE px and handed
// to onImage (which uploads it).

const MAX_SIDE = 1800;
const QUALITY = 0.85;
/** ID-1 card (ID card, driving licence): 85.6 x 54 mm. A passport page is a bit squarer. */
const CARD_RATIO = 85.6 / 54;
const PASSPORT_RATIO = 125 / 88;

export interface ScanTexts {
  scan: string;
  upload: string;
  retake: string;
  uploading: string;
  uploaded: string;
  failed: string;
  frameHint: string;
  shoot: string;
  cancel: string;
  noCamera: string;
}

type State = "empty" | "busy" | "done" | "error";

function toJpeg(
  source: CanvasImageSource,
  sw: number,
  sh: number,
  crop?: { x: number; y: number; w: number; h: number },
) {
  const c = crop || { x: 0, y: 0, w: sw, h: sh };
  const scale = Math.min(1, MAX_SIDE / Math.max(c.w, c.h));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(c.w * scale);
  canvas.height = Math.round(c.h * scale);
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(source, c.x, c.y, c.w, c.h, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", QUALITY);
}

async function fileToJpeg(file: File): Promise<string> {
  // createImageBitmap applies the EXIF rotation of phone photos.
  const bmp = await createImageBitmap(file);
  try {
    return toJpeg(bmp, bmp.width, bmp.height);
  } finally {
    bmp.close();
  }
}

const canUseCamera = () =>
  typeof navigator !== "undefined" &&
  !!navigator.mediaDevices?.getUserMedia &&
  typeof window !== "undefined" &&
  window.isSecureContext;

export function DocScanner({
  label,
  passport = false,
  texts,
  onImage,
}: {
  label: string;
  passport?: boolean;
  texts: ScanTexts;
  /** Uploads the JPEG data URL; rejects on failure. */
  onImage: (dataUrl: string) => Promise<void>;
}) {
  const [state, setState] = useState<State>("empty");
  const [preview, setPreview] = useState<string | null>(null);
  const [camera, setCamera] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handle(dataUrl: string) {
    setPreview(dataUrl);
    setState("busy");
    try {
      await onImage(dataUrl);
      setState("done");
    } catch {
      setState("error");
    }
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      await handle(await fileToJpeg(file));
    } catch {
      setState("error");
    }
  }

  return (
    <div className="rounded-xl border border-border p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium">{label}</span>
        {state === "done" && (
          <span className="flex items-center gap-1 text-xs text-green-500">
            <CheckCircle className="h-4 w-4" /> {texts.uploaded}
          </span>
        )}
        {state === "busy" && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> {texts.uploading}
          </span>
        )}
      </div>

      {preview && (
        <img
          src={preview}
          alt={label}
          className="mt-2 max-h-44 w-full rounded-lg border border-border bg-black/20 object-contain"
        />
      )}
      {state === "error" && <p className="mt-2 text-xs text-destructive">{texts.failed}</p>}

      <div className="mt-2 flex flex-wrap gap-2">
        {canUseCamera() && (
          <button
            type="button"
            onClick={() => setCamera(true)}
            disabled={state === "busy"}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-60"
          >
            {preview ? <RotateCcw className="h-4 w-4" /> : <Camera className="h-4 w-4" />}
            {preview ? texts.retake : texts.scan}
          </button>
        )}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={state === "busy"}
          className="inline-flex items-center gap-1.5 rounded-full border border-border px-3.5 py-2 text-xs font-semibold disabled:opacity-60"
        >
          <ImageUp className="h-4 w-4" /> {texts.upload}
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
      </div>

      {camera && (
        <CameraOverlay
          ratio={passport ? PASSPORT_RATIO : CARD_RATIO}
          label={label}
          texts={texts}
          onClose={() => setCamera(false)}
          onShot={(d) => {
            setCamera(false);
            void handle(d);
          }}
          onNoCamera={() => {
            setCamera(false);
            fileRef.current?.click();
          }}
        />
      )}
    </div>
  );
}

function CameraOverlay({
  ratio,
  label,
  texts,
  onClose,
  onShot,
  onNoCamera,
}: {
  ratio: number;
  label: string;
  texts: ScanTexts;
  onClose: () => void;
  onShot: (dataUrl: string) => void;
  onNoCamera: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let cancelled = false;
    navigator.mediaDevices
      .getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 3840 },
          height: { ideal: 2160 },
        },
        audio: false,
      })
      .then(async (s) => {
        if (cancelled) return s.getTracks().forEach((t) => t.stop());
        stream = s;
        const v = videoRef.current!;
        v.srcObject = s;
        await v.play().catch(() => {});
        // Continuous autofocus where the browser supports it.
        const track = s.getVideoTracks()[0];
        const caps = (track.getCapabilities?.() || {}) as { focusMode?: string[] };
        if (caps.focusMode?.includes("continuous")) {
          track
            .applyConstraints({
              advanced: [{ focusMode: "continuous" } as MediaTrackConstraintSet],
            })
            .catch(() => {});
        }
        setReady(true);
      })
      .catch(() => setError(true));
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      cancelled = true;
      stream?.getTracks().forEach((t) => t.stop());
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  function shoot() {
    const v = videoRef.current;
    const f = frameRef.current;
    if (!v || !f || !v.videoWidth) return;
    // The video is shown with object-fit: cover; map the frame back to video pixels.
    const vr = v.getBoundingClientRect();
    const fr = f.getBoundingClientRect();
    const scale = Math.max(vr.width / v.videoWidth, vr.height / v.videoHeight);
    const offX = (vr.width - v.videoWidth * scale) / 2;
    const offY = (vr.height - v.videoHeight * scale) / 2;
    // A little margin around the frame so the card edges are never cut.
    const pad = 0.04;
    let x = (fr.left - vr.left - offX) / scale;
    let y = (fr.top - vr.top - offY) / scale;
    let w = fr.width / scale;
    let h = fr.height / scale;
    x -= w * pad;
    y -= h * pad;
    w *= 1 + 2 * pad;
    h *= 1 + 2 * pad;
    x = Math.max(0, x);
    y = Math.max(0, y);
    w = Math.min(v.videoWidth - x, w);
    h = Math.min(v.videoHeight - y, h);
    onShot(toJpeg(v, v.videoWidth, v.videoHeight, { x, y, w, h }));
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black text-white">
      <div className="relative flex-1 overflow-hidden">
        <video
          ref={videoRef}
          playsInline
          muted
          className="absolute inset-0 h-full w-full object-cover"
        />
        {/* Darkened surroundings with a card-shaped window */}
        <div className="absolute inset-0 flex items-center justify-center p-5">
          <div
            ref={frameRef}
            className="relative w-full max-w-xl rounded-2xl border-2 border-primary"
            style={{ aspectRatio: String(ratio), boxShadow: "0 0 0 9999px rgba(0,0,0,0.55)" }}
          >
            {(
              [
                "left-0 top-0 border-l-4 border-t-4",
                "right-0 top-0 border-r-4 border-t-4",
                "left-0 bottom-0 border-l-4 border-b-4",
                "right-0 bottom-0 border-r-4 border-b-4",
              ] as const
            ).map((c) => (
              <span key={c} className={`absolute h-7 w-7 rounded-sm border-primary ${c}`} />
            ))}
          </div>
        </div>
        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-4">
          <div>
            <p className="text-sm font-semibold">{label}</p>
            <p className="mt-0.5 text-xs text-white/80">
              {error ? texts.noCamera : texts.frameHint}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={texts.cancel}
            className="rounded-full bg-white/15 p-2"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
      <div className="flex items-center justify-center gap-6 bg-black p-5 pb-8">
        {error ? (
          <button
            type="button"
            onClick={onNoCamera}
            className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"
          >
            {texts.upload}
          </button>
        ) : (
          <button
            type="button"
            onClick={shoot}
            disabled={!ready}
            aria-label={texts.shoot}
            className="h-[72px] w-[72px] rounded-full border-4 border-white bg-primary disabled:opacity-40"
          />
        )}
      </div>
    </div>
  );
}
