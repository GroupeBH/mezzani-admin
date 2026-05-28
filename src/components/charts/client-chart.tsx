"use client";

import { useEffect, useState } from "react";

export function ClientChart({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-full w-full rounded-lg bg-ink/5" />;
  }

  return <>{children}</>;
}
