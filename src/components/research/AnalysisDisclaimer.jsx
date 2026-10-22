import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';

const CLAUSES = [
  'This briefing is published by Keystone Macro for information and general education only. It is not investment, legal, tax or accounting advice, and it is not a recommendation, offer or solicitation to buy, sell or hold any security, instrument or strategy.',
  'It does not consider the objectives, financial situation, tax position or needs of any particular person. You should not act, or refrain from acting, on the basis of this material without first obtaining independent professional advice.',
  'This briefing is drafted with the assistance of artificial intelligence and checked against its cited source. AI systems can produce output that is inaccurate, incomplete or out of date, and figures, quotes or characterisations may contain errors. Verify material facts at the primary source before relying on them.',
  'Original reporting belongs to the cited publisher. Keystone Macro claims no ownership of, and accepts no responsibility for, third-party content.',
  'Market data and prices are indicative, may be delayed or inaccurate, and are subject to change without notice. Past performance is not a reliable indicator of future results. Investments can fall as well as rise and you may get back less than you invested.',
  'Any scenarios, probabilities or views expressed are the author\'s judgement as at the date of publication. They are not forecasts and may change without notice.',
  'To the maximum extent permitted by law, Keystone Macro and its contributors accept no liability for any loss or damage arising from the use of, or reliance on, this material.',
];

export default function AnalysisDisclaimer() {
  return (
    <section className="relative mt-10 overflow-hidden rounded-xl border border-border/30 bg-card/30 backdrop-blur-sm">
      <div className="h-px w-full bg-gradient-to-r from-border/60 via-border/20 to-transparent" />
      <div className="p-6 sm:p-8">
        <div className="mb-4 flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted/30">
            <ShieldAlert className="h-3.5 w-3.5 text-muted-foreground/70" />
          </div>
          <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">
            Important information
          </h2>
        </div>
        <div className="space-y-3">
          {CLAUSES.map((clause, index) => (
            <p key={index} className="text-[11px] leading-relaxed text-muted-foreground/50">
              {clause}
            </p>
          ))}
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-border/20 pt-4">
          <p className="text-[10px] font-medium text-muted-foreground/45">
            Keystone Macro · Informational purposes only · Not financial advice
          </p>
          <Link to="/Terms" className="text-[10px] font-medium text-muted-foreground/45 underline decoration-border/40 underline-offset-2 transition-colors hover:text-foreground">
            Terms of use
          </Link>
          <Link to="/Privacy" className="text-[10px] font-medium text-muted-foreground/45 underline decoration-border/40 underline-offset-2 transition-colors hover:text-foreground">
            Privacy policy
          </Link>
        </div>
      </div>
    </section>
  );
}