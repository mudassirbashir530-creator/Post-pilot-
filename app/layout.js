import './globals.css';
import Providers from '@/components/Providers';

export const metadata = {
  title: 'PostPilot - Multi-User Social Media Automation Platform',
  description: 'Automate your Facebook Page & Instagram Business content creation, daily publishing, AI comment auto-reply, and analytics isolation.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-navy-900 text-slate-100 min-h-screen flex flex-col antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
