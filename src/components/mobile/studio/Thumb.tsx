import Image from "next/image";
import { Icon } from "@/components/mobile/ui";

/**
 * True for image URLs next/image may optimise (see next.config remotePatterns):
 * local files, Cloudinary and *.netlify.app. Anything else an admin typed in
 * falls back to a plain <img> so a stray host can never crash a page.
 */
export function canOptimize(src: string | null | undefined): src is string {
  if (!src) return false;
  if (src.startsWith("/") && !src.startsWith("//")) return true;
  return /^https:\/\/res\.cloudinary\.com\//.test(src) || /^https:\/\/[a-z0-9-]+\.netlify\.app\//i.test(src);
}

/** Small artwork / reference-photo thumbnail with a quiet placeholder when there is no image. */
export function Thumb({
  src,
  w = 40,
  h = 50,
  radius = 8,
  className,
  style,
}: {
  src?: string | null;
  w?: number;
  h?: number;
  radius?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const box: React.CSSProperties = { width: w, height: h, flex: "none", borderRadius: radius, objectFit: "cover", display: "block", ...style };
  if (!src) {
    return (
      <span aria-hidden="true" className={className} style={{ ...box, background: "#EFEAE2", color: "#857C71", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon name="image" size={Math.min(18, Math.round(w / 2.2))} stroke={1.6} />
      </span>
    );
  }
  if (canOptimize(src)) {
    return <Image src={src} alt="" width={w} height={h} sizes={`${w}px`} className={className} style={box} />;
  }
  // eslint-disable-next-line @next/next/no-img-element -- admin thumbnail of an arbitrary URL (host not in next.config)
  return <img src={src} alt="" width={w} height={h} loading="lazy" className={className} style={box} />;
}
