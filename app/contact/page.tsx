import { ContactForm } from "./ContactForm";

export const metadata = {
  title: "Contact — Karaoke Times",
  description:
    "Send us a message — questions, press inquiries, venue submissions, or anything else karaoke-related.",
};

export default function ContactPage() {
  return (
    <main className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-3">
            Get in <span className="text-primary neon-glow-green">Touch</span>
          </h1>
          <p className="text-text-secondary text-base sm:text-lg">
            Have a question, press inquiry, or a venue to add? Send us a message
            and we&apos;ll get back to you.
          </p>
        </div>

        <ContactForm />
      </div>
    </main>
  );
}
