import type { Metadata } from "next";
import { ChapterTracker } from "@/components/motion/ChapterTracker";
import { ChapterConfirm } from "@/components/home/ChapterConfirm";
import { ChapterRooms } from "@/components/home/ChapterRooms";
import { ChapterSize } from "@/components/home/ChapterSize";
import { ChapterSketch } from "@/components/home/ChapterSketch";
import { ChapterWall } from "@/components/home/ChapterWall";
import { Hero } from "@/components/home/Hero";

export const metadata: Metadata = {
  title: "Zenom Studio | More than a portrait",
  description: "Commissioned charcoal, pencil and colour-pencil work, drawn by hand by Samuel in Kaduna.",
};

export default function HomePage() {
  return (
    <div className="relative">
      <ChapterTracker chapters={["01 SKETCH", "02 ROOMS", "03 SIZE", "04 CONFIRM", "05 YOUR WALL"]} />
      <Hero />
      <ChapterSketch />
      <ChapterRooms />
      <ChapterSize />
      <ChapterConfirm />
      <ChapterWall />
    </div>
  );
}
