'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { FileText, Calendar, MapPin, User, ChevronRight, Search, Filter, Trash2 } from 'lucide-react';

interface Incident {
    id: string;
    created_at: string;
    act_number: string;
    date: string;
    time: string;
    address: string;
    commander: string;
    nature: string;
    observations: string;
}

export default function DocumentsPage() {
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDate, setFilterDate] = useState('');
    const router = useRouter();

    useEffect(() => {
        loadIncidents();
    }, []);

    const loadIncidents = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('incidents')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setIncidents(data || []);
        } catch (e) {
            console.error('Error loading incidents:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!confirm('¿Estás seguro de que quieres eliminar este documento? Esta acción no se puede deshacer.')) return;

        try {
            const { error } = await supabase
                .from('incidents')
                .delete()
                .eq('id', id);

            if (error) throw error;
            setIncidents(incidents.filter(inc => inc.id !== id));
        } catch (e) {
            console.error('Error deleting incident:', e);
            alert('Error al eliminar el documento');
        }
    };

    const filteredIncidents = incidents.filter(incident => {
        const matchesSearch =
            incident.act_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            incident.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            incident.commander?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesDate = !filterDate || incident.date === filterDate;

        return matchesSearch && matchesDate;
    });

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 p-4 pb-20">
            <header className="mb-6">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                        Documentos Escaneados
                    </h1>
                    <button
                        onClick={() => router.push('/')}
                        className="text-sm font-medium text-gray-500 hover:text-gray-700"
                    >
                        Volver
                    </button>
                </div>

                {/* Search and Filter */}
                <div className="flex gap-3 mb-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar por N° Acto, dirección, comandante..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    <button className="p-3 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-gray-50 dark:hover:bg-neutral-700">
                        <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </button>
                </div>

                <div className="text-sm text-gray-500">
                    {filteredIncidents.length} documento{filteredIncidents.length !== 1 ? 's' : ''} encontrado{filteredIncidents.length !== 1 ? 's' : ''}
                </div>
            </header>

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            ) : filteredIncidents.length === 0 ? (
                <div className="text-center py-16">
                    <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg mb-2">No hay documentos escaneados</p>
                    <p className="text-gray-400 text-sm mb-6">Comienza escaneando tu primer informe</p>
                    <button
                        onClick={() => router.push('/scan')}
                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold"
                    >
                        Escanear Informe
                    </button>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredIncidents.map((incident) => (
                        <div
                            key={incident.id}
                            onClick={() => router.push(`/documents/${incident.id}`)}
                            className="bg-white dark:bg-neutral-800 rounded-2xl p-4 border border-gray-200 dark:border-neutral-700 hover:shadow-lg transition-all cursor-pointer group"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center justify-between gap-3 mb-2">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                                <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-lg">
                                                    Acto N° {incident.act_number || 'S/N'}
                                                </h3>
                                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                                    <Calendar className="w-3 h-3" />
                                                    <span>{incident.date} {incident.time}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={(e) => handleDelete(e, incident.id)}
                                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                            title="Eliminar documento"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>

                                    <div className="space-y-1 text-sm">
                                        {incident.address && (
                                            <div className="flex items-start gap-2 text-gray-600 dark:text-gray-400">
                                                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                                <span className="line-clamp-1">{incident.address}</span>
                                            </div>
                                        )}
                                        {incident.commander && (
                                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                                <User className="w-4 h-4 flex-shrink-0" />
                                                <span>{incident.commander}</span>
                                            </div>
                                        )}
                                        {incident.nature && (
                                            <div className="mt-2">
                                                <span className="inline-block px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-xs rounded-full">
                                                    {incident.nature}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {incident.observations && (
                                        <p className="mt-2 text-sm text-gray-500 line-clamp-2">
                                            {incident.observations}
                                        </p>
                                    )}
                                </div>

                                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all flex-shrink-0 ml-2 self-center" />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
