'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, usePathname } from 'next/navigation';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const [loading, setLoading] = useState(true);
    const [authenticated, setAuthenticated] = useState(false);
    const router = useRouter();
    const pathname = usePathname();

    // Public routes that don't require authentication
    const publicRoutes = ['/login', '/signup'];

    useEffect(() => {
        // Check if current route is public
        const isPublicRoute = publicRoutes.some(route => pathname?.startsWith(route));

        if (isPublicRoute) {
            setLoading(false);
            setAuthenticated(true);
            return;
        }

        // Check authentication status
        const checkAuth = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession();
                
                if (error) {
                    console.error('Auth error:', error);
                    setAuthenticated(false);
                    router.push('/login');
                    return;
                }

                if (session) {
                    setAuthenticated(true);
                } else {
                    setAuthenticated(false);
                    router.push('/login');
                }
            } catch (e) {
                console.error('Auth check failed:', e);
                setAuthenticated(false);
                router.push('/login');
            } finally {
                setLoading(false);
            }
        };

        checkAuth();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session) {
                setAuthenticated(true);
            } else {
                setAuthenticated(false);
                if (!isPublicRoute) {
                    router.push('/login');
                }
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [router, pathname]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Verificando autenticación...</p>
                </div>
            </div>
        );
    }

    if (!authenticated) {
        return null; // Will redirect to login
    }

    return <>{children}</>;
}
