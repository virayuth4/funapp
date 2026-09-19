import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./context/authContext";
import Navigation from "./Components/navigation";
import { Analytics } from "@vercel/analytics/next"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata = {
  metadataBase: new URL("https://eatdoko.com"),
  applicationName: "EatDoko",
  title: {
    default: "EatDoko | Random Cafe & Restaurant Picker",
    template: "%s | EatDoko",
  },
  description:
    "Can't decide where to eat? Randomly select a cafe or restaurant, so you can stop scrolling and start eating.",
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${inter.variable}  h-full antialiased`}
    >
      <body className="min-h-full flex flex-col ">
        <AuthProvider>
          <Navigation/>
          <Analytics/>
        {children}
        </AuthProvider>
        </body>
    </html>
  );
}
