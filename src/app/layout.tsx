import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Eat Right — Daily Nutrition & Wellness",
  description: "A simple, thoughtful way to track your daily nutrition, calorie targets, and build healthy habits.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
