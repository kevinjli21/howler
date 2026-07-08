import { Geist, Geist_Mono, Atkinson_Hyperlegible } from "next/font/google";
import "./globals.css";
import "./tanker.css";
import { AuthProvider } from './components/AuthContext';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Purpose-built for readability (developed with the Braille Institute);
// used on the category filter buttons per WCAG legibility guidance.
const atkinsonHyperlegible = Atkinson_Hyperlegible({
  variable: "--font-legible",
  weight: ["400", "700"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: "Howler",
  description: "A social app for UW students",
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${atkinsonHyperlegible.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col"><AuthProvider>{children}</AuthProvider></body>
    </html>
  );
}
