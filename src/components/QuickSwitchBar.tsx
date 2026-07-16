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
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-all duration-200 ${
              isActive
                ? "bg-accent/10 text-accent"
                : "text-secondary hover:bg-gray-100 hover:text-primary"
            }`}
          >
            <span className="text-base">{tool.emoji}</span>
            <span className="hidden lg:inline">{tool.shortTitle}</span>
          </Link>
        );
      })}
    </nav>
  );
}
