"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Cta, HeaderButton, Icon, LightPage, ListCard, SearchField, Sheet, useLightToast } from "@/components/mobile/ui";
import { CATEGORY_LABEL, fromDbCategory, type DbCategory } from "@/lib/pricing";
import { ARTWORK_STATUS, ARTWORK_STATUSES, type ArtworkStatus } from "@/lib/zenom-mobile";
import { ARTWORKS_BACK_KEY, ART_CATEGORIES, FLASH_KEY, remember } from "./shared";
import { artworkChipStyle } from "./StatusChip";
import { StudioHeader } from "./StudioHeader";
import { Thumb, canOptimize } from "./Thumb";

export type ArtRow = {
  id: string;
  name: string;
  code: string | null;
  category: DbCategory;
  status: ArtworkStatus;
  image: string | null;
  ordered: number;
};

const catLabel = (c: DbCategory) => CATEGORY_LABEL[fromDbCategory(c)];
const rowAnim = (i: number): React.CSSProperties => ({ animation: "m-rise .45s cubic-bezier(.22,1,.36,1) both", animationDelay: `${Math.min(i, 10) * 0.03}s` });
/** A 44px hit area around a 30px .pill tag. */
const TAG_HIT: React.CSSProperties = { minHeight: 44, display: "flex", alignItems: "center", border: 0, background: "none", padding: 0, cursor: "pointer" };
const srOnly: React.CSSProperties = { position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" };

const listUrl = (status: ArtworkStatus | null, category: DbCategory | null, q: string) => {
  const p = new URLSearchParams();
  if (category) p.set("category", category);
  if (status) p.set("status", status);
  if (q.trim()) p.set("q", q.trim());
  const s = p.toString();
  return `/studio/products${s ? `?${s}` : ""}`;
};

/** Keep the filters in the address bar without a server round trip (filtering is client-side). */
function rememberUrl(url: string, replace: boolean) {
  if (replace) window.history.replaceState(window.history.state, "", url);
  remember(ARTWORKS_BACK_KEY, url);
}

// Artworks tab of the light studio app: category tiles, search + filter
// sheet, rows whose status chip opens a status sheet (PATCH /api/products/[id]).
// Every non-commission product is loaded once and filtered on the phone.
export function ArtworksMobile({
  arts,
  tileImages,
  initialStatus,
  initialCategory,
  initialQ,
}: {
  arts: ArtRow[];
  tileImages: Record<DbCategory, string>;
  initialStatus: ArtworkStatus | null;
  initialCategory: DbCategory | null;
  initialQ: string;
}) {
  const router = useRouter();
  const { say } = useLightToast();
  // The artwork just added or saved in the form flashes in (prototype `row-new`).
  const [flashId, setFlashId] = useState<string | null>(null);
  const [status, setStatus] = useState<ArtworkStatus | null>(initialStatus);
  const [category, setCategory] = useState<DbCategory | null>(initialCategory);
  const [q, setQ] = useState(initialQ);
  const [filterOpen, setFilterOpen] = useState(false);
  const [statusFor, setStatusFor] = useState<string | null>(null);
  // Optimistic status changes until the refreshed list arrives.
  const [overrides, setOverrides] = useState<Record<string, ArtworkStatus>>({});
  const first = useRef(true);

  useEffect(() => {
    rememberUrl(listUrl(status, category, q), !first.current);
    first.current = false;
  }, [status, category, q]);

  useEffect(() => {
    try {
      const id = sessionStorage.getItem(FLASH_KEY);
      if (id) {
        setFlashId(id);
        sessionStorage.removeItem(FLASH_KEY);
      }
    } catch {
      /* storage unavailable */
    }
  }, []);

  // Drop overrides the server has caught up with.
  useEffect(() => {
    setOverrides((o) => {
      const next = { ...o };
      for (const a of arts) if (next[a.id] === a.status) delete next[a.id];
      return Object.keys(next).length === Object.keys(o).length ? o : next;
    });
  }, [arts]);

  const all = useMemo(() => arts.map((a) => (overrides[a.id] ? { ...a, status: overrides[a.id] } : a)), [arts, overrides]);
  const list = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return all.filter(
      (a) => (!status || a.status === status) && (!category || a.category === category) && (!qq || `${a.name} ${a.code ?? ""}`.toLowerCase().includes(qq))
    );
  }, [all, status, category, q]);

  const activeN = (status ? 1 : 0) + (category ? 1 : 0);
  const sheetArt = all.find((a) => a.id === statusFor) ?? null;
  const clearFilters = () => {
    setStatus(null);
    setCategory(null);
  };

  async function changeStatus(a: ArtRow, next: ArtworkStatus) {
    setStatusFor(null);
    if (a.status === next) return;
    setOverrides((o) => ({ ...o, [a.id]: next }));
    try {
      const res = await fetch(`/api/products/${a.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) throw new Error();
      say(`${a.name} · ${ARTWORK_STATUS[next].label}`);
      router.refresh();
    } catch {
      setOverrides((o) => {
        const rest = { ...o };
        delete rest[a.id];
        return rest;
      });
      say(`Couldn't update ${a.name}. Try again.`, { tone: "error" });
    }
  }

  return (
    <LightPage desktop="hide" tabBar>
      <StudioHeader kicker="Admin" title="Artworks" addHref={`/studio/products/new${category ? `?category=${category}` : ""}`} />
      <div className="enter-fade" style={{ padding: "4px 20px 28px", display: "flex", flexDirection: "column", gap: 14 }}>
        {/* Category tiles: on sale / total, tap to filter */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
          {ART_CATEGORIES.map((c) => {
            const inCat = all.filter((a) => a.category === c);
            const onSale = inCat.filter((a) => a.status === "AVAILABLE").length;
            const on = category === c;
            return (
              <button
                key={c}
                type="button"
                className={"topic" + (on ? " on" : "")}
                aria-pressed={on}
                onClick={() => setCategory(on ? null : c)}
                style={{ padding: 0, overflow: "hidden", gap: 0, alignItems: "stretch" }}
              >
                <span style={{ position: "relative", height: 56, overflow: "hidden", display: "block" }}>
                  {canOptimize(tileImages[c]) && (
                    <Image src={tileImages[c]} alt="" fill sizes="(max-width: 560px) 50vw, 270px" style={{ objectFit: "cover", filter: "saturate(.85)" }} />
                  )}
                  <span aria-hidden="true" style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(18,16,14,0), rgba(18,16,14,.55))" }} />
                  <span className="kick" style={{ position: "absolute", left: 10, bottom: 7, fontSize: 9, color: "#ffffff" }}>
                    {catLabel(c)}
                  </span>
                </span>
                <span style={{ padding: "8px 10px 10px", display: "flex", flexDirection: "column", gap: 1 }}>
                  <b style={{ fontFamily: "'Instrument Serif', serif", fontWeight: 400, fontSize: 20, color: onSale === 0 ? "#9A4A1F" : undefined }}>{onSale} on sale</b>
                  <span style={{ fontSize: 11, color: "#4A433B" }}>{inCat.length} total</span>
                </span>
              </button>
            );
          })}
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <SearchField value={q} onChange={setQ} placeholder="Name or archive code" label="Search artworks" />
          <HeaderButton label="Filter artworks" icon="filter" onClick={() => setFilterOpen(true)} dark={activeN > 0} badge={activeN || undefined} badgeTone="ember" />
        </div>

        {activeN > 0 && (
          <div className="enter-fade" style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", margin: "-8px 0 -6px" }}>
            {status && (
              <button type="button" onClick={() => setStatus(null)} aria-label={`Remove filter ${ARTWORK_STATUS[status].label}`} style={TAG_HIT}>
                <span className="pill on">
                  {ARTWORK_STATUS[status].label}
                  <Icon name="close" size={10} stroke={3} />
                </span>
              </button>
            )}
            {category && (
              <button type="button" onClick={() => setCategory(null)} aria-label={`Remove filter ${catLabel(category)}`} style={TAG_HIT}>
                <span className="pill on">
                  {catLabel(category)}
                  <Icon name="close" size={10} stroke={3} />
                </span>
              </button>
            )}
            <button type="button" className="lnk" onClick={clearFilters} style={{ padding: "12px 4px", fontSize: 13 }}>
              Clear
            </button>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <h2 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>{category ? catLabel(category) : "All artworks"}</h2>
          <span style={{ fontSize: 12, color: "#4A433B" }} aria-live="polite">
            {list.length} shown
          </span>
        </div>

        <ListCard>
          {list.length === 0 ? (
            <p className="sub" style={{ padding: "28px 16px", textAlign: "center", fontSize: 14 }}>
              {arts.length === 0 ? "No artworks yet. " : "No artworks match. "}
              <Link href={`/studio/products/new${category ? `?category=${category}` : ""}`} className="lnk" style={{ padding: "4px 2px" }}>
                Add one
              </Link>
            </p>
          ) : (
            list.map((a, i) => {
              const fresh = flashId === a.id;
              return (
                <div key={a.id} className={"mrow" + (fresh ? " row-new" : "")} style={{ cursor: "default", ...(fresh ? {} : rowAnim(i)) }}>
                  <Link href={`/studio/products/${a.id}/edit`} aria-label={`Edit ${a.name}`} style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0, color: "inherit" }}>
                    <Thumb src={a.image} w={40} h={50} />
                    <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
                      <strong style={{ fontSize: 15, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.name}</strong>
                      <span style={{ fontSize: 12, color: "#4A433B", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {catLabel(a.category)}
                        {a.code ? ` · ${a.code}` : ""} · {a.ordered} ordered
                      </span>
                    </span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => setStatusFor(a.id)}
                    aria-label={`Change status of ${a.name} (now ${ARTWORK_STATUS[a.status].label})`}
                    style={{ minHeight: 44, flex: "none", display: "flex", alignItems: "center", border: 0, background: "none", padding: 0, cursor: "pointer" }}
                  >
                    <span className="chipst" style={{ height: 28, gap: 4, ...artworkChipStyle(a.status) }}>
                      {ARTWORK_STATUS[a.status].label}
                      <Icon name="chevronDown" size={10} stroke={3} />
                    </span>
                  </button>
                </div>
              );
            })
          )}
        </ListCard>
      </div>

      {/* Filter sheet: status + category, applied live */}
      <Sheet
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        label="Filter artworks"
        actions={
          <button type="button" className="lnk" onClick={clearFilters}>
            Reset
          </button>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <fieldset style={{ border: 0, margin: 0, padding: 0 }}>
            <legend className="gh" style={{ marginBottom: 10 }}>
              Status
            </legend>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {([null, ...ARTWORK_STATUSES] as (ArtworkStatus | null)[]).map((s) => (
                <button key={s ?? "any"} type="button" className={"chip" + (status === s ? " on" : "")} aria-pressed={status === s} onClick={() => setStatus(s)} style={{ fontSize: 14 }}>
                  {s ? ARTWORK_STATUS[s].label : "Any status"}{" "}
                  <span style={{ opacity: 0.6, fontWeight: 500 }}>{s ? all.filter((a) => a.status === s).length : all.length}</span>
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset style={{ border: 0, margin: 0, padding: 0 }}>
            <legend className="gh" style={{ marginBottom: 10 }}>
              Category
            </legend>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {([null, ...ART_CATEGORIES] as (DbCategory | null)[]).map((c) => (
                <button key={c ?? "all"} type="button" className={"chip" + (category === c ? " on" : "")} aria-pressed={category === c} onClick={() => setCategory(c)} style={{ fontSize: 14 }}>
                  {c ? catLabel(c) : "All"} <span style={{ opacity: 0.6, fontWeight: 500 }}>{c ? all.filter((a) => a.category === c).length : all.length}</span>
                </button>
              ))}
            </div>
          </fieldset>
          <Cta onClick={() => setFilterOpen(false)} style={{ height: 52, fontSize: 15 }}>
            Show {list.length} {list.length === 1 ? "artwork" : "artworks"}
          </Cta>
        </div>
      </Sheet>

      {/* Status sheet for one artwork */}
      <Sheet
        open={!!sheetArt}
        onClose={() => setStatusFor(null)}
        label={sheetArt ? `Set the status of ${sheetArt.name}` : "Change status"}
        title={
          sheetArt ? (
            <span style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
              <Thumb src={sheetArt.image} w={40} h={50} />
              <span style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                <strong style={{ fontSize: 18, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sheetArt.name}</strong>
                <span style={{ fontSize: 12, color: "#4A433B" }}>{sheetArt.code ? `${sheetArt.code} · ` : ""}set status</span>
              </span>
            </span>
          ) : undefined
        }
      >
        {sheetArt && (
          <div>
            {ARTWORK_STATUSES.map((s) => {
              const on = sheetArt.status === s;
              return (
                <button
                  key={s}
                  type="button"
                  aria-pressed={on}
                  onClick={() => changeStatus(sheetArt, s)}
                  style={{
                    width: "100%",
                    minHeight: 56,
                    border: 0,
                    borderBottom: "1px solid #EFEAE2",
                    background: "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    font: "500 16px 'Instrument Sans', sans-serif",
                    color: "#1A1714",
                    padding: "6px 4px",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <span>{ARTWORK_STATUS[s].label}</span>
                    <span style={{ fontSize: 12, color: "#4A433B" }}>{ARTWORK_STATUS[s].help}</span>
                  </span>
                  {on && (
                    <>
                      <Icon name="check" size={20} stroke={3} style={{ color: "#9A4A1F", animation: "m-pop .35s cubic-bezier(.34,1.56,.64,1) both", flex: "none" }} />
                      <span style={srOnly}>Current status</span>
                    </>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </Sheet>
    </LightPage>
  );
}
