"use client";

interface ChangelogViewProps {
  changelog: string[];
}

export function ChangelogView({ changelog }: ChangelogViewProps) {
  if (changelog.length === 0) return null;

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold text-foreground">
        Reviewer Changelog
      </h4>
      <ul className="space-y-1 text-sm">
        {changelog.map((entry, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
            <span className="text-muted-foreground">{entry}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
