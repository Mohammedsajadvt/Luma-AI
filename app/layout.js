import './globals.css';
import AuthProvider from './components/AuthProvider';

export const metadata = {
  title: 'Luma AI — Intelligent Creative Assistant',
  description: 'Full-stack AI Chatbot powered by Next.js 14, MongoDB, OpenAI GPT-4o, and Google Authentication.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
