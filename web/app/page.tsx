"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Static export cannot do server-side redirects; hop to the default locale on the client.
export default function Root() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/pt/");
  }, [router]);
  return (
    <main className="flex min-h-screen items-center justify-center">
      <a href="/pt/" className="text-teal-700 underline">
        LeveCare — continuar em português
      </a>
    </main>
  );
}
