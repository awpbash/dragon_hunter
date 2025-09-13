// app/layout.tsx
import "./globals.css";
import { GameProvider } from "./providers";

export const metadata = {
  title: "Dragon Quest",
  description: "Speedrun prank",
};

// 👇 declare viewport separately
export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-screen flex items-center justify-center p-4">
        <GameProvider>{children}</GameProvider>
      </body>
    </html>
  );
}
