import React from 'react';
import { motion } from 'framer-motion';

const Section = ({ title, children }) => (
  <div className="mb-10">
    <h2 className="text-foreground mb-3 text-xl font-semibold">{title}</h2>
    <div className="text-sm text-muted-foreground leading-relaxed space-y-3">{children}</div>
  </div>
);

export default function Terms() {
  return (
    <div className="pt-24 pb-20 min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="font-display text-4xl sm:text-5xl font-semibold mb-3">Terms &amp; Conditions</h1>
          <p className="text-muted-foreground">Last updated: March 2026</p>
        </motion.div>

        <motion.div
          className="glass rounded-2xl p-8 sm:p-12 space-y-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Section title="1. Acceptance of Terms">
            <p>
              By accessing or using The Macro Sphere (the "Platform"), you agree to be bound by these Terms and
              Conditions. If you do not agree with any part of these terms, you must not use the Platform.
            </p>
          </Section>

          <Section title="2. Educational Purpose Only">
            <p>
              The Macro Sphere is an educational and informational platform only. All content published on this
              Platform — including but not limited to research notes, market commentary, portfolio analysis,
              economic calendar data, and AI-generated outputs — is provided solely for educational and
              informational purposes.
            </p>
            <p>
              Nothing on this Platform constitutes financial advice, investment advice, trading advice, or any
              other type of advice. You should not rely on any information on this Platform as a basis for
              making financial, investment, or any other decisions.
            </p>
          </Section>

          <Section title="3. Not a Financial Services Provider">
            <p>
              The Macro Sphere is not a regulated financial services firm, investment adviser, broker-dealer,
              or fund manager. We are not authorised or regulated by the Financial Conduct Authority (FCA),
              the Securities and Exchange Commission (SEC), or any other financial regulatory body.
            </p>
            <p>
              We do not manage, invest, or handle any individual's capital, funds, or assets under any
              circumstances. No content or communication from The Macro Sphere should be interpreted as an
              offer, solicitation, or recommendation to buy, sell, or hold any financial instrument or asset.
            </p>
          </Section>

          <Section title="4. No Investment in Client Capital">
            <p>
              The Macro Sphere does not accept, manage, or invest client funds. Model portfolios and
              illustrative allocations presented on this Platform are hypothetical, for educational
              demonstration purposes only, and do not represent actual investment vehicles or managed accounts.
              Past performance of any illustrative strategy is not indicative of future results.
            </p>
          </Section>

          <Section title="5. AI-Generated Content">
            <p>
              The Platform makes use of artificial intelligence tools to generate certain content, including
              portfolio scenarios, market commentary, and analytical summaries. AI-generated content is
              inherently subject to errors, omissions, and inaccuracies. It should not be treated as
              authoritative or relied upon for any decision-making. The Macro Sphere makes no representations
              or warranties as to the accuracy, completeness, or fitness for purpose of any AI-generated
              content.
            </p>
          </Section>

          <Section title="6. Market Data & Third-Party Information">
            <p>
              Market data, economic indicators, news summaries, and other third-party information displayed
              on the Platform are sourced from publicly available data and third-party providers. This data
              may be delayed, incomplete, or inaccurate. The Macro Sphere accepts no liability for errors
              in third-party data or for any decisions made in reliance upon it.
            </p>
          </Section>

          <Section title="7. Risk Disclosure">
            <p>
              All financial markets involve risk. The value of investments can go down as well as up.
              You may receive back less than you invest. Currency fluctuations, geopolitical events, and
              macroeconomic changes can all materially affect the value of financial assets. No content
              on this Platform accounts for your personal financial situation, objectives, or risk tolerance.
            </p>
            <p>
              You should always seek independent financial advice from a qualified and authorised adviser
              before making any investment decision.
            </p>
          </Section>

          <Section title="8. Intellectual Property">
            <p>
              All content on this Platform, including research notes, written analysis, visual assets,
              branding, and design, is the intellectual property of The Macro Sphere unless otherwise stated.
              You may not reproduce, distribute, modify, or create derivative works from any content without
              prior written permission.
            </p>
          </Section>

          <Section title="9. Limitation of Liability">
            <p>
              To the fullest extent permitted by applicable law, The Macro Sphere and its operators shall
              not be liable for any direct, indirect, incidental, consequential, or punitive damages arising
              from your use of the Platform, reliance on any content, or inability to access the Platform.
              This includes, without limitation, any loss of profits, loss of data, or financial losses.
            </p>
          </Section>

          <Section title="10. Privacy & Data">
            <p>
              By using this Platform, you acknowledge that certain data (such as newsletter subscription
              information and contact form submissions) may be collected and stored. This data is used solely
              to operate the Platform and communicate with users. We do not sell or share personal data with
              third parties for marketing purposes.
            </p>
          </Section>

          <Section title="11. Changes to These Terms">
            <p>
              We reserve the right to update or modify these Terms and Conditions at any time without prior
              notice. Continued use of the Platform following any changes constitutes your acceptance of
              the revised terms. We encourage you to review these terms periodically.
            </p>
          </Section>

          <Section title="12. Governing Law">
            <p>
              These Terms and Conditions are governed by and construed in accordance with the laws of England
              and Wales. Any disputes arising in connection with these terms shall be subject to the exclusive
              jurisdiction of the courts of England and Wales.
            </p>
          </Section>

          <Section title="13. Contact">
            <p>
              If you have any questions regarding these Terms and Conditions, please contact us at{' '}
              <a href="mailto:hello@keystonemacro.com" className="text-primary hover:underline">
                hello@keystonemacro.com
              </a>.
            </p>
          </Section>
        </motion.div>
      </div>
    </div>
  );
}