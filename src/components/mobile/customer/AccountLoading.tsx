import { ZenomSpinner } from "@/components/brand/ZenomSpinner";
import { LightPage } from "@/components/mobile/ui";

// Route loading UI for /account/** and /commission: the dark spinner on
// desktop (unchanged; `lightDesktop` keeps the light column there too, for
// routes with no dark design), and a light page with the paper-tone spinner
// below 900px so the light app never flashes the dark ground between tabs.
export function AccountLoading({ lightDesktop = false }: { lightDesktop?: boolean }) {
  return (
    <>
      {!lightDesktop && (
        <div className="max-[900px]:hidden">
          <div style={{ minHeight: "70vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ZenomSpinner size={120} label="Drawing…" />
          </div>
        </div>
      )}
      <LightPage desktop={lightDesktop ? "column" : "hide"}>
        <div style={{ minHeight: "70dvh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <ZenomSpinner size={64} tone="paper" label="Loading" />
        </div>
      </LightPage>
    </>
  );
}
