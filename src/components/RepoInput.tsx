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
        className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm font-mono disabled:opacity-50"
      />
      <button
        type="submit"
        disabled={loading || !value.trim()}
        className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
      >
        {loading ? "Loading..." : "Visualize"}
      </button>
    </form>
  );
}
