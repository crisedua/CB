import Link from 'next/link';
import { Camera, FileText, BarChart3, FileBarChart, Globe } from 'lucide-react';

export default function Home() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-between p-6 lg:p-24">
            <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex">
                <p className="flex w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
                    Escáner de Incidentes - QUINTA COMPAÑIA
                </p>
            </div>

            <div className="mb-32 grid text-center lg:mb-0 lg:w-full lg:max-w-5xl lg:grid-cols-3 gap-4">

                <Link
                    href="/scan"
                    className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
                >
                    <h2 className="mb-3 text-2xl font-semibold flex items-center gap-2">
                        <Camera className="w-6 h-6" />
                        Escanear
                        <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
                            -&gt;
                        </span>
                    </h2>
                    <p className="m-0 max-w-[30ch] text-sm opacity-50">
                        Escanea un nuevo informe de incidente.
                    </p>
                </Link>

                <Link
                    href="/documents"
                    className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
                >
                    <h2 className="mb-3 text-2xl font-semibold flex items-center gap-2">
                        <FileText className="w-6 h-6" />
                        Documentos
                        <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
                            -&gt;
                        </span>
                    </h2>
                    <p className="m-0 max-w-[30ch] text-sm opacity-50">
                        Ver todos los informes escaneados.
                    </p>
                </Link>

                <Link
                    href="/dashboard"
                    className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
                >
                    <h2 className="mb-3 text-2xl font-semibold flex items-center gap-2">
                        <BarChart3 className="w-6 h-6" />
                        Dashboard
                        <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
                            -&gt;
                        </span>
                    </h2>
                    <p className="m-0 max-w-[30ch] text-sm opacity-50">
                        Cuadro de mando con estadísticas.
                    </p>
                </Link>

                <Link
                    href="/informes"
                    className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
                >
                    <h2 className="mb-3 text-2xl font-semibold flex items-center gap-2">
                        <FileBarChart className="w-6 h-6" />
                        Informes
                        <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
                            -&gt;
                        </span>
                    </h2>
                    <p className="m-0 max-w-[30ch] text-sm opacity-50">
                        Informes mensuales y KPIs.
                    </p>
                </Link>

                <Link
                    href="https://www.quintacbo.cl/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30 bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30"
                >
                    <h2 className="mb-3 text-2xl font-semibold flex items-center gap-2 text-red-700 dark:text-red-400">
                        <Globe className="w-6 h-6" />
                        Web Oficial
                        <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
                            -&gt;
                        </span>
                    </h2>
                    <p className="m-0 max-w-[30ch] text-sm opacity-50">
                        Visita el sitio web oficial de la Quinta Compañía.
                    </p>
                </Link>
            </div>
        </main>
    );
}
