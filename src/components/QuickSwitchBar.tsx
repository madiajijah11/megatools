"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { TOOLS } from "@/lib/tool-data";

export default function QuickSwitchBar() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1">
      {TOOLS.map((tool) => {
        const isActive = pathname === tool.href;
        return (
          <Link
            key={tool.id}
            href={tool.href}
            className={`rounded px-2.5 py-1.5 text-sm transition-all duration-200 ${
              isActive
                ? "bg-accent-soft text-accent"
                : "text-text-secondary hover:bg-accent-soft hover:text-accent"
            }`}
          >
            <span className="hidden lg:inline">{tool.shortTitle.toLowerCase().replace(/\s+/g, "-")}</span>
          </Link>
        );
      })}
    </nav>
  );
}
