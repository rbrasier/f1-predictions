import { ReactNode } from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-paddock-dark">
      <Navbar />
      <main className="py-0">
        {children}
      </main>
      <Footer />
    </div>
  );
};
