import { ReactNode } from 'react';
import { Navbar } from './Navbar';

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
    </div>
  );
};
