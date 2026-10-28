import type { Metadata } from "next";
import "@fontsource-variable/inter";
import "@fontsource-variable/archivo";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { FloatingWhatsApp } from "@/components/FloatingWhatsApp";
import { CartProvider } from "@/components/providers/CartProvider";
import { EnquiryProvider } from "@/components/providers/EnquiryProvider";
import { ToastProvider } from "@/components/providers/ToastProvider";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { SavedProductsProvider } from "@/components/providers/SavedProductsProvider";
import { EnquiryModal } from "@/components/modals/EnquiryModal";
import { TopBar } from "@/components/TopBar";
import { CookieConsent } from "@/components/CookieConsent";
import { ClientErrorReporter } from "@/components/ClientErrorReporter";
import { categorySummary } from "@/lib/categories";
import { getProducts } from "@/lib/woocommerce";

export const metadata: Metadata = {
  title: {
    default: "Engineerparts.com | Industrial products",
    template: "%s | Engineerparts.com",
  },
  description:
    "Browse industrial equipment, spare parts, tools and available clearance stock from Engineerparts.com.",
  metadataBase: new URL("https://engineerparts.com"),
  openGraph: {
    title: "Engineerparts.com | Industrial products",
    description: "Browse products from the live Engineerparts.com catalogue.",
    type: "website",
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const products = await getProducts();
  const categories = categorySummary(products);

  return (
    <html lang="en-AE">
      <body className="flex min-h-screen flex-col bg-white">
        <ToastProvider>
          <CartProvider>
            <AuthProvider>
              <SavedProductsProvider>
                <EnquiryProvider>
                  <TopBar />
                  <Header categories={categories} />
                  <main className="flex-1">{children}</main>
                  <Footer categories={categories} />
                  <FloatingWhatsApp />
                  <EnquiryModal />
                </EnquiryProvider>
              </SavedProductsProvider>
            </AuthProvider>
          </CartProvider>
        </ToastProvider>
        <CookieConsent />
        <ClientErrorReporter />
      </body>
    </html>
  );
}
