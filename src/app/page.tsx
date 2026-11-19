import type { Metadata } from "next";
import { ChapterTracker } from "@/components/motion/ChapterTracker";
import { ChapterConfirm } from "@/components/home/ChapterConfirm";
import { ChapterRooms } from "@/components/home/ChapterRooms";
import { ChapterSize } from "@/components/home/ChapterSize";
import { ChapterSketch } from "@/components/home/ChapterSketch";
import { ChapterWall } from "@/components/home/ChapterWall";
import { Hero } from "@/components/home/Hero";
import { MobileHome } from "@/components/home/mobile/MobileHome";

export const metadata: Metadata = {
  title: "Zenom Studio | More than a portrait",
  description: "Commissioned charcoal, pencil and colour-pencil work, drawn by hand by Samuel in Kaduna.",
};

// Below 900px the minimal mobile home replaces the pinned scroll chapters;
// CSS alone decides which tree shows, so server and client markup match.
export default function HomePage() {
  return (
    <>
      <div className="min-[900px]:hidden">
        <MobileHome />
      </div>
      <div className="relative max-[900px]:hidden">
        <ChapterTracker chapters={["01 SKETCH", "02 ROOMS", "03 SIZE", "04 CONFIRM", "05 YOUR WALL"]} />
        <Hero />
        <ChapterSketch />
        <ChapterRooms />
        <ChapterSize />
        <ChapterConfirm />
        <ChapterWall />
      </div>
    </>
  );
}
