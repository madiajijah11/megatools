"use client";

interface TechBadgeProps {
  tech: string;
}

export default function TechBadge({ tech }: TechBadgeProps) {
  return (
    <span className="inline-flex items-center rounded border border-border-subtle bg-bg-page px-2 py-0.5 text-xs text-accent">
      {tech}
    </span>
  );
}
