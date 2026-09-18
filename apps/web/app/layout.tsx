import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MindFlow AI — 명상·수면",
  description: "체크인부터 맞춤 루틴, 주간 인사이트까지 완결된 명상·수면 웰니스 동반자",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="text-calm-50 antialiased">{children}</body>
    </html>
  );
}
