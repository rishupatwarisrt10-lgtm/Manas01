'use client';

import Layout from "@/app/components/Layout";
import Link from 'next/link';
import { useSession } from 'next-auth/react';

export default function TestNavPage() {
  const { data: session } = useSession();
  
  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-8">🧪 Navigation Test Page</h1>
        
        <div className="bg-white/10 p-6 rounded-xl backdrop-blur border border-white/20 mb-8">
          <h2 className="text-xl font-semibold mb-4">Current Status</h2>
          <p className="text-white/80">
            {session ? (
              <>✅ <strong>Authenticated</strong> as {session.user?.name || session.user?.email}</>
            ) : (
              <>👤 <strong>Guest Mode</strong> - Navigation should work without authentication</>
            )}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white/10 p-6 rounded-xl backdrop-blur border border-white/20">
            <h3 className="text-lg font-semibold mb-4">🔗 Test Navigation Links</h3>
            <div className="space-y-3">
              <Link 
                href="/" 
                className="block py-2 px-4 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-center"
              >
                🏠 Home
              </Link>
              <Link 
                href="/dashboard" 
                className="block py-2 px-4 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-center"
              >
                📊 Dashboard
              </Link>
              <Link 
                href="/settings" 
                className="block py-2 px-4 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-center"
              >
                ⚙️ Settings
              </Link>
            </div>
          </div>

          <div className="bg-white/10 p-6 rounded-xl backdrop-blur border border-white/20">
            <h3 className="text-lg font-semibold mb-4">📱 Mobile Menu Test</h3>
            <p className="text-white/80 text-sm mb-4">
              On mobile devices, tap the hamburger menu (☰) at the top-left to access navigation.
            </p>
            <div className="p-4 bg-white/5 rounded-lg border-2 border-dashed border-white/20">
              <p className="text-xs text-white/60 text-center">
                Resize your browser or use mobile device to test mobile navigation
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-green-500/20 border border-green-500/30 p-4 rounded-lg">
          <h3 className="text-green-200 font-semibold mb-2">✅ Navigation Fixes Applied:</h3>
          <ul className="text-green-200 text-sm space-y-1">
            <li>• Removed middleware route protection to allow guest access</li>
            <li>• Enhanced sidebar navigation with icons and better styling</li>
            <li>• Added guest mode indicators on dashboard</li>
            <li>• Updated mobile navigation with improved UX</li>
            <li>• All pages now accessible without authentication</li>
          </ul>
        </div>
      </div>
    </Layout>
  );
}