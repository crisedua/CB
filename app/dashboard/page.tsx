'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import {
    BarChart3, TrendingUp, Users, AlertTriangle, Clock, MapPin,
    RefreshCw, Filter, Calendar, Shield, Home, Activity,
    Flame, Heart, Building2
} from 'lucide-react';
import {
    PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, ResponsiveContainer, LineChart, Line
} from 'recharts';

interface DashboardStats {
    total_incidents: number;
    this_month: number;
    total_people: number;
    total_lesionados: number;
    total_damnificados: number;
    avg_response_time: number;
    insurance_percentage: number;
    rural_percentage: number;
    recent_incidents: any[];
    top_locations: { location: string; count: number }[];
    incidents_trend: { month: string; count: number }[];
    incidents_by_nature: { name: string; value: number }[];
    incidents_by_hour: { hour: string; count: number }[];
    company_attendance: { company: string; total: number }[];
    response_time_distribution: { range: string; count: number }[];
    incidents_by_source_company: { name: string; value: number }[];
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

const SOURCE_COMPANY_LABELS: { [key: string]: string } = {
    'primera': '1ª Compañía',
    'segunda': '2ª Compañía',
    'tercera': '3ª Compañía',
    'cuarta': '4ª Compañía',
    'quinta': '5ª Compañía',
    'sexta': '6ª Compañía',
    'septima': '7ª Compañía',
    'octava': '8ª Compañía',
};

export default function DashboardPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [autoRefresh, setAutoRefresh] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [dateFilter, setDateFilter] = useState<'all' | '7d' | '30d' | '90d' | 'year'>('all');
    const router = useRouter();

    const loadDashboard = useCallback(async () => {
        setLoading(true);
        try {
            // Build date filter
            let dateQuery = supabase.from('incidents').select('*');
            const now = new Date();

            if (dateFilter !== 'all') {
                const days = dateFilter === '7d' ? 7 : dateFilter === '30d' ? 30 : dateFilter === '90d' ? 90 : 365;
                const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                dateQuery = dateQuery.gte('date', startDate);
            }

            const { data: allIncidents } = await dateQuery.order('created_at', { ascending: false });

            // Get this month's incidents
            const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
            const { data: monthIncidents } = await supabase
                .from('incidents')
                .select('*')
                .gte('date', firstDay);

            // Get all people
            const { data: allPeople } = await supabase
                .from('incident_involved_people')
                .select('*');

            // Calculate basic stats
            const total_incidents = allIncidents?.length || 0;
            const this_month = monthIncidents?.length || 0;
            const total_people = allPeople?.length || 0;

            // Casualties
            const total_lesionados = allIncidents?.reduce((sum, i) => sum + (i.cant_lesionados || 0), 0) || 0;
            const total_damnificados = allIncidents?.reduce((sum, i) => sum + (i.cant_damnificados || 0), 0) || 0;

            // Insurance percentage
            const withInsurance = allIncidents?.filter(i => i.has_insurance === true).length || 0;
            const insurance_percentage = total_incidents > 0 ? Math.round((withInsurance / total_incidents) * 100) : 0;

            // Rural percentage
            const ruralCount = allIncidents?.filter(i => i.sector_rural === true).length || 0;
            const rural_percentage = total_incidents > 0 ? Math.round((ruralCount / total_incidents) * 100) : 0;

            // Average response time
            const responseTimes = allIncidents?.filter(i => i.time && i.arrival_time).map(i => {
                const [h1, m1] = i.time.split(':').map(Number);
                const [h2, m2] = i.arrival_time.split(':').map(Number);
                return (h2 * 60 + m2) - (h1 * 60 + m1);
            }).filter(t => t > 0 && t < 120) || [];
            const avg_response_time = responseTimes.length > 0
                ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
                : 0;

            // Response time distribution
            const response_time_distribution = [
                { range: '<5 min', count: responseTimes.filter(t => t < 5).length },
                { range: '5-10 min', count: responseTimes.filter(t => t >= 5 && t < 10).length },
                { range: '10-15 min', count: responseTimes.filter(t => t >= 10 && t < 15).length },
                { range: '15-20 min', count: responseTimes.filter(t => t >= 15 && t < 20).length },
                { range: '>20 min', count: responseTimes.filter(t => t >= 20).length },
            ];

            // Recent incidents
            const recent_incidents = allIncidents?.slice(0, 5) || [];

            // Top locations
            const locationCounts: { [key: string]: number } = {};
            allIncidents?.forEach(i => {
                if (i.commune) {
                    locationCounts[i.commune] = (locationCounts[i.commune] || 0) + 1;
                }
            });
            const top_locations = Object.entries(locationCounts)
                .map(([location, count]) => ({ location, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 5);

            // Incidents by nature
            const natureCounts: { [key: string]: number } = {};
            allIncidents?.forEach(i => {
                const nature = i.nature || 'Sin especificar';
                natureCounts[nature] = (natureCounts[nature] || 0) + 1;
            });
            const incidents_by_nature = Object.entries(natureCounts)
                .map(([name, value]) => ({ name, value }))
                .sort((a, b) => b.value - a.value)
                .slice(0, 8);

            // Incidents by hour
            const hourCounts: { [key: string]: number } = {};
            for (let h = 0; h < 24; h++) {
                hourCounts[`${h.toString().padStart(2, '0')}:00`] = 0;
            }
            allIncidents?.forEach(i => {
                if (i.time) {
                    const hour = i.time.split(':')[0];
                    const key = `${hour}:00`;
                    if (hourCounts[key] !== undefined) {
                        hourCounts[key]++;
                    }
                }
            });
            const incidents_by_hour = Object.entries(hourCounts)
                .map(([hour, count]) => ({ hour, count }));

            // Company attendance
            const companyTotals = [
                { company: '5ª', total: allIncidents?.reduce((sum, i) => sum + (i.company_quinta || 0), 0) || 0 },
                { company: '1ª', total: allIncidents?.reduce((sum, i) => sum + (i.company_primera || 0), 0) || 0 },
                { company: '2ª', total: allIncidents?.reduce((sum, i) => sum + (i.company_segunda || 0), 0) || 0 },
                { company: '3ª', total: allIncidents?.reduce((sum, i) => sum + (i.company_tercera || 0), 0) || 0 },
                { company: '4ª', total: allIncidents?.reduce((sum, i) => sum + (i.company_cuarta || 0), 0) || 0 },
                { company: '6ª', total: allIncidents?.reduce((sum, i) => sum + (i.company_sexta || 0), 0) || 0 },
                { company: '7ª', total: allIncidents?.reduce((sum, i) => sum + (i.company_septima || 0), 0) || 0 },
                { company: '8ª', total: allIncidents?.reduce((sum, i) => sum + (i.company_octava || 0), 0) || 0 },
            ].filter(c => c.total > 0);

            // Incidents trend (last 6 months)
            const incidents_trend: { month: string; count: number }[] = [];
            for (let i = 5; i >= 0; i--) {
                const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const monthStr = date.toLocaleDateString('es-ES', { month: 'short' });
                const monthStart = new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
                const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0];

                const count = allIncidents?.filter(i =>
                    i.date >= monthStart && i.date <= monthEnd
                ).length || 0;

                incidents_trend.push({ month: monthStr, count });
            }

            // Incidents by source company
            const sourceCompanyCounts: { [key: string]: number } = {};
            allIncidents?.forEach(i => {
                if (i.source_company) {
                    const label = SOURCE_COMPANY_LABELS[i.source_company] || i.source_company;
                    sourceCompanyCounts[label] = (sourceCompanyCounts[label] || 0) + 1;
                }
            });
            const incidents_by_source_company = Object.entries(sourceCompanyCounts)
                .map(([name, value]) => ({ name, value }))
                .sort((a, b) => b.value - a.value);

            setStats({
                total_incidents,
                this_month,
                total_people,
                total_lesionados,
                total_damnificados,
                avg_response_time,
                insurance_percentage,
                rural_percentage,
                recent_incidents,
                top_locations,
                incidents_trend,
                incidents_by_nature,
                incidents_by_hour,
                company_attendance: companyTotals,
                response_time_distribution,
                incidents_by_source_company
            });
            setLastUpdated(new Date());

        } catch (e) {
            console.error('Error loading dashboard:', e);
        } finally {
            setLoading(false);
        }
    }, [dateFilter]);

    useEffect(() => {
        loadDashboard();
    }, [loadDashboard]);

    // Auto refresh
    useEffect(() => {
        if (autoRefresh) {
            const interval = setInterval(loadDashboard, 30000); // 30 seconds
            return () => clearInterval(interval);
        }
    }, [autoRefresh, loadDashboard]);

    if (loading && !stats) {
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
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => router.push('/')}
                            className="text-sm font-medium text-gray-500 hover:text-gray-700"
                        >
                            Volver
                        </button>
                    </div>
                </div>

                {/* Filters Row */}
                <div className="flex flex-wrap items-center gap-3 mb-4">
                    <div className="flex items-center gap-2 bg-white dark:bg-neutral-800 rounded-lg p-1 border border-gray-200 dark:border-neutral-700">
                        {[
                            { value: 'all', label: 'Todo' },
                            { value: '7d', label: '7 días' },
                            { value: '30d', label: '30 días' },
                            { value: '90d', label: '90 días' },
                            { value: 'year', label: 'Año' },
                        ].map(filter => (
                            <button
                                key={filter.value}
                                onClick={() => setDateFilter(filter.value as any)}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${dateFilter === filter.value
                                    ? 'bg-blue-600 text-white'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-700'
                                    }`}
                            >
                                {filter.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-2 ml-auto">
                        <button
                            onClick={() => setAutoRefresh(!autoRefresh)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${autoRefresh
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-gray-100 text-gray-600 dark:bg-neutral-800 dark:text-gray-400'
                                }`}
                        >
                            <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
                            {autoRefresh ? 'Auto' : 'Manual'}
                        </button>
                        <button
                            onClick={loadDashboard}
                            disabled={loading}
                            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            Actualizar
                        </button>
                    </div>
                </div>

                {lastUpdated && (
                    <div className="text-xs text-gray-500">
                        Última actualización: {lastUpdated.toLocaleTimeString('es-ES')}
                    </div>
                )}
            </header>

            {stats && (
                <div className="space-y-6">
                    {/* KPI Cards - Row 1 */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-4 shadow-lg">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm opacity-90">Total Incidentes</span>
                                <BarChart3 className="w-5 h-5 opacity-80" />
                            </div>
                            <div className="text-3xl font-bold">{stats.total_incidents}</div>
                            <div className="text-xs opacity-75 mt-1">Período seleccionado</div>
                        </div>

                        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl p-4 shadow-lg">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm opacity-90">Este Mes</span>
                                <TrendingUp className="w-5 h-5 opacity-80" />
                            </div>
                            <div className="text-3xl font-bold">{stats.this_month}</div>
                            <div className="text-xs opacity-75 mt-1">Incidentes actuales</div>
                        </div>

                        <div className="bg-gradient-to-br from-red-500 to-red-600 text-white rounded-xl p-4 shadow-lg">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm opacity-90">Lesionados</span>
                                <Heart className="w-5 h-5 opacity-80" />
                            </div>
                            <div className="text-3xl font-bold">{stats.total_lesionados}</div>
                            <div className="text-xs opacity-75 mt-1">Personas heridas</div>
                        </div>

                        <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-xl p-4 shadow-lg">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm opacity-90">Damnificados</span>
                                <Users className="w-5 h-5 opacity-80" />
                            </div>
                            <div className="text-3xl font-bold">{stats.total_damnificados}</div>
                            <div className="text-xs opacity-75 mt-1">Personas afectadas</div>
                        </div>
                    </div>

                    {/* KPI Cards - Row 2 */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl p-4 shadow-lg">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm opacity-90">Tiempo Respuesta</span>
                                <Clock className="w-5 h-5 opacity-80" />
                            </div>
                            <div className="text-3xl font-bold">{stats.avg_response_time}<span className="text-lg"> min</span></div>
                            <div className="text-xs opacity-75 mt-1">Promedio</div>
                        </div>

                        <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 text-white rounded-xl p-4 shadow-lg">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm opacity-90">Con Seguro</span>
                                <Shield className="w-5 h-5 opacity-80" />
                            </div>
                            <div className="text-3xl font-bold">{stats.insurance_percentage}%</div>
                            <div className="text-xs opacity-75 mt-1">Cobertura</div>
                        </div>

                        <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-xl p-4 shadow-lg">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm opacity-90">Sector Rural</span>
                                <Home className="w-5 h-5 opacity-80" />
                            </div>
                            <div className="text-3xl font-bold">{stats.rural_percentage}%</div>
                            <div className="text-xs opacity-75 mt-1">del total</div>
                        </div>

                        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-xl p-4 shadow-lg">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm opacity-90">Personas Involucradas</span>
                                <Activity className="w-5 h-5 opacity-80" />
                            </div>
                            <div className="text-3xl font-bold">{stats.total_people}</div>
                            <div className="text-xs opacity-75 mt-1">Registradas</div>
                        </div>
                    </div>

                    {/* Charts Row 1 */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Incidents by Nature - Pie Chart */}
                        <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 border border-gray-200 dark:border-neutral-700">
                            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <Flame className="w-5 h-5 text-orange-600" />
                                Incidentes por Naturaleza
                            </h2>
                            {stats.incidents_by_nature.length > 0 ? (
                                <ResponsiveContainer width="100%" height={250}>
                                    <PieChart>
                                        <Pie
                                            data={stats.incidents_by_nature}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={100}
                                            paddingAngle={2}
                                            dataKey="value"
                                            label={({ name, percent }: { name?: string; percent?: number }) => {
                                                const displayName = name || 'Sin datos';
                                                const displayPercent = percent || 0;
                                                return `${displayName.substring(0, 15)}${displayName.length > 15 ? '...' : ''} (${(displayPercent * 100).toFixed(0)}%)`;
                                            }}
                                            labelLine={false}
                                        >
                                            {stats.incidents_by_nature.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-[250px] flex items-center justify-center text-gray-500">
                                    No hay datos
                                </div>
                            )}
                        </div>

                        {/* Incidents Trend - Line Chart */}
                        <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 border border-gray-200 dark:border-neutral-700">
                            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-blue-600" />
                                Tendencia (6 meses)
                            </h2>
                            <ResponsiveContainer width="100%" height={250}>
                                <LineChart data={stats.incidents_trend}>
                                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                                    <YAxis tick={{ fontSize: 12 }} />
                                    <Tooltip />
                                    <Line
                                        type="monotone"
                                        dataKey="count"
                                        stroke="#3B82F6"
                                        strokeWidth={3}
                                        dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Charts Row 2 */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Response Time Distribution */}
                        <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 border border-gray-200 dark:border-neutral-700">
                            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <Clock className="w-5 h-5 text-purple-600" />
                                Distribución Tiempo de Respuesta
                            </h2>
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={stats.response_time_distribution}>
                                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                    <XAxis dataKey="range" tick={{ fontSize: 11 }} />
                                    <YAxis tick={{ fontSize: 12 }} />
                                    <Tooltip />
                                    <Bar dataKey="count" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Company Attendance */}
                        <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 border border-gray-200 dark:border-neutral-700">
                            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <Building2 className="w-5 h-5 text-red-600" />
                                Asistencia por Compañía
                            </h2>
                            {stats.company_attendance.length > 0 ? (
                                <ResponsiveContainer width="100%" height={250}>
                                    <BarChart data={stats.company_attendance} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                        <XAxis type="number" tick={{ fontSize: 12 }} />
                                        <YAxis dataKey="company" type="category" tick={{ fontSize: 12 }} width={40} />
                                        <Tooltip />
                                        <Bar dataKey="total" fill="#EF4444" radius={[0, 4, 4, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-[250px] flex items-center justify-center text-gray-500">
                                    No hay datos de asistencia
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Source Company Chart - Who uploaded */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 border border-gray-200 dark:border-neutral-700">
                            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <Building2 className="w-5 h-5 text-green-600" />
                                Informes por Compañía (Origen)
                            </h2>
                            {stats.incidents_by_source_company.length > 0 ? (
                                <ResponsiveContainer width="100%" height={250}>
                                    <BarChart data={stats.incidents_by_source_company} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                        <XAxis type="number" tick={{ fontSize: 12 }} />
                                        <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={80} />
                                        <Tooltip />
                                        <Bar dataKey="value" fill="#10B981" radius={[0, 4, 4, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-[250px] flex items-center justify-center text-gray-500">
                                    No hay datos de origen
                                </div>
                            )}
                        </div>

                        {/* Hour of Day Chart */}
                        <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 border border-gray-200 dark:border-neutral-700">
                            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <Clock className="w-5 h-5 text-cyan-600" />
                                Incidentes por Hora del Día
                            </h2>
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={stats.incidents_by_hour}>
                                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                    <XAxis dataKey="hour" tick={{ fontSize: 10 }} interval={1} />
                                    <YAxis tick={{ fontSize: 12 }} />
                                    <Tooltip />
                                    <Bar dataKey="count" fill="#06B6D4" radius={[2, 2, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Bottom Row: Top Locations + Recent Incidents */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Top Locations */}
                        <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 border border-gray-200 dark:border-neutral-700">
                            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-red-600" />
                                Comunas Más Frecuentes
                            </h2>
                            <div className="space-y-3">
                                {stats.top_locations.length > 0 ? stats.top_locations.map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-3">
                                        <div className="flex-shrink-0 w-8 h-8 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full flex items-center justify-center font-bold text-sm">
                                            {idx + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium truncate">{item.location}</div>
                                            <div className="text-xs text-gray-500">{item.count} incidentes</div>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="text-gray-500 text-center py-8">No hay datos</div>
                                )}
                            </div>
                        </div>

                        {/* Recent Incidents */}
                        <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 border border-gray-200 dark:border-neutral-700">
                            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-orange-600" />
                                Incidentes Recientes
                            </h2>
                            <div className="space-y-2">
                                {stats.recent_incidents.length > 0 ? stats.recent_incidents.map((incident) => (
                                    <div
                                        key={incident.id}
                                        onClick={() => router.push(`/documents/${incident.id}`)}
                                        className="p-3 bg-gray-50 dark:bg-neutral-900/50 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-neutral-900 transition-colors"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium">Acto {incident.act_number || 'S/N'}</span>
                                            <span className="text-xs text-gray-500">{incident.date || '-'}</span>
                                        </div>
                                        <div className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                            {incident.address || incident.nature || 'Sin detalles'}
                                        </div>
                                    </div>
                                )) : (
                                    <div className="text-gray-500 text-center py-8">No hay incidentes</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
