import { Link } from 'react-router-dom';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { AnnouncementBar } from '@/components/layout/AnnouncementBar';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-background">
      <AnnouncementBar />
      {/* Header */}
      <header className="sticky top-10 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
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
          <h1 className="text-3xl font-bold text-foreground mb-2">Terms of Service</h1>
          <p className="text-muted-foreground mb-8">Last updated: January 2, 2026</p>

          <p className="text-foreground mb-8">
            By accessing or using this website, you agree to these Terms of Service ("Terms"). If you do not agree, do not use the site.
          </p>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground">1. Use of the Website</h2>
            <p className="text-foreground">You may use this website only for lawful purposes and in accordance with these Terms.</p>
            <p className="text-foreground">You agree not to:</p>
            <ul className="text-foreground list-disc pl-5">
              <li>Violate any applicable laws or regulations</li>
              <li>Attempt to gain unauthorized access to the site or its systems</li>
              <li>Interfere with or disrupt the operation or security of the site</li>
              <li>Use the site in a way that could harm us or other users</li>
            </ul>
            <p className="text-foreground">We reserve the right to suspend or terminate access if these Terms are violated.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground">2. Accounts</h2>
            <p className="text-foreground">Some features may require creating an account.</p>
            <p className="text-foreground">You are responsible for:</p>
            <ul className="text-foreground list-disc pl-5">
              <li>Providing accurate information</li>
              <li>Maintaining the confidentiality of your login credentials</li>
              <li>All activity that occurs under your account</li>
            </ul>
            <p className="text-foreground">We are not responsible for losses caused by unauthorized use of your account.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground">3. Cookies and Sessions</h2>
            <p className="text-foreground">
              We may use cookies to support essential site functionality, including keeping you logged in if you choose. Details are described in our{' '}
              <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground">4. Content and Intellectual Property</h2>
            <p className="text-foreground">
              All content on this website—including text, graphics, software, and design—is owned by us or licensed to us, unless otherwise stated.
            </p>
            <p className="text-foreground">
              You may not copy, reproduce, distribute, or create derivative works from the site{"'"}s content without prior written permission, except where permitted by law.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground">5. User-Provided Content</h2>
            <p className="text-foreground">If you submit content to the site (such as text, data, or uploads), you:</p>
            <ul className="text-foreground list-disc pl-5">
              <li>Retain ownership of your content</li>
              <li>Grant us a limited license to use it solely to operate and provide the website</li>
            </ul>
            <p className="text-foreground">You are responsible for ensuring that any content you submit does not violate laws or third-party rights.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground">6. No Warranties</h2>
            <p className="text-foreground">The website is provided "as is" and "as available."</p>
            <p className="text-foreground">We make no warranties, express or implied, including but not limited to:</p>
            <ul className="text-foreground list-disc pl-5">
              <li>Accuracy or completeness of content</li>
              <li>Availability or uptime</li>
              <li>Fitness for a particular purpose</li>
            </ul>
            <p className="text-foreground">Use of the site is at your own risk.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground">7. Limitation of Liability</h2>
            <p className="text-foreground">
              To the fullest extent permitted by law, we are not liable for any indirect, incidental, consequential, or special damages arising out of or related to your use of the website.
            </p>
            <p className="text-foreground">
              Our total liability, if any, is limited to the amount you paid us (if any) to use the website.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground">8. Third-Party Services</h2>
            <p className="text-foreground">The website may reference or link to third-party services or websites.</p>
            <p className="text-foreground">We are not responsible for the content, policies, or practices of third parties. Use them at your own discretion.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground">9. Termination</h2>
            <p className="text-foreground">
              We may suspend or terminate your access to the website at any time, with or without notice, for any reason, including violation of these Terms.
            </p>
            <p className="text-foreground">You may stop using the website at any time.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground">10. Changes to These Terms</h2>
            <p className="text-foreground">
              We may update these Terms from time to time. Updated terms will be posted on this page with a revised "Last updated" date.
            </p>
            <p className="text-foreground">Continued use of the website after changes are posted constitutes acceptance of the updated Terms.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground">11. Governing Law</h2>
            <p className="text-foreground">
              These Terms are governed by and construed in accordance with the laws of the state of Texas in the United States, without regard to conflict of law principles.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground">12. Contact</h2>
            <p className="text-foreground">If you have questions about these Terms, contact us at:</p>
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

