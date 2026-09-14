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
  title: "Eat Doko (Where)? | Random Cafe & Restaurant Picker",
  description:
    "Can't decide where to eat? Randomly select a cafe or restuarants, so you can stop scrolling and start eating.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${inter.variable}  h-full antialiased`}
    >
      <body className="min-h-full flex flex-col ]">
        <AuthProvider>
          <Navigation/>
          <Analytics/>
        {children}
        </AuthProvider>
        </body>
    </html>
  );
}
