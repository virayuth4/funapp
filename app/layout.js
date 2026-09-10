import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./context/authContext";
import Navigation from "./Components/navigation";

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
    "Can't decide where to eat? Randomly select a cafe or restuarants, so you can stop scrolling and start eating.",
};
export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          {/* <Navigation/> */}
        {children}
        </AuthProvider>
        </body>
    </html>
  );
}
