import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "@/styles/globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { LenisProvider } from "@/components/motion/LenisProvider";
import { CartProvider } from "@/context/CartContext";
import { ToastProvider } from "@/components/ui/Toast";

const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-display",
});
const sans = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Zenom Studio | Art for People, Art for Spaces",
  description:
    "Commissioned charcoal and pencil portraits, made to order. Zenom Studio — Art for People, Art for Spaces.",
  metadataBase: new URL("https://zenom-studio.netlify.app"),
  openGraph: {
    title: "Zenom Studio",
    description: "Art for People, Art for Spaces.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body>
        <ToastProvider>
          <CartProvider>
            <LenisProvider>
              <Header />
              <main className="pt-20">{children}</main>
              <Footer />
            </LenisProvider>
          </CartProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
