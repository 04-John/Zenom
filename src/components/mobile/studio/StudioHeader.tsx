"use client";

import { HeaderButton, TabHeader } from "@/components/mobile/ui";
import { useStudio } from "./StudioMobileProvider";

/** Tab-home header of the studio app: rust kicker, italic title, bell (notifications) and a dark "+" (add artwork). */
export function StudioHeader({ kicker, title, addHref = "/studio/products/new" }: { kicker: string; title: string; addHref?: string }) {
  const { unread, openNotifications } = useStudio();
  return (
    <TabHeader
      kicker={
        <span className="kick" style={{ color: "#9A4A1F" }}>
          {kicker}
        </span>
      }
      title={title}
      right={
        <>
          <HeaderButton label="Notifications" icon="bell" onClick={openNotifications} badge={unread} />
          <HeaderButton label="Add artwork" icon="plus" href={addHref} dark stroke={2.2} />
        </>
      }
    />
  );
}
