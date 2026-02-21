import Link from "next/link";

export const metadata = {
  title: "Featured Singer & Contest Terms | Karaoke Times",
  description: "Terms and Conditions for the Karaoke Times Featured Singer Program and Singing Contests",
};

export default function FeaturedSingerTermsPage() {
  return (
    <div className="min-h-screen bg-bg-dark pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-text-muted text-sm hover:text-primary transition-colors mb-8"
        >
          <span className="material-icons-round text-base">arrow_back</span>
          Back to Home
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <span className="material-icons-round text-yellow-400 text-3xl">star</span>
          <h1 className="text-3xl font-extrabold text-white">Featured Singer &amp; Contest Program</h1>
        </div>
        <p className="text-text-muted text-sm mb-2">Terms &amp; Conditions</p>
        <p className="text-text-muted text-sm mb-10">Last updated: February 21, 2026</p>

        <div className="space-y-8 text-text-secondary text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-white mb-3">1. Program Overview</h2>
            <p className="mb-3">
              The Karaoke Times Featured Singer Program (&quot;the Program&quot;) recognizes outstanding karaoke
              performers across New York City. Participants may be featured on the Karaoke Times website, YouTube
              channel, social media platforms, and promotional materials.
            </p>
            <p>
              The Singing Contest Program (&quot;the Contest&quot;) is a competitive series that allows singers to
              compete at the borough level, city-wide level, and national level for recognition, prizes, and
              promotional opportunities.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">2. Eligibility</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>You must be at least 18 years of age to participate in the Program or Contest.</li>
              <li>You must have an active Karaoke Times account with the Singer role.</li>
              <li>You must opt in by checking the appropriate boxes in your Singer Profile settings.</li>
              <li>
                Contest participation requires attendance at designated venue events during scheduled
                competition dates.
              </li>
              <li>
                Employees, contractors, and immediate family members of Karaoke Times are not eligible for
                Contest prizes but may participate as non-competing featured singers.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">3. Content Usage &amp; Media Rights</h2>
            <p className="mb-3">
              By opting into the Featured Singer Program, you grant Karaoke Times a non-exclusive, worldwide,
              royalty-free license to use the following content for promotional purposes:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong className="text-white">Video recordings</strong> of your karaoke performances captured
                at participating venues.
              </li>
              <li>
                <strong className="text-white">Photographs</strong> taken during karaoke events, including
                candid and posed shots.
              </li>
              <li>
                <strong className="text-white">Your name, display name, and likeness</strong> as used on your
                Karaoke Times profile.
              </li>
              <li>
                <strong className="text-white">Performance details</strong> such as song titles, artist names,
                venue names, and event dates associated with your performances.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">4. YouTube &amp; Social Media Promotion</h2>
            <p className="mb-3">Your content may be used in the following ways:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                Uploaded to the official Karaoke Times YouTube channel as individual performance clips,
                highlight reels, or compilation videos.
              </li>
              <li>
                Shared on Karaoke Times social media accounts including but not limited to Instagram, TikTok,
                Facebook, and X (Twitter).
              </li>
              <li>
                Embedded on the Karaoke Times website (karaoketimes.net) including the homepage, singer
                profiles, venue pages, and promotional landing pages.
              </li>
              <li>
                Used in digital advertising and marketing campaigns to promote Karaoke Times and its partner
                venues.
              </li>
              <li>
                Included in email newsletters and push notifications sent to Karaoke Times users.
              </li>
            </ul>
            <p className="mt-3">
              Karaoke Times will make reasonable efforts to credit you by your display name when featuring your
              content. However, this is not guaranteed in all formats (such as short-form video clips or
              advertisements).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">5. Singing Contest Structure</h2>
            <p className="mb-3">The Contest is organized in the following tiers:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong className="text-white">Borough Level:</strong> Singers compete at designated venues
                within their borough (Manhattan, Brooklyn, Queens, Bronx, Staten Island). Winners from each
                borough advance to the city-wide round.
              </li>
              <li>
                <strong className="text-white">City-Wide (NYC):</strong> Borough winners compete against each
                other at a featured NYC venue. The top performers advance to the national round.
              </li>
              <li>
                <strong className="text-white">National:</strong> NYC finalists compete against winners from
                other cities (as the program expands). National events may be held at special venues or
                partnered locations.
              </li>
            </ul>
            <p className="mt-3">
              Contest dates, venues, and specific rules for each round will be announced on the Karaoke Times
              website and communicated to opted-in participants via email and in-app notifications.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">6. Contest Rules &amp; Judging</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                Each contestant performs one song per round unless otherwise specified for that round.
              </li>
              <li>
                Songs must be from the venue&apos;s available karaoke catalog. No backing tracks or
                pre-recorded vocals are permitted.
              </li>
              <li>
                Judging criteria include vocal ability, stage presence, song selection, audience engagement, and
                overall entertainment value.
              </li>
              <li>
                Judges may include KJs, venue owners, guest judges, and/or audience voting, as determined for
                each event.
              </li>
              <li>
                All judging decisions are final. Karaoke Times reserves the right to disqualify any participant
                for unsportsmanlike conduct, violation of these terms, or any behavior deemed inappropriate.
              </li>
              <li>
                Contestants must be present at the designated venue on the scheduled competition date. No
                remote or virtual participation is allowed unless specifically announced.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">7. Prizes &amp; Recognition</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong className="text-white">Featured Placement:</strong> Winners and standout performers
                will be prominently featured on the Karaoke Times homepage, social media, and YouTube channel.
              </li>
              <li>
                <strong className="text-white">Social Media Promotion:</strong> Contest winners receive
                dedicated social media posts and stories across all Karaoke Times platforms.
              </li>
              <li>
                <strong className="text-white">Prizes:</strong> Specific prizes (gift cards, event tickets,
                sponsor prizes, etc.) will be announced prior to each contest round. Prize availability and
                value may vary.
              </li>
              <li>
                <strong className="text-white">Title &amp; Badge:</strong> Winners receive a digital badge on
                their Karaoke Times profile (e.g., &quot;Borough Champion - Bronx&quot;, &quot;NYC Karaoke
                Champion&quot;).
              </li>
            </ul>
            <p className="mt-3">
              Prizes are non-transferable and cannot be exchanged for cash. Karaoke Times reserves the right to
              substitute prizes of equal or greater value. Winners are responsible for any applicable taxes on
              prizes.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">8. Your Rights &amp; Opt-Out</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                You may withdraw your consent and opt out of the Featured Singer Program and/or the Contest at
                any time by unchecking the relevant boxes in your Singer Profile settings.
              </li>
              <li>
                Upon opting out, Karaoke Times will make reasonable efforts to remove your content from future
                promotional use. However, content that has already been published (including YouTube videos,
                social media posts, and promotional materials) may remain live.
              </li>
              <li>
                You may request removal of specific published content by contacting us at{" "}
                <a href="mailto:info@go1000.ai" className="text-primary hover:underline">
                  info@go1000.ai
                </a>
                . We will review and process removal requests within 30 business days.
              </li>
              <li>
                Opting out of the Contest during an active competition round will result in forfeiture of your
                position in that round. You may re-enter in future contest cycles.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">9. Code of Conduct</h2>
            <p className="mb-3">All participants agree to:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                Treat fellow contestants, KJs, venue staff, and audience members with respect at all times.
              </li>
              <li>
                Refrain from any form of harassment, discrimination, or intimidation.
              </li>
              <li>
                Follow venue rules and guidelines, including those related to alcohol consumption and behavior.
              </li>
              <li>
                Not engage in any activity that could bring disrepute to Karaoke Times, its partner venues, or
                the karaoke community.
              </li>
            </ul>
            <p className="mt-3">
              Violation of the Code of Conduct may result in immediate disqualification from the Contest,
              removal from the Featured Singer Program, and/or suspension of your Karaoke Times account.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">10. Liability &amp; Disclaimers</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                Participation in the Program and Contest is entirely voluntary and at your own risk.
              </li>
              <li>
                Karaoke Times is not responsible for any injury, loss, or damage that may occur at
                participating venues during events or contests.
              </li>
              <li>
                Karaoke Times does not guarantee any specific outcome from being featured, including but not
                limited to increased social media following, performance opportunities, or career advancement.
              </li>
              <li>
                Karaoke Times reserves the right to modify, suspend, or cancel the Program or Contest at any
                time with or without notice.
              </li>
              <li>
                The quality and production value of featured content (videos, photos) may vary depending on
                venue conditions, equipment, and other factors outside our control.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">11. Privacy</h2>
            <p>
              Your personal information is handled in accordance with our{" "}
              <Link href="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </Link>
              . By participating in the Program or Contest, you acknowledge that your display name, performance
              details, and content may be publicly visible on the Karaoke Times website, YouTube, and social
              media platforms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">12. Agreement</h2>
            <p className="mb-3">
              By checking the &quot;I want to be a Featured Singer&quot; or &quot;I want to join singing
              contests&quot; box in your Singer Profile settings, you confirm that:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>You have read and understood these Terms &amp; Conditions in full.</li>
              <li>
                You consent to the use of your name, likeness, and performance content as described in Section 3
                and Section 4.
              </li>
              <li>You meet the eligibility requirements described in Section 2.</li>
              <li>You agree to abide by the Code of Conduct described in Section 9.</li>
              <li>
                You understand that you may opt out at any time, subject to the conditions described in
                Section 8.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">13. Changes to These Terms</h2>
            <p>
              Karaoke Times may update these Terms &amp; Conditions at any time. Participants will be notified
              of material changes via email and/or in-app notification. Continued participation after changes
              are posted constitutes acceptance of the updated terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">14. Governing Law</h2>
            <p>
              These terms are governed by the laws of the State of New York. Any disputes shall be resolved in
              the courts located in New York County, New York.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">15. Contact Us</h2>
            <p>
              If you have questions about the Featured Singer Program, the Contest, or these Terms &amp;
              Conditions, please contact us at:{" "}
              <a href="mailto:info@go1000.ai" className="text-primary hover:underline">
                info@go1000.ai
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
