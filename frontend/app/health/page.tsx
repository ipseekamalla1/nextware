"use client";

import { useEffect, useState } from "react";
import { checkBackendHealth } from "@/lib/api";

export default function HealthPage() {
  const [status, setStatus] = useState("Checking backend...");
  const [error, setError] = useState("");

  useEffect(() => {
    checkBackendHealth()
      .then((message) => {
        setStatus(message);
      })
      .catch((err: Error) => {
        setStatus("");
        setError(err.message);
      });
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <div className="rounded-lg border p-8">
        <h1 className="mb-4 text-2xl font-bold">
          Nextware Backend Connection
        </h1>

        {error ? (
          <p className="text-danger">
            Backend connection failed: {error}
          </p>
        ) : (
          <p className="text-success">{status}</p>
        )}
      </div>
    </main>
  );
}