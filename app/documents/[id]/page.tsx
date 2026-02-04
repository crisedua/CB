'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, MapPin, User, Car, Users, Building2, FileText, Trash2 } from 'lucide-react';

interface Incident {
    id: string;
    created_at: string;
    act_number: string;
    date: string;
    time: string;
    return_time: string;
    address: string;
    corner: string;
    area: string;
    commune: string;
    commander: string;
    company_commander: string;
    nature: string;
    origin: string;
    cause: string;
    observations: string;
    other_observations: string;
    raw_data: any;
}

interface Vehicle {
    brand: string;
    model: string;
    plate: string;
    driver: string;
    run: string;
}

interface Person {
    name: string;
    run: string;
    attended_by_132: boolean;
    observation: string;
    status: string;
}

export default function DocumentDetailPage({ params }: { params: { id: string } }) {
    const [incident, setIncident] = useState<Incident | null>(null);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [people, setPeople] = useState<Person[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        loadIncident();
    }, [params.id]);

    const loadIncident = async () => {
        setLoading(true);
        try {
            const { data: incidentData, error: incidentError } = await supabase
                .from('incidents')
                .select('*')
                .eq('id', params.id)
                .single();

            if (incidentError) throw incidentError;
            setIncident(incidentData);

            const { data: vehiclesData } = await supabase
                .from('incident_vehicles')
                .select('*')
                .eq('incident_id', params.id);
            setVehicles(vehiclesData || []);

            const { data: peopleData } = await supabase
                .from('incident_involved_people')
                .select('*')
                .eq('incident_id', params.id);
            setPeople(peopleData || []);

        } catch (e) {
            console.error('Error loading incident:', e);
            alert('Error al cargar el documento');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('¿Estás seguro de eliminar este documento?')) return;

        try {
            const { error } = await supabase
                .from('incidents')
                .delete()
                .eq('id', params.id);

            if (error) throw error;
            
            alert('Documento eliminado');
            router.push('/documents');
        } catch (e) {
            console.error('Error deleting:', e);
            alert('Error al eliminar');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!incident) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-500 mb-4">Documento no encontrado</p>
                    <button onClick={() => router.push('/documents')} className="text-blue-600">
                        Volver a documentos
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 p-4 pb-20">
            <header className="mb-6">
                <button
                    onClick={() => router.push('/documents')}
                    className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 mb-4"
                >
                    <ArrowLeft className="w-5 h-5" />
                    <span>Volver a documentos</span>
                </button>

                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">Acto N° {incident.act_number}</h1>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                <span>{incident.date} {incident.time}</span>
                            </div>
                            {incident.return_time && (
                                <span>Regreso: {incident.return_time}</span>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={handleDelete}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                    >
                        <Trash2 className="w-5 h-5" />
                    </button>
                </div>
            </header>

            <div className="space-y-4">
                {/* Location */}
                <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 border border-gray-200 dark:border-neutral-700">
                    <div className="flex items-center gap-2 mb-4">
                        <MapPin className="w-5 h-5 text-blue-600" />
                        <h2 className="font-bold text-lg">Ubicación</h2>
                    </div>
                    <div className="space-y-2 text-sm">
                        <div><span className="font-semibold">Dirección:</span> {incident.address}</div>
                        {incident.corner && <div><span className="font-semibold">Esquina:</span> {incident.corner}</div>}
                        {incident.area && <div><span className="font-semibold">Sector:</span> {incident.area}</div>}
                        {incident.commune && <div><span className="font-semibold">Comuna:</span> {incident.commune}</div>}
                    </div>
                </div>

                {/* Command */}
                <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 border border-gray-200 dark:border-neutral-700">
                    <div className="flex items-center gap-2 mb-4">
                        <User className="w-5 h-5 text-blue-600" />
                        <h2 className="font-bold text-lg">Comando</h2>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <div className="text-gray-500 text-xs mb-1">A Cargo del Cuerpo</div>
                            <div className="font-semibold">{incident.commander || '-'}</div>
                        </div>
                        <div>
                            <div className="text-gray-500 text-xs mb-1">A Cargo de la Compañía</div>
                            <div className="font-semibold">{incident.company_commander || '-'}</div>
                        </div>
                    </div>
                </div>

                {/* Incident Details */}
                <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 border border-gray-200 dark:border-neutral-700">
                    <div className="flex items-center gap-2 mb-4">
                        <FileText className="w-5 h-5 text-orange-600" />
                        <h2 className="font-bold text-lg">Detalles del Incidente</h2>
                    </div>
                    <div className="space-y-3 text-sm">
                        {incident.nature && (
                            <div>
                                <div className="text-gray-500 text-xs mb-1">Naturaleza</div>
                                <div className="font-semibold">{incident.nature}</div>
                            </div>
                        )}
                        {incident.origin && (
                            <div>
                                <div className="text-gray-500 text-xs mb-1">Origen</div>
                                <div>{incident.origin}</div>
                            </div>
                        )}
                        {incident.cause && (
                            <div>
                                <div className="text-gray-500 text-xs mb-1">Causa</div>
                                <div>{incident.cause}</div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Vehicles */}
                {vehicles.length > 0 && (
                    <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 border border-gray-200 dark:border-neutral-700">
                        <div className="flex items-center gap-2 mb-4">
                            <Car className="w-5 h-5 text-blue-600" />
                            <h2 className="font-bold text-lg">Vehículos ({vehicles.length})</h2>
                        </div>
                        <div className="space-y-3">
                            {vehicles.map((vehicle, idx) => (
                                <div key={idx} className="p-3 bg-gray-50 dark:bg-neutral-900/50 rounded-lg">
                                    <div className="font-semibold">{vehicle.brand} {vehicle.model}</div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                        Patente: {vehicle.plate}
                                    </div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                        Conductor: {vehicle.driver} - {vehicle.run}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* People */}
                {people.length > 0 && (
                    <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 border border-gray-200 dark:border-neutral-700">
                        <div className="flex items-center gap-2 mb-4">
                            <Users className="w-5 h-5 text-blue-600" />
                            <h2 className="font-bold text-lg">Personas Involucradas ({people.length})</h2>
                        </div>
                        <div className="space-y-3">
                            {people.map((person, idx) => (
                                <div key={idx} className="p-3 bg-gray-50 dark:bg-neutral-900/50 rounded-lg">
                                    <div className="font-semibold">{person.name}</div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                        RUN: {person.run || 'N/A'}
                                    </div>
                                    {person.attended_by_132 && (
                                        <div className="text-sm text-red-600 font-semibold mt-1">
                                            ✓ Atendido por 132
                                        </div>
                                    )}
                                    {person.status && (
                                        <div className="text-sm text-gray-600 dark:text-gray-400">
                                            Estado: {person.status}
                                        </div>
                                    )}
                                    {person.observation && (
                                        <div className="text-sm text-gray-500 italic mt-1">
                                            {person.observation}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Observations */}
                {(incident.observations || incident.other_observations) && (
                    <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 border border-gray-200 dark:border-neutral-700">
                        <h2 className="font-bold text-lg mb-4">Observaciones</h2>
                        {incident.observations && (
                            <div className="mb-4">
                                <div className="text-sm text-gray-500 mb-2">Observaciones Principales</div>
                                <div className="text-sm whitespace-pre-wrap">{incident.observations}</div>
                            </div>
                        )}
                        {incident.other_observations && (
                            <div>
                                <div className="text-sm text-gray-500 mb-2">Otras Observaciones</div>
                                <div className="text-sm whitespace-pre-wrap">{incident.other_observations}</div>
                            </div>
                        )}
                    </div>
                )}

                {/* Raw Data (for debugging) */}
                {incident.raw_data && (
                    <details className="bg-white dark:bg-neutral-800 rounded-2xl p-6 border border-gray-200 dark:border-neutral-700">
                        <summary className="font-bold cursor-pointer">Datos Completos (JSON)</summary>
                        <pre className="mt-4 text-xs overflow-auto p-4 bg-gray-50 dark:bg-neutral-900/50 rounded-lg">
                            {JSON.stringify(incident.raw_data, null, 2)}
                        </pre>
                    </details>
                )}
            </div>
        </div>
    );
}
