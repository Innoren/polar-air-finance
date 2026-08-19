"use client";

import { useCallback, useState } from "react";
import { usePlaidLink } from "react-plaid-link";
import { Button } from "@/components/ui/button";

export function PlaidConnect() {
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSuccess = useCallback(async (publicToken: string | null) => {
    if (!publicToken) return;
    const res = await fetch("/api/plaid/exchange", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ publicToken }),
    });
    if (!res.ok) {
      setError("Could not finish bank connection.");
      return;
    }
    window.location.reload();
  }, []);

  const { open, ready } = usePlaidLink({
    token,
    onSuccess,
  });

  async function start() {
    setError(null);
    const res = await fetch("/api/plaid/link-token", { method: "POST" });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Could not start Plaid Link.");
      return;
    }
    setToken(data.link_token);
  }

  return (
    <div className="space-y-2">
      {token ? (
        <Button type="button" onClick={() => open()} disabled={!ready}>
          Continue in Plaid
        </Button>
      ) : (
        <Button type="button" onClick={start}>
          Connect bank
        </Button>
      )}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
