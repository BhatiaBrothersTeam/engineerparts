import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/ui/PageHero";
import { PolicyLayout } from "@/components/ui/PolicyLayout";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Engineerparts.com collects, uses, shares and protects personal data.",
};

const sectionClass = "border-b border-navy-100 pb-8 last:border-0 last:pb-0";
const headingClass = "text-h3 text-navy-900";
const subheadingClass = "mt-5 text-h4 text-navy-900";
const paragraphClass = "mt-3 leading-7 text-steel-700";
const listClass = "mt-3 list-disc space-y-2 pl-6 leading-7 text-steel-700";
const linkClass =
  "font-semibold text-brand-700 underline decoration-brand-200 underline-offset-4 hover:text-brand-800";

export default function PrivacyPage() {
  return (
    <>
      <PageHero
        breadcrumbs={[{ label: "Privacy Policy" }]}
        eyebrow="Legal"
        title="Privacy Policy"
        description="How we collect, use, share and protect your personal data."
        tone="light"
      />
      <PolicyLayout current="/privacy-policy">
        <div className="card p-5 sm:p-8 lg:p-10">
          <p className="eyebrow text-steel-500">
            Effective date: October 26, 2026 · Last updated: October 26, 2026
          </p>

          <div className="mt-8 grid gap-8">
            <section className={sectionClass}>
              <h2 className={headingClass}>1. Who We Are</h2>
              <p className={paragraphClass}>
                Engineerparts.com (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) is an
                online industrial marketplace for surplus stock, dead stock,
                industrial equipment, spare parts, tools and engineered parts, sold to retail and
                business buyers. The website is operated by [Insert Legal Entity Name], of [Insert
                Registered Office / Warehouse Address], United Arab Emirates, which is the
                controller of your Personal Data.
              </p>
              <p className={paragraphClass}>
                This policy explains how we collect, use, share and protect Personal Data when you
                visit www.engineerparts.com, buy clearance stock, submit a single-item or bulk-lot
                enquiry, subscribe to clearance alerts, contact us on WhatsApp, or interact with
                our advertising. It applies to visitors and buyers in the UAE, the wider GCC, the
                European Economic Area (EEA), the United Kingdom, the United States, India and
                elsewhere.
              </p>
              <p className={paragraphClass}>
                <strong className="text-navy-900">Contact for privacy matters:</strong> [Insert
                privacy email, e.g. privacy@engineerparts.com]
              </p>
            </section>

            <section className={sectionClass}>
              <h2 className={headingClass}>2. Information We Collect</h2>
              <p className={paragraphClass}>
                &ldquo;Personal Data&rdquo; means information that identifies, or can reasonably be
                linked to, an individual, including a named contact at a business buyer.
              </p>

              <h3 className={subheadingClass}>A. Information you give us</h3>
              <ul className={listClass}>
                <li>
                  <strong className="text-navy-900">
                    Enquiries, quotes and bulk-lot requests:
                  </strong>{" "}
                  full name, company name, email, phone number, country, approximate quantity or
                  budget, product, category, SKU or lot references, and your message.
                </li>
                <li>
                  <strong className="text-navy-900">Account and order data:</strong> when you create
                  an account or check out as a guest, we collect billing and delivery addresses,
                  order references and collection-appointment details.
                </li>
                <li>
                  <strong className="text-navy-900">Payment data:</strong> payments are handled by
                  third-party PCI-DSS-compliant gateways. We do not store full card numbers. We keep
                  only transaction identifiers, invoice totals (AED or other currency) and billing
                  confirmations needed for tax and accounting.
                </li>
                <li>
                  <strong className="text-navy-900">Clearance alerts:</strong> your email address
                  and subscription preferences.
                </li>
                <li>
                  <strong className="text-navy-900">
                    WhatsApp and direct communications:
                  </strong>{" "}
                  your phone number, profile name, lead or order reference, and any photos or
                  documents you send (for example damage claims or specification requests).
                </li>
              </ul>

              <h3 className={subheadingClass}>B. Information collected automatically</h3>
              <ul className={listClass}>
                <li>
                  <strong className="text-navy-900">Device and connection data:</strong> IP
                  address, browser type and version, operating system, device identifiers, referring
                  URL, time zone and country setting.
                </li>
                <li>
                  <strong className="text-navy-900">Behavioural analytics events:</strong> product
                  views, catalogue searches, add-to-cart actions, purchases, enquiry submissions,
                  WhatsApp button clicks and specification or document downloads.
                </li>
              </ul>
              <p className={paragraphClass}>
                We do not knowingly collect sensitive categories of personal data (such as health,
                biometric or government-ID data) through the website. Please do not include them in
                enquiries or WhatsApp messages.
              </p>
            </section>

            <section className={sectionClass}>
              <h2 className={headingClass}>3. How and Why We Use Your Information</h2>
              <div className="mt-5 overflow-x-auto rounded-lg border border-navy-200">
                <table className="w-full min-w-[42rem] border-collapse text-left text-sm leading-6">
                  <thead className="bg-navy-50 text-navy-900">
                    <tr>
                      <th className="w-1/3 border-b border-navy-200 px-4 py-3 font-bold">Purpose</th>
                      <th className="border-b border-navy-200 px-4 py-3 font-bold">
                        What it involves
                      </th>
                    </tr>
                  </thead>
                  <tbody className="text-steel-700">
                    <tr>
                      <th className="border-b border-navy-100 px-4 py-3 align-top font-semibold text-navy-900">
                        Enquiries and order fulfilment
                      </th>
                      <td className="border-b border-navy-100 px-4 py-3">
                        Verifying live warehouse stock, responding to enquiries, issuing quotations
                        and tax invoices, taking payment, arranging UAE site delivery, collection by
                        appointment or international palletised freight
                      </td>
                    </tr>
                    <tr>
                      <th className="border-b border-navy-100 px-4 py-3 align-top font-semibold text-navy-900">
                        Customer support and returns
                      </th>
                      <td className="border-b border-navy-100 px-4 py-3">
                        Order amendments, cancellations, damaged-on-arrival claims (reported within
                        48 hours) and refunds under our Returns &amp; Refunds and Shipping &amp;
                        Delivery Policies
                      </td>
                    </tr>
                    <tr>
                      <th className="border-b border-navy-100 px-4 py-3 align-top font-semibold text-navy-900">
                        Stock alerts and B2B communications
                      </th>
                      <td className="border-b border-navy-100 px-4 py-3">
                        Notifications of new clearance or dead-stock lots, and substitute products
                        where an ordered item is unavailable
                      </td>
                    </tr>
                    <tr>
                      <th className="border-b border-navy-100 px-4 py-3 align-top font-semibold text-navy-900">
                        Advertising and measurement
                      </th>
                      <td className="border-b border-navy-100 px-4 py-3">
                        Measuring campaign performance, building custom and lookalike audiences, and
                        showing relevant ads on third-party platforms such as Google, Meta, LinkedIn
                        and Microsoft
                      </td>
                    </tr>
                    <tr>
                      <th className="px-4 py-3 align-top font-semibold text-navy-900">
                        Security and legal compliance
                      </th>
                      <td className="px-4 py-3">
                        Preventing fraud and unauthorised access, verifying trade buyers, meeting UAE
                        tax and customs obligations, and enforcing our Terms &amp; Conditions
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className={paragraphClass}>
                We do not use your Personal Data for decisions based solely on automated processing
                that significantly affect you.
              </p>
            </section>

            <section className={sectionClass}>
              <h2 className={headingClass}>4. Cookies, Advertising and Tracking Technologies</h2>
              <p className={paragraphClass}>
                We use cookies, pixels, web beacons and server-side tracking, including Google Tag
                Manager, Google Analytics 4, Google Ads, Meta Pixel and Conversions API, and the
                LinkedIn Insight Tag.
              </p>
              <p className={paragraphClass}>
                <strong className="text-navy-900">Remarketing.</strong> When you view a part,
                download a specification, add to cart or submit an enquiry, tags record the action
                so we can see which ads led to your visit and show you relevant surplus-stock ads
                elsewhere.
              </p>
              <p className={paragraphClass}>
                <strong className="text-navy-900">
                  Hashed first-party data (Enhanced Conversions / CAPI).
                </strong>{" "}
                Where the law allows and your consent settings permit, we may share irreversibly
                hashed versions of your email address or phone number with Google and Meta to match
                enquiries and purchases to ad clicks.
              </p>
              <p className={paragraphClass}>
                <strong className="text-navy-900">Google Consent Mode v2.</strong> For visitors in
                the EEA, UK and Switzerland, advertising and analytics storage (ad_storage,
                ad_user_data, ad_personalization, analytics_storage) stays denied until you actively
                consent through our cookie banner.
              </p>
              <p className={paragraphClass}>
                <strong className="text-navy-900">Managing preferences.</strong> You can change or
                withdraw your choices at any time through [Cookie Settings link] or your browser
                settings. You can also opt out of personalised ads through:
              </p>
              <ul className={listClass}>
                <li>
                  Google Ad Settings:{" "}
                  <a
                    className={linkClass}
                    href="https://myadcenter.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    myadcenter.google.com
                  </a>
                </li>
                <li>
                  Meta Ad Preferences:{" "}
                  <a
                    className={linkClass}
                    href="https://www.facebook.com/adpreferences"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    facebook.com/adpreferences
                  </a>
                </li>
                <li>
                  Digital Advertising Alliance (US):{" "}
                  <a
                    className={linkClass}
                    href="https://optout.aboutads.info"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    optout.aboutads.info
                  </a>
                </li>
                <li>
                  Network Advertising Initiative:{" "}
                  <a
                    className={linkClass}
                    href="https://optout.networkadvertising.org"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    optout.networkadvertising.org
                  </a>
                </li>
              </ul>
              <p className={paragraphClass}>
                We honour Global Privacy Control (GPC) signals where required by law.
              </p>
            </section>

            <section className={sectionClass}>
              <h2 className={headingClass}>5. How We Share Your Information</h2>
              <p className={paragraphClass}>
                We do not sell your Personal Data for money. We share it only as needed to run the
                business:
              </p>
              <ul className={listClass}>
                <li>
                  Freight, courier and logistics partners for local delivery, collection
                  appointments, customs clearance and palletised freight.
                </li>
                <li>
                  Payment processors and financial institutions to authenticate payments, process
                  refunds (typically within 5–14 working days) and prevent fraud.
                </li>
                <li>
                  Hosting, CRM, analytics and messaging providers that store our catalogue and
                  enquiry records and power our email and WhatsApp communications, under data
                  processing agreements. WhatsApp is operated by Meta, which processes messages
                  under its own terms.
                </li>
                <li>
                  Advertising and marketing platforms (Google, Meta, LinkedIn, Microsoft) for ad
                  measurement and audience targeting, subject to applicable consent rules.
                </li>
                <li>
                  Authorities and advisers where required by law, court order or customs and tax
                  regulators, and to professional advisers, or a buyer in a business transfer,
                  under confidentiality obligations.
                </li>
              </ul>
            </section>

            <section className={sectionClass}>
              <h2 className={headingClass}>6. International Data Transfers</h2>
              <p className={paragraphClass}>
                Engineerparts.com is operated from the UAE. If you use the site from elsewhere,
                your Personal Data will be transferred to and processed in the UAE and in other
                countries where our cloud and advertising providers operate.
              </p>
              <p className={paragraphClass}>Where required, we rely on safeguards such as:</p>
              <ul className={listClass}>
                <li>
                  the European Commission&apos;s Standard Contractual Clauses and the UK
                  International Data Transfer Addendum for EEA and UK data; and
                </li>
                <li>
                  contractual and other cross-border safeguards required by UAE Federal Decree-Law
                  No. 45 of 2021 and the Saudi PDPL.
                </li>
              </ul>
            </section>

            <section className={sectionClass}>
              <h2 className={headingClass}>7. Data Retention and Security</h2>
              <p className={paragraphClass}>
                <strong className="text-navy-900">Retention.</strong> We keep enquiries, quotations
                and account records for as long as needed to fulfil your requests, maintain ongoing
                sourcing relationships and resolve disputes. Tax invoices, shipping documents and
                financial records are kept for the period required by UAE Federal Tax Authority and
                commercial law (at least five years). Marketing data is kept until you unsubscribe
                or withdraw consent. Cookie and advertising identifiers expire according to each
                provider&apos;s settings.
              </p>
              <p className={paragraphClass}>
                <strong className="text-navy-900">Security.</strong> We use industry-standard
                measures including SSL/TLS encryption, access controls and secured server
                environments. No system is completely secure, and we will notify you and regulators
                of a breach where the law requires.
              </p>
            </section>

            <section className={sectionClass}>
              <h2 className={headingClass}>8. Children</h2>
              <p className={paragraphClass}>
                Our site is intended for business and trade buyers and is not directed at anyone
                under 18. We do not knowingly collect Personal Data from children. If you believe
                we have, contact us and we will delete it.
              </p>
            </section>

            <section className={sectionClass}>
              <h2 className={headingClass}>9. Regional Privacy Disclosures</h2>

              <h3 className={subheadingClass}>
                A. United Arab Emirates (Federal Decree-Law No. 45 of 2021, &ldquo;PDPL&rdquo;)
              </h3>
              <p className={paragraphClass}>
                <strong className="text-navy-900">Legal basis:</strong> your consent, performance of
                a contract (orders, quotes, freight) and compliance with UAE legal obligations.
              </p>
              <p className={paragraphClass}>
                <strong className="text-navy-900">Your rights:</strong> to be informed about and
                access your data, request portability, correction or erasure, restrict processing,
                and object to direct marketing and automated processing.
              </p>
              <p className={paragraphClass}>
                <strong className="text-navy-900">Free zones:</strong> if you are in the DIFC or
                ADGM, the DIFC Data Protection Law (No. 5 of 2020) or ADGM Data Protection
                Regulations 2021 may apply instead, with the same rights and complaint routes to the
                relevant Commissioner.
              </p>
              <p className={paragraphClass}>
                <strong className="text-navy-900">Complaints:</strong> you may complain to the UAE
                Data Office.
              </p>

              <h3 className={subheadingClass}>B. Saudi Arabia and other GCC states</h3>
              <p className={paragraphClass}>
                <strong className="text-navy-900">Laws:</strong> we process data in line with the
                Saudi PDPL (Royal Decree M/19) and applicable local laws, including Bahrain Law No.
                30 of 2018, Oman Royal Decree 6/2022 and Qatar Law No. 13 of 2016.
              </p>
              <p className={paragraphClass}>
                <strong className="text-navy-900">Marketing and transfers:</strong> we send
                promotional alerts only with your explicit opt-in, each with a one-click
                unsubscribe. Transfers to our UAE team are made to fulfil your sourcing
                requests, arrange freight and provide support.
              </p>
              <p className={paragraphClass}>
                <strong className="text-navy-900">Your rights:</strong> to be informed, access your
                data, receive it in a readable format, correct it, and request its destruction once
                the purpose has ended.
              </p>

              <h3 className={subheadingClass}>
                C. EEA, UK and Switzerland (GDPR / UK GDPR)
              </h3>
              <p className={paragraphClass}>
                [Insert Legal Entity Name] is the controller. [Insert EU/UK representative details,
                if appointed under Art. 27.]
              </p>
              <p className={paragraphClass}>
                <strong className="text-navy-900">Legal bases:</strong> contract (Art. 6(1)(b)) for
                orders, quotes and freight; consent (Art. 6(1)(a)) for alerts and non-essential
                analytics and advertising cookies; legitimate interests (Art. 6(1)(f)) for B2B
                enquiry follow-up, fraud prevention and platform security; legal obligation (Art.
                6(1)(c)) for tax, customs and accounting records.
              </p>
              <p className={paragraphClass}>
                <strong className="text-navy-900">Your rights:</strong> access, rectification,
                erasure, restriction, portability, and objection to processing based on legitimate
                interests or direct marketing. Where we rely on consent, you can withdraw it at any
                time without affecting earlier processing.
              </p>
              <p className={paragraphClass}>
                <strong className="text-navy-900">Complaints:</strong> to your local data protection
                authority or the UK Information Commissioner&apos;s Office (
                <a
                  className={linkClass}
                  href="https://ico.org.uk"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  ico.org.uk
                </a>
                ).
              </p>

              <h3 className={subheadingClass}>
                D. United States (CCPA/CPRA and other state laws) and Canada (PIPEDA)
              </h3>
              <p className={paragraphClass}>
                <strong className="text-navy-900">Categories collected in the last 12 months:</strong>{" "}
                identifiers (name, email, phone, IP address); commercial information (enquiries,
                SKUs viewed, purchases); internet activity (analytics events); and geolocation at
                country level. We collect these for the purposes in Section 3 and disclose them to
                the recipients in Section 5.
              </p>
              <p className={paragraphClass}>
                <strong className="text-navy-900">No sale; opt-out of sharing:</strong> we do not
                sell Personal Data for money. Sharing identifiers or browsing events with ad
                networks for targeted advertising may count as &ldquo;sharing&rdquo; for
                cross-context behavioural advertising. You can opt out through [Do Not Sell or
                Share My Personal Information link / Cookie Settings] or by emailing us.
              </p>
              <p className={paragraphClass}>
                <strong className="text-navy-900">Your rights:</strong> to know, access, correct and
                delete your data, and to opt out of sharing. Where you use an authorised agent, we
                may require proof of authority.
              </p>
              <p className={paragraphClass}>
                <strong className="text-navy-900">Non-discrimination:</strong> we will not penalise
                you for exercising your rights.
              </p>
              <p className={paragraphClass}>
                <strong className="text-navy-900">Canada:</strong> you may access and correct your
                data and withdraw consent, and may complain to the Office of the Privacy
                Commissioner of Canada.
              </p>

              <h3 className={subheadingClass}>
                E. India, Australia, Singapore and other jurisdictions
              </h3>
              <p className={paragraphClass}>
                If you access the site from India (Digital Personal Data Protection Act, 2023),
                Australia, Singapore or elsewhere, we respect your statutory rights to access,
                correct and erase your data and to withdraw consent. Indian users may also nominate
                a representative and raise a grievance with us at the contact below before
                approaching the Data Protection Board of India.
              </p>
            </section>

            <section className={sectionClass}>
              <h2 className={headingClass}>10. How to Exercise Your Rights</h2>
              <p className={paragraphClass}>
                To request a copy, correction or deletion of your records, or to opt out of
                marketing or targeted advertising, contact our Privacy Team:
              </p>
              <ul className={listClass}>
                <li>
                  <strong className="text-navy-900">Contact form:</strong>{" "}
                  <Link className={linkClass} href="/contact">
                    www.engineerparts.com/contact
                  </Link>{" "}
                  (please quote your Lead Reference or Order Number)
                </li>
                <li>
                  <strong className="text-navy-900">Email:</strong> [Insert privacy email]
                </li>
                <li>
                  <strong className="text-navy-900">Post:</strong> [Insert full legal entity name
                  and UAE address]
                </li>
              </ul>
              <p className={paragraphClass}>
                We may verify your identity by matching the email, phone number or order reference
                you provide against our records. We will respond to verifiable requests within 30
                days, or sooner where local law requires. We may decline requests where the law
                allows or requires us to keep the data (for example tax records) and will explain
                why.
              </p>
            </section>

            <section className={sectionClass}>
              <h2 className={headingClass}>11. Changes to This Policy</h2>
              <p className={paragraphClass}>
                We may update this policy to reflect changes in our operations, advertising
                technology or legal requirements. We will post the revised version with a new
                &ldquo;Last updated&rdquo; date and, for material changes, give notice by email or a
                prominent site banner. Where consent is required for a change, we will ask for it.
              </p>
            </section>
          </div>
        </div>
      </PolicyLayout>
    </>
  );
}
