import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "艺｜东方人生智慧",
  description: "把深奥命理转化为看得懂的人生故事、关系洞察与顺势行动。",
  openGraph: {
    title: "艺｜东方人生智慧",
    description: "看见命运的脉络，活出人生的智慧。",
    images: [{ url: "/og.png", width: 1536, height: 1024, alt: "艺｜东方人生智慧" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "艺｜东方人生智慧",
    description: "把深奥命理转化为看得懂的人生故事、关系洞察与顺势行动。",
    images: ["/og.png"],
  },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#061019" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
