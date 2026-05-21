import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NSML WorkDesk",
  description: "Private NSML operations workdesk for vessel and project work.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
          {children}
        </div>
      </body>
    </html>
  );
}
