import { ReactNode } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#1A1A1A] overflow-x-hidden">
      <Navbar />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
