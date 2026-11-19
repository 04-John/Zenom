"use client";

import Image from "next/image";
import { Icon, Sheet } from "@/components/mobile/ui";

export type ViewerPhoto = { id: string; url: string; caption: string };

/**
 * A progress photo (or the customer's reference photo) large, in a bottom
 * sheet, with previous / next when there are several. `index` null = closed.
 */
export function PhotoViewerSheet({
  photos,
  index,
  onIndex,
  onClose,
}: {
  photos: ViewerPhoto[];
  index: number | null;
  onIndex: (i: number) => void;
  onClose: () => void;
}) {
  const p = index != null ? photos[index] : undefined;
  const i = index ?? 0;
  const navBtn = (off: boolean): React.CSSProperties => ({ width: 52, flex: "none", opacity: off ? 0.4 : 1 });

  return (
    <Sheet open={!!p} onClose={onClose} label={p?.caption ?? "Photo"}>
      {p && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ borderRadius: 16, overflow: "hidden", background: "#EFEAE2", display: "flex", justifyContent: "center" }}>
            <Image
              key={p.id}
              src={p.url}
              alt={p.caption}
              width={1080}
              height={1350}
              sizes="(max-width: 560px) 100vw, 520px"
              style={{ width: "100%", height: "auto", maxHeight: "60dvh", objectFit: "contain" }}
            />
          </div>
          {photos.length > 1 && (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button type="button" className="sec" style={navBtn(i === 0)} disabled={i === 0} onClick={() => onIndex(i - 1)} aria-label="Previous photo">
                <Icon name="back" size={18} stroke={2} />
              </button>
              <span style={{ flex: 1, textAlign: "center", fontSize: 13, color: "#4A433B" }} aria-live="polite">
                {i + 1} of {photos.length}
              </span>
              <button type="button" className="sec" style={navBtn(i === photos.length - 1)} disabled={i === photos.length - 1} onClick={() => onIndex(i + 1)} aria-label="Next photo">
                <Icon name="chevronRight" size={18} stroke={2} />
              </button>
            </div>
          )}
          <a href={p.url} target="_blank" rel="noopener noreferrer" className="lnk" style={{ alignSelf: "center", minHeight: 44, display: "flex", alignItems: "center", gap: 6 }}>
            Open full size <Icon name="external" size={14} stroke={2} />
          </a>
        </div>
      )}
    </Sheet>
  );
}
