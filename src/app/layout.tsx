import type { Metadata } from "next";
import "./globals.css";
import { ComparisonProvider } from "@/contexts/ComparisonContext";
import { ThemeProvider } from "@/contexts/ThemeContext";

export const metadata: Metadata = {
  title: "PhonePixie - AI Shopping Assistant",
  description: "Find the perfect mobile phone with AI-powered recommendations. Compare prices, specs, and features across 970+ phones.",
  keywords: ["phone", "mobile", "smartphone", "AI", "shopping", "compare", "search", "assistant"],
  authors: [{ name: "PhonePixie" }],
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  minimumScale: 1,
  userScalable: true,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" }
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('theme') || 'dark';
                document.documentElement.classList.add(theme);
              } catch (e) {
                document.documentElement.classList.add('dark');
              }
            `,
          }}
        />
      </head>
      <body className="antialiased">
        <ThemeProvider>
          <ComparisonProvider>
            {children}
          </ComparisonProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

