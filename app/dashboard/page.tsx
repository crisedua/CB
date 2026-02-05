'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { BarChart3, TrendingUp, Users, AlertTriangle, Clock, MapPin } from 'lucide-react';

interface DashboardStats {
    total_incidents: number;
    this_month: number;
    total_people: number;
    avg_response_time: number;
    recent_incidents: any[];
    top_locations: { location: string; count: number }[];
    incidents_trend: { month: string; count: number }[];
}

export default function DashboardPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        loadDashboard();
    }, []);

    const loadDashboard = async () => {
        setLoading(true);
        try {
            // Get all incidents
            const { data: allIncidents } = await supabase
                .from('incidents')
                .select('*')
                .order('created_at', { ascending: false });

            // Get this month's incidents
            const now = new Date();
            const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
            const { data: monthIncidents } = await supabase
                .from('incidents')
                .select('*')
                .gte('date', firstDay);

            // Get all people
            const { data: allPeople } = await supabase
                .from('incident_involved_people')
                .select('*');

            // Calculate stats
            const total_incidents = allIncidents?.length || 0;
            const this_month = monthIncidents?.length || 0;
            const total_people = allPeople?.length || 0;

            // Calculate average response time
            const responseTimes = allIncidents?.filter(i => i.time && i.arrival_time).map(i => {
                const [h1, m1] = i.time.split(':').map(Number);
                const [h2, m2] = i.arrival_time.split(':').map(Number);
                return (h2 * 60 + m2) - (h1 * 60 + m1);
            }) || [];
            const avg_response_time = responseTimes.length > 0 
                ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
                : 0;

            // Recent incidents
            const recent_incidents = allIncidents?.slice(0, 5) || [];

            // Top locations
            const locationCounts: { [key: string]: number } = {};
            allIncidents?.forEach(i => {
                if (i.address) {
                    locationCounts[i.address] = (locationCounts[i.address] || 0) + 1;
                }
            });
            const top_locations = Object.entries(locationCounts)
                .map(([location, count]) => ({ location, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 5);

            // Incidents trend (last 6 months)
            const incidents_trend: { month: string; count: number }[] = [];
            for (let i = 5; i >= 0; i--) {
                const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const monthStr = date.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
                const monthStart = new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
                const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0];
                
                const count = allIncidents?.filter(i => 
                    i.date >= monthStart && i.date <= monthEnd
                ).length || 0;
                
                incidents_trend.push({ month: monthStr, count });
            }

            setStats({
                total_incidents,
                this_month,
                total_people,
                avg_response_time,
                recent_incidents,
                top_locations,
                incidents_trend
            });

        } catch (e) {
            console.error('Error loading dashboard:', e);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 p-4 pb-20">
            <header className="mb-6">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                        Cuadro de Mando
                    </h1>
                    <button 
                        onClick={() => router.push('/')}
                        className="text-sm font-medium text-gray-500 hover:text-gray-700"
                    >
                        Volver
                    </button>
                </div>
            </header>

            {stats && (
                <div className="space-y-6">
                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-6 shadow-lg">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm opacity-90">Total Incidentes</span>
                                <BarChart3 className="w-6 h-6 opacity-80" />
                            </div>
                            <div className="text-4xl font-bold">{stats.total_incidents}</div>
                            <div className="text-xs opacity-75 mt-2">Histórico completo</div>
                        </div>

                        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl p-6 shadow-lg">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm opacity-90">Este Mes</span>
                                <TrendingUp className="w-6 h-6 opacity-80" />
                            </div>
                            <div className="text-4xl font-bold">{stats.this_month}</div>
                            <div className="text-xs opacity-75 mt-2">Incidentes actuales</div>
                        </div>

                        <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-xl p-6 shadow-lg">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm opacity-90">Personas Involucradas</span>
                                <Users className="w-6 h-6 opacity-80" />
                            </div>
                            <div className="text-4xl font-bold">{stats.total_people}</div>
                            <div className="text-xs opacity-75 mt-2">Total registradas</div>
                        </div>

                        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl p-6 shadow-lg">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm opacity-90">Tiempo Respuesta</span>
                                <Clock className="w-6 h-6 opacity-80" />
                            </div>
                            <div className="text-4xl font-bold">{stats.avg_response_time}</div>
                            <div className="text-xs opacity-75 mt-2">Minutos promedio</div>
                        </div>
                    </div>

                    {/* Charts Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Incidents Trend */}
                        <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 border border-gray-200 dark:border-neutral-700">
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-blue-600" />
                                Tendencia de Incidentes (6 meses)
                            </h2>
                            <div className="space-y-3">
                                {stats.incidents_trend.map((item, idx) => {
                                    const maxCount = Math.max(...stats.incidents_trend.map(i => i.count));
                                    const percentage = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
                                    return (
                                        <div key={idx}>
                                            <div className="flex items-center justify-between text-sm mb-1">
                                                <span className="font-medium">{item.month}</span>
                                                <span className="text-gray-600 dark:text-gray-400">{item.count}</span>
                                            </div>
                                            <div className="w-full bg-gray-200 dark:bg-neutral-700 rounded-full h-2">
                                                <div 
                                                    className="bg-blue-600 h-2 rounded-full transition-all"
                                                    style={{ width: `${percentage}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Top Locations */}
                        <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 border border-gray-200 dark:border-neutral-700">
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-red-600" />
                                Ubicaciones Más Frecuentes
                            </h2>
                            <div className="space-y-3">
                                {stats.top_locations.map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-3">
                                        <div className="flex-shrink-0 w-8 h-8 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full flex items-center justify-center font-bold text-sm">
                                            {idx + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium truncate">{item.location}</div>
                                            <div className="text-xs text-gray-500">{item.count} incidentes</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Recent Incidents */}
                    <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 border border-gray-200 dark:border-neutral-700">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-orange-600" />
                            Incidentes Recientes
                        </h2>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 dark:bg-neutral-900/50">
                                    <tr>
                                        <th className="text-left p-3">N° Acto</th>
                                        <th className="text-left p-3">Fecha</th>
                                        <th className="text-left p-3">Dirección</th>
                                        <th className="text-left p-3">Naturaleza</th>
                                        <th className="text-left p-3">Comandante</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-neutral-700">
                                    {stats.recent_incidents.map((incident) => (
                                        <tr 
                                            key={incident.id}
                                            onClick={() => router.push(`/documents/${incident.id}`)}
                                            className="hover:bg-gray-50 dark:hover:bg-neutral-900/50 cursor-pointer"
                                        >
                                            <td className="p-3 font-medium">{incident.act_number || '-'}</td>
                                            <td className="p-3">{incident.date || '-'}</td>
                                            <td className="p-3">{incident.address || '-'}</td>
                                            <td className="p-3">{incident.nature || '-'}</td>
                                            <td className="p-3">{incident.commander || '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
