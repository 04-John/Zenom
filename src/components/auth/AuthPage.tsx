import { PageIntro } from "@/components/motion/PageIntro";
import { AuthPanel } from "@/components/auth/AuthPanel";
import { art } from "@/lib/catalog";

// Shared by /account (signed out), /login and /signup.
export function AuthPage({ initialTab }: { initialTab: "login" | "signup" }) {
  return (
    <>
      <PageIntro
        kicker="MY ACCOUNT"
        title="Your studio."
        blurb="Your commissions, in one place."
        bg="#171310"
        ink="#EFE9DF"
        images={["w02", "w04", "w03"].map(art)}
      />
      <div className="bg-night">
        <AuthPanel initialTab={initialTab} />
      </div>
    </>
  );
}
