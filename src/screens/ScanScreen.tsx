import { useEffect, useRef, useState, type FormEvent } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { normaliseBarcode } from "../api/openBeautyFacts";

const FORMATS = [
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.CODE_39,
];

type ScanScreenProps = {
  pending: string | null;
  onBarcode: (barcode: string) => void;
};

export function ScanScreen({ pending, onBarcode }: ScanScreenProps) {
  const [manualOpen, setManualOpen] = useState(false);
  const [value, setValue] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const onBarcodeRef = useRef(onBarcode);
  onBarcodeRef.current = onBarcode;

  useEffect(() => {
    if (pending) return;
    const element = document.getElementById("barcode-reader");
    if (!element) return;

    let stopped = false;
    const scanner = new Html5Qrcode("barcode-reader", {
      formatsToSupport: FORMATS,
      verbose: false,
      useBarCodeDetectorIfSupported: true,
    });

    const startPromise = scanner
      .start(
        { facingMode: "environment" },
        {
          fps: 8,
          qrbox: (viewfinderWidth) => {
            const width = Math.max(180, Math.min(260, viewfinderWidth - 24));
            return { width, height: Math.round(width * 0.46) };
          },
        },
        (decoded) => {
          if (stopped) return;
          const barcode = normaliseBarcode(decoded);
          if (!barcode) {
            setFormError("That code doesn't look like a product barcode. Try again, or type it in.");
            setManualOpen(true);
            return;
          }
          stopped = true;
          void scanner
            .stop()
            .catch(() => undefined)
            .finally(() => onBarcodeRef.current(barcode));
        },
        () => undefined,
      )
      .catch((error: unknown) => {
        if (!stopped) {
          setCameraError(cameraMessage(error));
          setManualOpen(true);
        }
      });

    return () => {
      stopped = true;
      void startPromise
        .then(() => scanner.stop())
        .catch(() => undefined)
        .finally(() => {
          try {
            scanner.clear();
          } catch {
            /* The scanner may already be cleared. */
          }
        });
    };
  }, [pending]);

  function submit(event: FormEvent) {
    event.preventDefault();
    const barcode = normaliseBarcode(value);
    if (!barcode) {
      setFormError("Enter a barcode of 8 to 14 digits.");
      return;
    }
    setFormError(null);
    onBarcode(barcode);
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-serif text-3xl leading-tight text-foreground">Scan a barcode</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-muted">
          Point the camera at the barcode. If the camera is unavailable, type the number instead.
        </p>
      </div>

      {pending ? (
        <p className="rounded-2xl border border-border bg-surface px-4 py-5 text-[15px] text-foreground" role="status">
          Looking up barcode {pending}…
        </p>
      ) : (
        <div className="relative overflow-hidden rounded-2xl border border-border bg-black">
          <div id="barcode-reader" />
          {cameraError ? (
            <div className="absolute inset-0 flex items-center bg-surface px-4">
              <div>
                <h2 className="font-serif text-xl text-foreground">Camera unavailable</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted">{cameraError}</p>
              </div>
            </div>
          ) : (
            <p className="pointer-events-none absolute inset-x-3 bottom-3 rounded-full bg-background px-3 py-1 text-center text-xs text-white">
              Hold the barcode inside the frame
            </p>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={() => setManualOpen((open) => !open)}
        className="text-left text-sm font-medium text-highlight"
        aria-expanded={manualOpen}
      >
        Enter barcode manually
      </button>

      {manualOpen ? (
        <form onSubmit={submit} className="flex flex-col gap-2">
          <label htmlFor="manual-barcode" className="text-sm text-muted">
            Barcode
          </label>
          <input
            id="manual-barcode"
            value={value}
            inputMode="numeric"
            autoComplete="off"
            disabled={pending !== null}
            onChange={(event) => setValue(event.target.value)}
            placeholder="8 to 14 digits"
            className="h-12 rounded-2xl border border-border bg-surface px-4 text-base text-foreground placeholder:text-muted"
          />
          {formError ? (
            <p className="text-sm text-foreground" role="alert">
              {formError}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={pending !== null}
            className="h-12 rounded-2xl bg-primary text-base font-semibold text-white"
          >
            Look up barcode
          </button>
        </form>
      ) : null}
    </div>
  );
}

function cameraMessage(error: unknown): string {
  const text = error instanceof Error ? `${error.name} ${error.message}` : String(error);
  if (/NotAllowed|Permission|denied/i.test(text)) {
    return "Camera access is turned off for this page. You can type the barcode instead.";
  }
  if (/NotFound|NotReadable|no camera|devices/i.test(text)) {
    return "No camera is available right now. You can type the barcode instead.";
  }
  if (typeof window !== "undefined" && window.isSecureContext === false) {
    return "The camera needs a secure page (HTTPS). You can type the barcode instead.";
  }
  return "The camera could not start. You can type the barcode instead.";
}
