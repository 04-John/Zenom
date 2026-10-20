import Link from "next/link";
import { ZenomMark } from "@/components/brand/ZenomMark";
import { linkPrimary } from "./studio/buttonStyles";

export const metadata = { title: "Page not found | Zenom Studio" };

export default function NotFound() {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-6 pb-24 pt-[140px] text-center">
      <span aria-hidden className="mb-6">
        <ZenomMark size={72} title="" />
      </span>
      <p className="kicker">404</p>
      <h1 className="h-page mt-4">Page not found.</h1>
      <p className="mt-6 max-w-sm text-[15px] leading-[1.7] text-ink-2">
        The page you were looking for has moved, or never hung on this wall.
      </p>
      <Link href="/" className={`${linkPrimary} mt-8`}>
        Back home
      </Link>
    </div>
  );
}
