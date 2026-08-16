import React from 'react';
import { Link } from 'react-router-dom';

const Section = ({ title, children }) => <section className="space-y-3"><h2 className="text-xl font-semibold">{title}</h2><div className="space-y-3 text-sm leading-relaxed text-muted-foreground">{children}</div></section>;

export default function Privacy() {
  return (
    <div className="pt-24 pb-20 min-h-screen">
      <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="text-center mb-12"><h1 className="font-display text-4xl sm:text-5xl font-semibold mb-3">Privacy Notice</h1><p className="text-muted-foreground">Last updated: 16 August 2026</p></header>
        <div className="glass rounded-2xl p-8 sm:p-12 space-y-10">
          <Section title="Who we are"><p>Keystone Macro is the controller of personal information collected through this website. Contact us at <a className="text-primary hover:underline" href="mailto:hello@keystonemacro.com">hello@keystonemacro.com</a>.</p></Section>
          <Section title="Information we collect"><p>We collect account details, newsletter choices, contact messages, and subscription status. Stripe processes payment-card details; Keystone Macro does not store full card numbers.</p></Section>
          <Section title="Why we use it"><p>We use personal information to provide accounts and requested content, administer subscriptions, answer enquiries, prevent misuse, and meet legal obligations. Our lawful bases include performing a contract, consent for optional email, legitimate interests in operating a secure service, and legal obligation.</p></Section>
          <Section title="Service providers"><p>We use Base44 to host and operate the application, Stripe to process paid subscriptions, and email-delivery services to send requested messages. Providers may process information under their own privacy terms and contractual safeguards.</p></Section>
          <Section title="Retention and security"><p>We keep information only as long as needed for the purposes above, including tax, payment, dispute, and suppression-list requirements. Access is restricted and sensitive app records are protected by server-side permissions.</p></Section>
          <Section title="Your rights"><p>Depending on applicable law, you may request access, correction, deletion, restriction, portability, or object to certain processing. You may withdraw email consent at any time. You can also complain to the UK Information Commissioner’s Office.</p></Section>
          <Section title="Cookies and changes"><p>The platform may use essential storage for authentication, security, and preferences. We will update this notice when our practices materially change.</p><p>See also our <Link className="text-primary hover:underline" to="/Terms">Terms</Link> and <Link className="text-primary hover:underline" to="/Methodology">Methodology</Link>.</p></Section>
        </div>
      </article>
    </div>
  );
}
