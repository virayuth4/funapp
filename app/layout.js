import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./context/authContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Eat Doko (Where)? | Random Cafe & Restaurant Picker",
  description:
    "Can't decide where to eat? Pick a Place randomly picks a cafe or restaurant for you, so you can stop scrolling and start eating.",
};
export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider>
        {children}
        </AuthProvider>
        </body>
    </html>
  );
}
