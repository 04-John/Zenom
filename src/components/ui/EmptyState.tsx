import { ReactNode } from "react";

export function EmptyState({
  title,
  action,
}: {
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <p className="font-display text-2xl text-navy">{title}</p>
      {action}
    </div>
  );
}
