import { createClientFromRequest } from 'npm:@base44/sdk@0.8.57';
import { limitRequests } from '../../shared/requestSecurity.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(error => {
      if ([401, 403].includes(error.status ?? error.response?.status)) return null;
      throw error;
    });
    if (!user) return Response.json({ error: 'Sign in required.' }, { status: 401 });
    if (user.role !== 'admin' || user.id !== '69b9efd1e34861737a4d8958' || user.email !== 'kaicard05@gmail.com') return Response.json({ error: 'Only the owner can request these self-addressed samples.' }, { status: 403 });
    const body = await req.json().catch(() => null);
    if (body?.morning_preview === true) {
      if (body.confirm_test_only !== true || Object.keys(body).some(key => !['confirm_test_only', 'morning_preview', 'dry_run'].includes(key))) return Response.json({ error: 'Only an owner-addressed morning preview is allowed.' }, { status: 400 });
      const editions = await base44.entities.NewsletterEdition.filter({ slug: 'morning-2026-11-02', status: 'published' }, { sort: '-published_at', limit: 1 });
      const edition = editions.items[0];
      if (!edition) return Response.json({ error: 'This morning\'s published edition was not found. Nothing sent.' }, { status: 404 });
      const chunks = String(edition.body || '').split(/\n\s*---\s*\n/).filter(chunk => chunk.trim());
      if (chunks.length !== 6) return Response.json({ error: 'Expected the six original morning sections. Nothing sent.' }, { status: 400 });
      const variables = { headline: edition.title, issue_date: 'Monday, 2 November 2026', market_summary: edition.market_summary, bank_photo_source: 'https://commons.wikimedia.org/wiki/File:Bank_of_England_Building,_London,_UK_-_Diliff.jpg', bank_photo_licence: 'https://creativecommons.org/licenses/by-sa/3.0/', brazil_photo_source: 'https://commons.wikimedia.org/wiki/File:Banco_Central_do_Brasil.jpg', brazil_photo_licence: 'https://creativecommons.org/licenses/by-sa/2.0/' };
      const names = ['one', 'two', 'three', 'four', 'five', 'six'];
      for (let index = 0; index < chunks.length; index++) {
        const match = chunks[index].trim().match(/^##\s+([^:]+):\s*([^\n]+)\n+([\s\S]+)$/);
        if (!match) return Response.json({ error: 'Cannot read an original section. Nothing sent.' }, { status: 400 });
        const paragraphs = match[3].split(/\n\n>\s*/);
        variables['label_' + names[index]] = match[1];
        variables['title_' + names[index]] = match[2];
        variables['body_' + names[index]] = paragraphs[0].trim();
        variables['watch_' + names[index]] = paragraphs.slice(1).join(' ').trim();
      }
      if (body.dry_run === true) return Response.json({ dry_run: true, subject: edition.title, sections: chunks.length, images: 2, recipients: 1 });
      const limited = await limitRequests(base44, user, 'morning-editorial-preview', { minute: 1, day: 3, exemptAdmins: false });
      if (limited) return limited;
      const result = await base44.asServiceRole.integrations.Core.SendEmail({ to: 'kaicard05@gmail.com', from_name: 'Keystone Macro', template_name: 'MorningEditorialPreview', variables });
      if (result?.success === false) return Response.json({ error: result.message || result.reason || 'Send refused. Nothing sent.' }, { status: 400 });
      return Response.json({ accepted: true, recipient: 'kaicard05@gmail.com', subject: edition.title, images: 2, recipients: 1 });
    }
    if (!body || body.confirm_test_only !== true || Object.keys(body).some(key => !['confirm_test_only', 'types'].includes(key))) return Response.json({ error: 'Confirm a test-only send. Recipients and content cannot be supplied.' }, { status: 400 });
    const account = (test_title, label, headline, intro, detail_label, detail_value, detail_body, closing, cta_label) => ({ type: test_title, template: 'TestEditorialAccount', category: 'transactional', variables: { test_title, label, headline, intro, detail_label, detail_value, detail_body, closing, cta_label } });
    const newsletter = (test_title, label, headline, intro, cta_intro, cta_label) => ({ type: test_title, template: 'TestEditorialNewsletter', category: 'marketing', variables: {
      test_title, label, headline, intro, cta_intro, cta_label,
      story_one_title: 'Inflation sets the tone', story_one_body: 'In this fictional edition, investors are weighing a softer inflation reading against steady activity. The question is whether easier price pressures are enough to change the expected path of interest rates. A single release would not settle that debate.',
      story_two_title: 'Looking beyond the index', story_two_body: 'This sample considers a modest rise in the headline index alongside mixed sector performance. Broader participation would offer stronger support than gains concentrated in a small number of companies. Earnings and cash flow remain the useful checks.',
      story_three_title: 'Policy expectations meet market pricing', story_three_body: 'In this illustrative scenario, short-dated yields ease while the currency holds its ground. That combination would point to a measured policy reassessment rather than a wholesale shift in the growth outlook.',
      story_four_title: 'The next test for the view', story_four_body: 'The sample watchlist centres on inflation, employment and central bank communication. A renewed rise in price pressures would challenge the benign interpretation. All events and figures in this email are design placeholders.'
    } });
    const samples = [
      { type: 'Premium welcome', template: 'TestEditorialWelcome', category: 'marketing', variables: { test_title: 'Premium welcome', label: 'PREMIUM MEMBERSHIP', headline: 'Welcome to Premium, Kai.', intro: 'Your Keystone Macro account is now a full premium membership, active immediately. Nothing further is needed from you. This wording is a design sample only.', point_one_title: 'Daily Editions', point_one_body: 'Morning and evening briefs, every market day.', point_two_title: 'Subscriber Archive', point_two_body: 'Every published edition, on demand.', point_three_title: 'Premium Research', point_three_body: 'Full research notes and analysis.', cta_intro: 'Your access starts now. Open the archive to see everything your membership includes. No access was changed by this test.', cta_label: 'Open the subscriber archive' } },
      { type: 'Free weekly welcome', template: 'TestEditorialWelcome', category: 'marketing', variables: { test_title: 'Free weekly welcome', label: 'KEYSTONE MACRO WEEKLY', headline: 'You are on the list, Kai.', intro: 'Welcome to the free weekly digest. A considered summary of the week in markets, delivered each Friday. This is sample copy, not a new subscription.', point_one_title: 'The week in context', point_one_body: 'The developments that mattered across macro and markets.', point_two_title: 'A clear view', point_two_body: 'Independent analysis, practical implications and the risks to the view.', point_three_title: 'What comes next', point_three_body: 'The releases and policy decisions worth watching in the week ahead.', cta_intro: 'Read more about the weekly digest and manage your preferences on the website.', cta_label: 'Explore the newsletter' } },
      newsletter('Premium morning brief', 'MORNING BRIEF', 'A measured start to the session.', 'The overnight picture, the cross-asset context and the catalysts ahead. Fictional content for the morning layout.', 'Continue to the subscriber archive to explore the morning edition format.', 'Read the morning brief'),
      newsletter('Premium evening wrap', 'EVENING WRAP', 'What mattered at the close.', 'The session in perspective, the drivers behind the moves and the risks to watch tomorrow. Fictional content for the evening layout.', 'Continue to the subscriber archive to explore the evening edition format.', 'Read the evening wrap'),
      newsletter('Free weekly newsletter', 'WEEKLY DIGEST', 'The week in perspective.', 'Four themes to make sense of the week, followed by the events that could shape the next one. Fictional content for the free weekly layout.', 'Explore more analysis, the daily editions and premium research on the website.', 'Explore Keystone Macro'),
      account('Premium cancellation confirmation', 'MEMBERSHIP UPDATE', 'Your cancellation is scheduled.', 'This sample shows how a premium cancellation confirmation could look. No cancellation has actually been made.', 'SAMPLE ACCESS END DATE', '30 November 2026', 'Premium access would remain available until the end of the billing period. This is a fictional date for layout review.', 'If this were a real confirmation, you could review the membership details from your account.', 'Open Keystone Macro'),
      account('Free unsubscribe confirmation', 'SUBSCRIPTION UPDATE', 'You have unsubscribed.', 'This sample shows the free weekly unsubscribe confirmation. Your real subscription has not changed.', 'SAMPLE CONFIRMATION', 'Weekly emails stopped', 'In a real confirmation, this would confirm that no further free editions would be sent.', 'You could return to the newsletter page if you wanted to subscribe again.', 'Open Keystone Macro'),
      account('Contact notification to site owner', 'CONTACT / OWNER NOTIFICATION', 'A new message has arrived.', 'This is the internal email sent to the site operator, not a visitor acknowledgement. No contact form has been submitted.', 'SAMPLE ENQUIRY', 'Research collaboration', 'Sample visitor message: I would like to discuss a potential research collaboration and learn more about your work.', 'Real notifications would include the sender details and message. This test contains no real visitor information.', 'Open Keystone Macro'),
      account('Forgot password', 'ACCOUNT SECURITY', 'Reset your password.', 'A password reset was requested for your Keystone Macro account. This is sample wording only; no reset has been requested.', 'TEST RESET LINK', 'Inactive preview', 'The button below opens the website only. It contains no password reset token and cannot change your password.', 'If you did not request a real password reset, you would be able to ignore that email.', 'Preview reset button'),
      account('Email verification', 'VERIFY YOUR EMAIL', 'Confirm your email address.', 'Use the verification code to complete your registration. This is a visual test, not a real verification request.', 'SAMPLE VERIFICATION CODE', '000000', 'This code is deliberately inactive. It cannot verify an account or be used to sign in.', 'In a real verification email, the recipient would enter their code on the registration page.', 'Open Keystone Macro'),
      account('User invitation', 'ACCOUNT INVITATION', 'You are invited.', 'You have been invited to join Keystone Macro. This is a sample invitation only; no user has been invited.', 'SAMPLE ACCESS', 'An invitation to Keystone Macro', 'A real invitation would include a secure acceptance link. This preview contains no invitation token.', 'The preview button simply opens the website without accepting an invitation.', 'Preview invitation button'),
      account('Access approved', 'ACCOUNT ACCESS', 'Your access is approved.', 'Your request to access Keystone Macro has been approved. This is sample copy only; no permissions have changed.', 'SAMPLE ACCOUNT STATUS', 'Access approved', 'A real approval email would guide the recipient back to the website to sign in.', 'This test does not grant access, change roles or sign you in.', 'Open Keystone Macro')
    ];
    const selected = body.types === undefined ? samples : Array.isArray(body.types) && body.types.length > 0 && body.types.length <= samples.length && new Set(body.types).size === body.types.length && body.types.every(type => samples.some(sample => sample.type === type)) ? samples.filter(sample => body.types.includes(sample.type)) : null;
    if (!selected) return Response.json({ error: 'Choose only recognised sample types, without duplicates.' }, { status: 400 });
    const limited = await limitRequests(base44, user, 'editorial-email-test-batch', { minute: 1, day: 2, exemptAdmins: false });
    if (limited) return limited;
    const results = [];
    for (let start = 0; start < selected.length; start += 3) {
      const batch = await Promise.allSettled(selected.slice(start, start + 3).map(async sample => {
        const result = await base44.asServiceRole.integrations.Core.SendEmail({ to: 'kaicard05@gmail.com', from_name: 'Keystone Macro', template_name: sample.template, variables: sample.variables, category: sample.category });
        return { type: sample.type, accepted: result?.success !== false, reason: result?.success === false ? result.reason || result.message || 'Send refused' : null };
      }));
      batch.forEach((result, index) => results.push(result.status === 'fulfilled' ? result.value : { type: selected[start + index].type, accepted: false, reason: String(result.reason?.message || result.reason) }));
    }
    return Response.json({ test_only: true, recipient: 'kaicard05@gmail.com', requested: selected.length, accepted: results.filter(result => result.accepted).length, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}