import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageBackground from "@/components/layout/PageBackground";
import KeystoneLogo from "@/components/brand/KeystoneLogo";
import { Button } from "@/components/ui/button";

function getToken() {
  const hashToken = new URLSearchParams(window.location.hash.slice(1)).get("token");
  if (hashToken) return hashToken;
  return new URLSearchParams(window.location.search).get("token");
}

export default function Unsubscribe() {
  const [status, setStatus] = useState("checking");

  const unsubscribe = useCallback(async () => {
    setStatus("checking");
    const token = getToken();
    if (!token) {
      setStatus("invalid");
      return;
    }
    try {
      const res = await fetch("/api/app-emails/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      if (res.ok) setStatus("success");
      else if (res.status === 400) setStatus("invalid");
      else setStatus("error");
    } catch {
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    unsubscribe();
  }, [unsubscribe]);

  return (
    <div className="relative min-h-screen flex items-center justify-center px-5 py-16">
      <PageBackground />
      <div className="relative z-10 w-full max-w-lg">
        <div className="flex justify-center mb-9">
          <KeystoneLogo markClassName="h-8 w-11 text-primary" />
        </div>

        <div className="rounded-2xl border border-border bg-card px-7 py-10 sm:px-10 sm:py-12 text-center">
          {status === "checking" && (
            <>
              <div className="mx-auto mb-6 h-9 w-9 rounded-full border-2 border-muted-foreground/20 border-t-primary animate-spin" />
              <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
                Updating your preferences
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                One moment while we remove your address from the marketing list.
              </p>
            </>
          )}

          {status === "success" && (
            <>
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.3em] text-primary">
                Confirmed
              </p>
              <h1 className="mt-4 font-display text-2xl font-semibold tracking-tight text-foreground">
                You are unsubscribed
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Your address has been removed from Keystone Macro marketing emails and you will not
                receive further newsletters or promotions.
              </p>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                Transactional emails such as receipts, invoices and password resets will still arrive.
              </p>
              <Button asChild className="mt-8">
                <Link to="/">Return to Keystone Macro</Link>
              </Button>
            </>
          )}

          {status === "invalid" && (
            <>
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                Link not recognised
              </p>
              <h1 className="mt-4 font-display text-2xl font-semibold tracking-tight text-foreground">
                This unsubscribe link is not valid
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                The link may have expired or been altered in transit. Open the most recent email from
                Keystone Macro and use the unsubscribe link at the foot of it.
              </p>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                Alternatively write to hello@keystonemacro.com and we will remove you by hand.
              </p>
            </>
          )}

          {status === "error" && (
            <>
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.3em] text-destructive">
                Not completed
              </p>
              <h1 className="mt-4 font-display text-2xl font-semibold tracking-tight text-foreground">
                We could not process that
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                The request did not go through. Check your connection and try again.
              </p>
              <Button className="mt-8" onClick={unsubscribe}>
                Try again
              </Button>
            </>
          )}
        </div>

        <p className="mt-8 text-center text-[11px] leading-relaxed text-muted-foreground/80">
          Keystone Macro Research. This page does not collect or store any information.
        </p>
      </div>
    </div>
  );
}