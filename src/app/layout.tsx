import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Money Trail — See where your money goes",
  description: "A calmer way to understand your everyday spending.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
