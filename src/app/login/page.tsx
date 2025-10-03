// src/app/login/page.tsx
'use client';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';

export default function LoginPage() {
  const supabase = createClientComponentClient();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-950">
      <div className="w-full max-w-md p-8 bg-gray-900 rounded-2xl border border-gray-800">
        <h1 className="text-3xl font-bold text-white text-center mb-4">FirstDown.<span className="text-orange-600">Cash</span></h1>
        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          theme="dark"
          providers={['google']} // You can add 'github', 'discord', etc.
          redirectTo={`${process.env.NEXT_PUBLIC_URL}/auth/callback`}
        />
      </div>
    </div>
  );
}