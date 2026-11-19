import { PageIntro } from "@/components/motion/PageIntro";
import { AuthPanel } from "@/components/auth/AuthPanel";
import { MobileSignIn } from "@/components/mobile/MobileSignIn";
import { art } from "@/lib/catalog";

// Shared by /account (signed out), /login and /signup.
// Sign-in below 900px is the light app's screen (MobileSignIn); from 900px up,
// and for /signup at every width, the dark page below is unchanged.
export function AuthPage({ initialTab }: { initialTab: "login" | "signup" }) {
  const desktop = (
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

  if (initialTab !== "login") return desktop;

  return (
    <>
      <MobileSignIn />
      <div className="max-[900px]:hidden">{desktop}</div>
    </>
  );
}
