"use client";

import { useState } from "react";

interface RepoInputProps {
  onSubmit: (url: string) => void;
  loading: boolean;
}

export default function RepoInput({ onSubmit, loading }: RepoInputProps) {
  const [value, setValue] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim() && !loading) {
      onSubmit(value.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 w-full max-w-xl">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="github.com/owner/repo"
        disabled={loading}
        className="flex-1 bg-white border border-neutral-300 rounded-lg px-4 py-2.5 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500 text-sm font-mono disabled:opacity-50"
      />
      <button
        type="submit"
        disabled={loading || !value.trim()}
        className="bg-neutral-800 hover:bg-neutral-700 disabled:bg-neutral-200 disabled:text-neutral-400 text-white px-5 py-2.5 rounded-lg text-sm font-medium font-mono transition-colors"
      >
        {loading ? "Loading..." : "Visualize"}
      </button>
    </form>
  );
}
