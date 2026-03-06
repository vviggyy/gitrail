"use client";

interface BranchFilterProps {
  branches: string[];
  visible: Set<string>;
  onToggle: (branch: string) => void;
}

export default function BranchFilter({ branches, visible, onToggle }: BranchFilterProps) {
  if (branches.length <= 1) return null;

  return (
    <div className="bg-white/90 backdrop-blur rounded-lg p-3 border border-neutral-300 shadow-sm">
      <div className="text-xs text-neutral-400 uppercase tracking-wider mb-2 font-mono">Branches</div>
      <div className="space-y-1 max-h-48 overflow-y-auto">
        {branches.map((branch) => (
          <label
            key={branch}
            className="flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 cursor-pointer"
          >
            <input
              type="checkbox"
              checked={visible.has(branch)}
              onChange={() => onToggle(branch)}
              className="rounded border-neutral-300 bg-white text-neutral-800 focus:ring-neutral-500 focus:ring-offset-0"
            />
            <span className="font-mono text-xs truncate">{branch}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
