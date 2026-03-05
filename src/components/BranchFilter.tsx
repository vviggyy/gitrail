"use client";

interface BranchFilterProps {
  branches: string[];
  visible: Set<string>;
  onToggle: (branch: string) => void;
}

export default function BranchFilter({ branches, visible, onToggle }: BranchFilterProps) {
  if (branches.length <= 1) return null;

  return (
    <div className="bg-gray-900/90 backdrop-blur rounded-lg p-3 border border-gray-800">
      <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">Branches</div>
      <div className="space-y-1 max-h-48 overflow-y-auto">
        {branches.map((branch) => (
          <label
            key={branch}
            className="flex items-center gap-2 text-sm text-gray-300 hover:text-white cursor-pointer"
          >
            <input
              type="checkbox"
              checked={visible.has(branch)}
              onChange={() => onToggle(branch)}
              className="rounded border-gray-600 bg-gray-800 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
            />
            <span className="font-mono text-xs truncate">{branch}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
