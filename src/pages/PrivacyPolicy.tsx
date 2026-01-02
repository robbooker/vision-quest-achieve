import { Link } from 'react-router-dom';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between">
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
          <ThemeToggle />
        </div>
      </header>

      {/* Content */}
      <main className="container max-w-3xl py-12">
        <article className="prose prose-neutral dark:prose-invert max-w-none">
          <h1 className="text-3xl font-bold text-foreground mb-2">Privacy Policy</h1>
          <p className="text-muted-foreground mb-8">Last updated: January 2, 2026</p>

          <section className="bg-primary/5 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-foreground mt-0 mb-4">Plain-English Summary</h2>
            <ul className="space-y-2 text-foreground list-disc pl-5 mb-0">
              <li>We collect the minimum information needed to run the site.</li>
              <li>We use cookies only to keep you logged in if you choose.</li>
              <li>We do not sell, rent, or share your personal data.</li>
              <li>We do not run ads or track you across other websites.</li>
              <li>You can ask us what data we have or ask us to delete it.</li>
              <li>We try to keep your data safe and don{"'"}t keep it longer than necessary.</li>
            </ul>
          </section>

          <p className="text-muted-foreground italic mb-8">If you want the legal details, they{"'"}re below.</p>

          <hr className="my-8 border-border" />

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground">1. Who We Are</h2>
            <p className="text-foreground">
              This website is operated by Groovy Planning ("we," "us," or "our").
              We are the data controller for purposes of applicable data protection laws, including the General Data Protection Regulation (GDPR).
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground">2. Information We Collect</h2>
            <p className="text-foreground">We collect only information necessary to operate the website.</p>
            <p className="text-foreground">This may include:</p>
            <ul className="text-foreground list-disc pl-5">
              <li>Information you voluntarily provide, such as an email address when creating an account.</li>
              <li>Technical information automatically provided by your device or browser, such as IP address, browser type, and operating system.</li>
              <li>Authentication cookies used to keep you logged in if you choose that option.</li>
            </ul>
            <p className="text-foreground">We do not intentionally collect sensitive personal data.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground">3. Legal Basis for Processing (GDPR)</h2>
            <p className="text-foreground">Under GDPR, we process personal data based on the following legal grounds:</p>
            <ul className="text-foreground list-disc pl-5">
              <li><strong>Contractual necessity:</strong> to provide access to the website and its features.</li>
              <li><strong>Legitimate interests:</strong> to maintain security, prevent abuse, and ensure reliable operation.</li>
              <li><strong>Consent:</strong> where you explicitly choose options such as staying logged in via cookies.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground">4. Cookies</h2>
            <p className="text-foreground">We use cookies only for essential functionality, including user authentication and session management.</p>
            <p className="text-foreground">These cookies:</p>
            <ul className="text-foreground list-disc pl-5">
              <li>Are not used for advertising</li>
              <li>Are not used for cross-site tracking</li>
              <li>Are not sold or shared with third parties</li>
            </ul>
            <p className="text-foreground">You may disable cookies through your browser settings, but some features of the site may not function correctly.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground">5. How We Use Your Information</h2>
            <p className="text-foreground">We use personal information only to:</p>
            <ul className="text-foreground list-disc pl-5">
              <li>Operate and maintain the website</li>
              <li>Authenticate users and manage sessions</li>
              <li>Improve performance, security, and reliability</li>
              <li>Communicate with you regarding account-related matters</li>
            </ul>
            <p className="text-foreground">We do not use your data for behavioral advertising or resale.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground">6. Data Sharing</h2>
            <p className="text-foreground">We do not sell, rent, or trade personal data.</p>
            <p className="text-foreground">We may disclose information only if:</p>
            <ul className="text-foreground list-disc pl-5">
              <li>Required by law or legal process</li>
              <li>Necessary to protect the rights, safety, or security of the website or its users</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground">7. Data Retention</h2>
            <p className="text-foreground">We retain personal data only for as long as necessary to provide the service or comply with legal obligations.</p>
            <p className="text-foreground">When data is no longer required, it is deleted or anonymized.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground">8. Your Rights (GDPR)</h2>
            <p className="text-foreground">If you are located in the European Economic Area, you have the right to:</p>
            <ul className="text-foreground list-disc pl-5">
              <li>Access the personal data we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your personal data</li>
              <li>Object to or restrict certain processing</li>
              <li>Request data portability, where applicable</li>
              <li>Withdraw consent at any time where processing is based on consent</li>
            </ul>
            <p className="text-foreground">To exercise these rights, contact us using the information below.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground">9. Data Security</h2>
            <p className="text-foreground">We use reasonable technical and organizational measures to protect personal data from unauthorized access, disclosure, or loss.</p>
            <p className="text-foreground">No system is perfectly secure, but we aim to minimize risk.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground">10. Changes to This Policy</h2>
            <p className="text-foreground">We may update this Privacy Policy from time to time. Any changes will be posted on this page with an updated "Last updated" date.</p>
            <p className="text-foreground">Your continued use of the website after changes are posted constitutes acceptance of the revised policy.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground">11. Contact</h2>
            <p className="text-foreground">For questions, requests, or concerns about this Privacy Policy or your personal data, contact:</p>
            <p className="text-foreground">
              <a href="mailto:robbie@robbooker.com" className="text-primary hover:underline">
                robbie@robbooker.com
              </a>
            </p>
          </section>
        </article>
      </main>

      {/* Footer */}
      <footer className="border-t py-6">
        <div className="container text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Groovy Planning. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
