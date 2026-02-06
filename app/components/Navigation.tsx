'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Camera, FileText, BarChart3, FileBarChart } from 'lucide-react';

export default function Navigation() {
    const pathname = usePathname();

    const links = [
        { href: '/', label: 'Inicio', icon: Home },
        { href: '/scan', label: 'Escanear', icon: Camera },
        { href: '/documents', label: 'Documentos', icon: FileText },
        { href: '/dashboard', label: 'Dashboard', icon: BarChart3 },
        { href: '/informes', label: 'Informes', icon: FileBarChart },
    ];

    return (
        <nav className="bg-white dark:bg-neutral-900 border-b border-gray-200 dark:border-neutral-800 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center">
                        <Link href="/" className="flex items-center gap-3 text-xl font-bold text-red-600">
                            <div className="relative w-12 h-12">
                                <Image
                                    src="/logo.png"
                                    alt="Logo 5 Osorno"
                                    fill
                                    className="object-contain"
                                    priority
                                />
                            </div>
                            <span className="hidden sm:inline">QUINTA COMPAÑIA</span>
                        </Link>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2">
                        {links.map((link) => {
                            const Icon = link.icon;
                            const isActive = pathname === link.href;
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive
                                        ? 'bg-red-600 text-white'
                                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800'
                                        }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    <span className="hidden md:inline">{link.label}</span>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </div>
        </nav>
    );
}
