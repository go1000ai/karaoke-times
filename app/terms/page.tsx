import Link from "next/link";

export const metadata = {
  title: "Terms of Service | Karaoke Times",
  description: "Terms of Service for Karaoke Times NYC",
};

export default function TermsOfServicePage() {
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

        <h1 className="text-3xl font-extrabold text-white mb-2">Terms of Service</h1>
        <p className="text-text-muted text-sm mb-10">Last updated: February 13, 2026</p>

        <div className="space-y-8 text-text-secondary text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-white mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing or using Karaoke Times (&quot;the Service&quot;), operated at
              karaoke-times.vercel.app, you agree to be bound by these Terms of Service. If you do not
              agree to these terms, please do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">2. Description of Service</h2>
            <p>
              Karaoke Times is a platform that connects karaoke singers with venues and KJs (Karaoke
              Jockeys) in New York City. The Service includes venue discovery, event listings, song queue
              management, booking tools, promotional flyer generation, and related features.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">3. User Accounts</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>You must provide accurate and complete information when creating an account.</li>
              <li>You are responsible for maintaining the security of your account credentials.</li>
              <li>You must be at least 18 years old to create an account.</li>
              <li>
                You are responsible for all activity that occurs under your account. Notify us immediately
                if you suspect unauthorized access.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">4. User Roles</h2>
            <p className="mb-3">The Service provides different roles with different capabilities:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong className="text-white">Singers:</strong> Can browse venues, request songs, join
                queues, leave reviews, and save favorites.
              </li>
              <li>
                <strong className="text-white">KJs (Karaoke Jockeys):</strong> Can manage song queues,
                accept bookings, generate flyers, and manage their public profile.
              </li>
              <li>
                <strong className="text-white">Venue Owners:</strong> Can list venues, manage events, invite
                KJs, generate flyers, and manage venue settings.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">5. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-5 space-y-2 mt-3">
              <li>Use the Service for any unlawful purpose</li>
              <li>Submit false or misleading venue or event information</li>
              <li>Harass, abuse, or harm other users, KJs, or venue staff</li>
              <li>Attempt to interfere with or disrupt the Service</li>
              <li>Scrape, crawl, or use automated tools to access the Service without permission</li>
              <li>Impersonate another person or entity</li>
              <li>Upload malicious content, viruses, or harmful code</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">6. Content & Intellectual Property</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                You retain ownership of content you submit (reviews, venue listings, uploaded images).
              </li>
              <li>
                By submitting content, you grant Karaoke Times a non-exclusive, royalty-free license to
                display and distribute that content within the Service.
              </li>
              <li>
                AI-generated flyers are created for your use. You may use them for promoting your events.
                Karaoke Times does not claim ownership of generated flyers.
              </li>
              <li>
                The Karaoke Times name, logo, and branding are our intellectual property and may not be
                used without permission.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">7. Venue & Event Listings</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                Venue owners and KJs are responsible for the accuracy of their listings and event
                information.
              </li>
              <li>
                Karaoke Times does not guarantee the accuracy of user-submitted venue or event data.
              </li>
              <li>
                We reserve the right to remove listings that are inaccurate, spam, or violate these terms.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">8. Reviews & Ratings</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Reviews must be honest and based on genuine experiences.</li>
              <li>
                We reserve the right to remove reviews that are abusive, fraudulent, or violate these
                terms.
              </li>
              <li>Venue owners and KJs may not incentivize or coerce users into leaving reviews.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">9. Disclaimers</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                The Service is provided &quot;as is&quot; without warranties of any kind, express or implied.
              </li>
              <li>
                We do not guarantee uninterrupted or error-free access to the Service.
              </li>
              <li>
                Karaoke Times is not responsible for interactions between users, KJs, and venues that occur
                outside the platform.
              </li>
              <li>
                AI-generated flyers are provided as a creative tool. We do not guarantee specific design
                outcomes.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">10. Limitation of Liability</h2>
            <p>
              To the fullest extent permitted by law, Karaoke Times shall not be liable for any indirect,
              incidental, special, or consequential damages arising from your use of the Service. Our total
              liability shall not exceed the amount you paid to use the Service (if any) in the twelve months
              preceding the claim.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">11. Account Termination</h2>
            <p>
              We reserve the right to suspend or terminate your account at any time for violations of these
              terms or for any other reason at our discretion. You may delete your account at any time by
              contacting us.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">12. Changes to Terms</h2>
            <p>
              We may modify these Terms of Service at any time. Continued use of the Service after changes
              are posted constitutes acceptance of the updated terms. We will make reasonable efforts to
              notify users of significant changes.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">13. Governing Law</h2>
            <p>
              These terms are governed by the laws of the State of New York. Any disputes shall be resolved
              in the courts located in New York County, New York.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">14. Contact Us</h2>
            <p>
              If you have questions about these Terms of Service, please contact us at:{" "}
              <a
                href="mailto:info@go1000.ai"
                className="text-primary hover:underline"
              >
                info@go1000.ai
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
