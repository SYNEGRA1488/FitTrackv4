import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin", "cyrillic"] });

export const metadata: Metadata = {
  title: "FitTrack - iOS Fitness+ Premium",
  description: "Персональный фитнес-трекер с ИИ-ассистентом",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "FitTrack",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#007AFF",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className={inter.className}>
        <ThemeInitializer />
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}

function ThemeInitializer() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          try {
            const theme = localStorage.getItem('app-theme') || 'light';
            const html = document.documentElement;
            if (theme === 'light') {
              html.classList.remove('dark', 'dark-red');
            } else if (theme === 'dark') {
              html.classList.remove('dark-red');
              html.classList.add('dark');
            } else if (theme === 'dark-red') {
              html.classList.remove('dark');
              html.classList.add('dark-red');
            }
          } catch (e) {}
        `,
      }}
    />
  );
}


