'use client';

import { useState, useRef } from 'react';
import { Camera, Loader2, Save, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function ScanPage() {
    const [image, setImage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<any>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleExtract = async () => {
        if (!image) return;
        setLoading(true);
        try {
            const res = await fetch('/api/extract', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image }),
            });
            const json = await res.json();
            if (res.ok) {
                setData(json);
            } else {
                alert('Error al extraer datos');
            }
        } catch (e) {
            console.error(e);
            alert('Error al extraer datos');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!data) return;

        // Convert date DD/MM/YYYY to YYYY-MM-DD
        let formattedDate = null;
        if (data.date) {
            const parts = data.date.split('/');
            if (parts.length === 3) {
                formattedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
            }
        }

        try {
            const { error, data: insertedData } = await supabase.from('incidents').insert({
                date: formattedDate,
                time: data.time,
                address: data.address,
                commander: data.commander,
                act_number: data.act_number,
                raw_data: data
            }).select().single();

            if (error) {
                console.error('Supabase error:', error);
                throw new Error(error.message);
            }

            // Insert vehicles if any
            if (data.vehicles?.length > 0 && insertedData) {
                const vehicles = data.vehicles.map((v: any) => ({
                    incident_id: insertedData.id,
                    brand: v.brand,
                    model: v.model,
                    plate: v.plate,
                    driver: v.driver,
                    run: v.run
                }));
                await supabase.from('incident_vehicles').insert(vehicles);
            }

            // Insert people if any
            if (data.involved_people?.length > 0 && insertedData) {
                const people = data.involved_people.map((p: any) => ({
                    incident_id: insertedData.id,
                    name: p.name,
                    run: p.run,
                    // attended_by_132: p.attended_by_132
                }));
                await supabase.from('incident_involved_people').insert(people);
            }

            alert('¡Informe guardado con éxito!');
            router.push('/');
        } catch (e: any) {
            console.error(e);
            alert('Error al guardar: ' + e.message);
        }
    }

    return (
        <div className="min-h-screen p-4 bg-gray-50 dark:bg-zinc-900 pb-20 font-sans">
            <header className="mb-6 flex items-center justify-between">
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">Escanear Informe</h1>
                <button onClick={() => router.push('/')} className="text-sm font-medium text-gray-500">Cancelar</button>
            </header>

            {!image && (
                <div
                    onClick={() => fileInputRef.current?.click()}
                    className="group border-2 border-dashed border-gray-300 rounded-2xl h-[60vh] flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-white hover:border-blue-400 hover:shadow-xl dark:border-neutral-700 dark:hover:bg-neutral-800"
                >
                    <div className="p-6 bg-white dark:bg-neutral-800 rounded-full shadow-lg mb-6 group-hover:scale-110 transition-transform">
                        <Camera className="w-12 h-12 text-blue-500" />
                    </div>
                    <p className="text-gray-600 font-medium text-lg">Toca para abrir la cámara</p>
                    <p className="text-gray-400 text-sm mt-2">o sube una foto</p>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={handleFileChange}
                    />
                </div>
            )}

            {image && !data && (
                <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-gray-200 dark:border-neutral-700">
                        <img src={image} alt="Preview" className="w-full max-h-[60vh] object-cover" />
                        <button
                            onClick={() => { setImage(null); setData(null); }}
                            className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full backdrop-blur-md hover:bg-black/70"
                        >
                            <RefreshCw className="w-5 h-5" />
                        </button>
                    </div>

                    <button
                        onClick={handleExtract}
                        disabled={loading}
                        className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-blue-500/30 flex items-center justify-center gap-3 active:scale-95 transition-transform disabled:opacity-70"
                    >
                        {loading ? <Loader2 className="animate-spin w-6 h-6" /> : (
                            <>
                                <span>Extraer Datos</span>
                                <div className="px-2 py-1 bg-white/20 rounded text-xs">IA</div>
                            </>
                        )}
                    </button>
                </div>
            )}

            {data && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 dark:bg-neutral-800 dark:border-neutral-700">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-bold text-xl">Revisar Datos</h2>
                            <span className="text-xs font-mono bg-green-100 text-green-700 px-2 py-1 rounded-full dark:bg-green-900/30 dark:text-green-400">Confianza Alta</span>
                        </div>

                        {/* Simplified Check Form */}
                        <div className="space-y-4">
                            <div className="p-3 bg-gray-50 rounded-lg dark:bg-neutral-900/50">
                                <label className="text-xs text-gray-500 uppercase font-semibold">Fecha y Hora</label>
                                <div className="font-medium">{data.date} a las {data.time}</div>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-lg dark:bg-neutral-900/50">
                                <label className="text-xs text-gray-500 uppercase font-semibold">Dirección</label>
                                <div className="font-medium">{data.address}</div>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-lg dark:bg-neutral-900/50">
                                <label className="text-xs text-gray-500 uppercase font-semibold">Comandante / Cargo</label>
                                <div className="font-medium">{data.commander}</div>
                            </div>

                            {data.vehicles?.length > 0 && (
                                <div className="p-3 bg-gray-50 rounded-lg dark:bg-neutral-900/50">
                                    <label className="text-xs text-gray-500 uppercase font-semibold">Vehículos</label>
                                    {data.vehicles.map((v: any, i: number) => (
                                        <div key={i} className="text-sm border-t border-gray-200 mt-2 pt-2 first:border-0 first:mt-0 first:pt-0">
                                            {v.brand} {v.model} - {v.plate}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={() => setData(null)}
                            className="flex-1 py-4 bg-gray-200 text-gray-700 rounded-xl font-semibold active:scale-95 transition-transform dark:bg-neutral-800 dark:text-gray-300"
                        >
                            Editar
                        </button>
                        <button
                            onClick={handleSave}
                            className="flex-[2] py-4 bg-green-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-green-600/30 flex items-center justify-center gap-2 active:scale-95 transition-transform"
                        >
                            <Save className="w-5 h-5" />
                            Guardar Informe
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
