import Link from "next/link";

export const metadata = {
  title: "Privacy Policy | Karaoke Times",
  description: "Privacy Policy for Karaoke Times NYC",
};

export default function PrivacyPolicyPage() {
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

        <h1 className="text-3xl font-extrabold text-white mb-2">Privacy Policy</h1>
        <p className="text-text-muted text-sm mb-10">Last updated: February 13, 2026</p>

        <div className="space-y-8 text-text-secondary text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-white mb-3">1. Introduction</h2>
            <p>
              Karaoke Times (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) operates the website at
              karaoketimes.net and related services (the &quot;Service&quot;). This Privacy Policy
              explains how we collect, use, disclose, and safeguard your information when you use our Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">2. Information We Collect</h2>
            <p className="mb-3">We may collect the following types of information:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong className="text-white">Account Information:</strong> When you create an account, we
                collect your name, email address, and profile picture (if you sign in via Google or other OAuth
                providers).
              </li>
              <li>
                <strong className="text-white">Venue & Event Data:</strong> Information you submit about karaoke
                venues, events, song requests, and queue entries.
              </li>
              <li>
                <strong className="text-white">Usage Data:</strong> We automatically collect information about
                how you interact with the Service, including pages visited, features used, and device information.
              </li>
              <li>
                <strong className="text-white">Uploaded Content:</strong> Images or files you upload, such as
                style reference images for flyer generation.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">3. How We Use Your Information</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>To provide, maintain, and improve the Service</li>
              <li>To manage your account and provide customer support</li>
              <li>To process song requests and manage karaoke queues</li>
              <li>To generate promotional flyers using AI-powered tools</li>
              <li>To send notifications related to your activity (e.g., queue updates, booking confirmations)</li>
              <li>To enforce our Terms of Service and protect against misuse</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">4. Third-Party Services</h2>
            <p className="mb-3">We use the following third-party services:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong className="text-white">Supabase:</strong> For authentication, database, and file storage.
                Your data is stored securely on Supabase infrastructure.
              </li>
              <li>
                <strong className="text-white">Google OAuth:</strong> If you sign in with Google, we receive your
                name, email, and profile picture from Google. We do not access your Google contacts or other data.
              </li>
              <li>
                <strong className="text-white">Vercel:</strong> For hosting and serving the application.
              </li>
              <li>
                <strong className="text-white">AI Services:</strong> For flyer generation, we may send event
                details to AI services. No personal user data is included in these requests.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">5. Data Sharing</h2>
            <p>
              We do not sell, rent, or trade your personal information to third parties. We may share information
              only in the following circumstances:
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-3">
              <li>With your consent or at your direction</li>
              <li>With service providers who assist in operating the Service (as described above)</li>
              <li>To comply with legal obligations or respond to lawful requests</li>
              <li>To protect the rights, safety, or property of Karaoke Times, our users, or the public</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">6. Data Security</h2>
            <p>
              We implement reasonable security measures to protect your information, including encrypted
              connections (HTTPS), secure authentication tokens, and row-level security on our database.
              However, no method of transmission over the Internet is 100% secure, and we cannot guarantee
              absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">7. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-5 space-y-2 mt-3">
              <li>Access the personal information we hold about you</li>
              <li>Request correction of inaccurate information</li>
              <li>Request deletion of your account and associated data</li>
              <li>Opt out of non-essential communications</li>
            </ul>
            <p className="mt-3">
              To exercise these rights, please contact us at the email address below.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">8. Cookies & Local Storage</h2>
            <p>
              We use browser local storage and cookies to maintain your authentication session and store
              preferences. These are essential for the Service to function and cannot be disabled while using
              the app.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">9. Children&apos;s Privacy</h2>
            <p>
              The Service is not intended for users under 18 years of age. We do not knowingly collect
              personal information from children. If you believe a child has provided us with personal
              information, please contact us so we can remove it.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">10. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of significant changes
              by posting the updated policy on this page with a revised &quot;Last updated&quot; date.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">11. Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy, please contact us at:{" "}
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
