import type { Metadata, Viewport } from "next";
import "@/styles/fonts.css";
import "@/styles/globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { LenisProvider } from "@/components/motion/LenisProvider";
import { PageTransition } from "@/components/motion/PageTransition";
import { CustomCursor } from "@/components/motion/CustomCursor";
import { IntroLoader } from "@/components/motion/IntroLoader";
import { FilmGrain } from "@/components/motion/FilmGrain";
import { ScrollProgress } from "@/components/motion/ScrollProgress";
import { AddToBagFly } from "@/components/cart/AddToBagFly";
import { CartProvider } from "@/context/CartContext";
import { ToastProvider } from "@/components/ui/Toast";

export const metadata: Metadata = {
  title: "Zenom Studio — More than a portrait",
  description:
    "Commissioned charcoal, pencil and colour-pencil work, drawn by hand by Samuel in Kaduna. Portraits and abstract art, made to order.",
  metadataBase: new URL("https://zenom-studio.netlify.app"),
  icons: { icon: "/brand/icon.svg", apple: "/brand/apple-touch-icon.png" },
  openGraph: {
    images: [{ url: "/brand/og-badge.png", width: 1200, height: 630, alt: "Zenom Studio — More than a portrait" }],
    title: "Zenom Studio — More than a portrait",
    description: "Commissioned charcoal, pencil and colour-pencil work, drawn by hand by Samuel.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#12100E",
};

// Runs before first paint: returning visitors (same session) skip the intro loader.
const introGate = `try{if(sessionStorage.getItem('zenom.intro')==='1')document.documentElement.setAttribute('data-intro-seen','')}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning: the inline script below sets data-intro-seen before hydration.
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Fonts are self-hosted (src/styles/fonts.css); preload the ones above the fold. */}
        {["instrument-serif-latin-400-italic", "instrument-sans-latin-400-normal", "instrument-sans-latin-500-normal", "jetbrains-mono-latin-400-normal"].map((f) => (
          <link key={f} rel="preload" as="font" type="font/woff2" href={`/fonts/${f}.woff2`} crossOrigin="anonymous" />
        ))}
        <script dangerouslySetInnerHTML={{ __html: introGate }} />
      </head>
      <body>
        <ToastProvider>
          <CartProvider>
            <LenisProvider>
              <IntroLoader />
              <FilmGrain />
              <ScrollProgress />
              <CustomCursor />
              <AddToBagFly />
              <Header />
              <PageTransition>{children}</PageTransition>
              <Footer />
            </LenisProvider>
          </CartProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
