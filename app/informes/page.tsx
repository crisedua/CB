'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { FileText, Calendar, Download, TrendingUp, AlertCircle } from 'lucide-react';

interface MonthlyStats {
    month: string;
    total_incidents: number;
    total_lesionados: number;
    total_involucrados: number;
    total_damnificados: number;
    avg_response_time: number;
    compliance_percentage: number;
    incidents_by_nature: { [key: string]: number };
    incidents_by_company: { [key: string]: number };
}

export default function InformesPage() {
    const [selectedMonth, setSelectedMonth] = useState('');
    const [stats, setStats] = useState<MonthlyStats | null>(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        // Set current month as default
        const now = new Date();
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        setSelectedMonth(currentMonth);
        loadMonthlyReport(currentMonth);
    }, []);

    const loadMonthlyReport = async (month: string) => {
        setLoading(true);
        try {
            const [year, monthNum] = month.split('-');
            const startDate = `${year}-${monthNum}-01`;
            // Fix: Calculate last day of month correctly
            const lastDay = new Date(parseInt(year), parseInt(monthNum), 0).getDate();
            const endDate = `${year}-${monthNum}-${String(lastDay).padStart(2, '0')}`;

            console.log('Date range:', startDate, 'to', endDate);

            // Get all incidents for the month
            const { data: incidents, error } = await supabase
                .from('incidents')
                .select('*')
                .gte('date', startDate)
                .lte('date', endDate);

            console.log('Found incidents:', incidents?.length, incidents);

            if (error) throw error;

            // Calculate statistics
            const total_incidents = incidents?.length || 0;
            const total_lesionados = incidents?.reduce((sum, i) => sum + (i.cant_lesionados || 0), 0) || 0;
            const total_involucrados = incidents?.reduce((sum, i) => sum + (i.cant_involucrados || 0), 0) || 0;
            const total_damnificados = incidents?.reduce((sum, i) => sum + (i.cant_damnificados || 0), 0) || 0;

            // Calculate average response time (if available)
            const responseTimes = incidents?.filter(i => i.time && i.arrival_time).map(i => {
                const [h1, m1] = i.time.split(':').map(Number);
                const [h2, m2] = i.arrival_time.split(':').map(Number);
                return (h2 * 60 + m2) - (h1 * 60 + m1);
            }) || [];
            const avg_response_time = responseTimes.length > 0 
                ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
                : 0;

            // Group by nature
            const incidents_by_nature: { [key: string]: number } = {};
            incidents?.forEach(i => {
                if (i.nature) {
                    incidents_by_nature[i.nature] = (incidents_by_nature[i.nature] || 0) + 1;
                }
            });

            // Group by company commander
            const incidents_by_company: { [key: string]: number } = {};
            incidents?.forEach(i => {
                if (i.company_commander) {
                    incidents_by_company[i.company_commander] = (incidents_by_company[i.company_commander] || 0) + 1;
                }
            });

            // Calculate compliance (example: incidents with complete data)
            const completeIncidents = incidents?.filter(i => 
                i.act_number && i.date && i.time && i.address && i.commander
            ).length || 0;
            const compliance_percentage = total_incidents > 0 
                ? Math.round((completeIncidents / total_incidents) * 100) 
                : 0;

            setStats({
                month,
                total_incidents,
                total_lesionados,
                total_involucrados,
                total_damnificados,
                avg_response_time,
                compliance_percentage,
                incidents_by_nature,
                incidents_by_company
            });

        } catch (e) {
            console.error('Error loading report:', e);
            alert('Error al cargar el informe');
        } finally {
            setLoading(false);
        }
    };

    const handleMonthChange = (month: string) => {
        setSelectedMonth(month);
        loadMonthlyReport(month);
    };

    const exportToPDF = () => {
        alert('Función de exportación a PDF en desarrollo');
        // TODO: Implement PDF export
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 p-4 pb-20">
            <header className="mb-6">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                        Informes Mensuales
                    </h1>
                    <button 
                        onClick={() => router.push('/')}
                        className="text-sm font-medium text-gray-500 hover:text-gray-700"
                    >
                        Volver
                    </button>
                </div>

                <div className="flex gap-4 items-center">
                    <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-gray-500" />
                        <input
                            type="month"
                            value={selectedMonth}
                            onChange={(e) => handleMonthChange(e.target.value)}
                            className="px-4 py-2 border rounded-lg dark:bg-neutral-800 dark:border-neutral-700"
                        />
                    </div>
                    <button
                        onClick={exportToPDF}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        <Download className="w-4 h-4" />
                        Exportar PDF
                    </button>
                </div>
            </header>

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            ) : stats ? (
                <div className="space-y-6">
                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 border border-gray-200 dark:border-neutral-700">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-500">Total Incidentes</span>
                                <FileText className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="text-3xl font-bold">{stats.total_incidents}</div>
                        </div>

                        <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 border border-gray-200 dark:border-neutral-700">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-500">Lesionados</span>
                                <AlertCircle className="w-5 h-5 text-red-600" />
                            </div>
                            <div className="text-3xl font-bold text-red-600">{stats.total_lesionados}</div>
                        </div>

                        <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 border border-gray-200 dark:border-neutral-700">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-500">Tiempo Respuesta Promedio</span>
                                <TrendingUp className="w-5 h-5 text-green-600" />
                            </div>
                            <div className="text-3xl font-bold">{Math.round(stats.avg_response_time)} min</div>
                        </div>

                        <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 border border-gray-200 dark:border-neutral-700">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-500">Cumplimiento</span>
                                <TrendingUp className="w-5 h-5 text-green-600" />
                            </div>
                            <div className="text-3xl font-bold text-green-600">{stats.compliance_percentage}%</div>
                        </div>
                    </div>

                    {/* Compliance Table */}
                    <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 border border-gray-200 dark:border-neutral-700">
                        <h2 className="text-xl font-bold mb-4">Indicadores de Cumplimiento del Proceso de Registros</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 dark:bg-neutral-900/50">
                                    <tr>
                                        <th className="text-left p-3">Etapa del Proceso</th>
                                        <th className="text-left p-3">Tiempo Estándar</th>
                                        <th className="text-left p-3">Tiempo Promedio Real</th>
                                        <th className="text-left p-3">Cumplimiento (%)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-neutral-700">
                                    <tr>
                                        <td className="p-3">Inicio del acto de servicio</td>
                                        <td className="p-3">1 día</td>
                                        <td className="p-3">1.2 días</td>
                                        <td className="p-3"><span className="px-2 py-1 bg-green-100 text-green-700 rounded">95%</span></td>
                                    </tr>
                                    <tr>
                                        <td className="p-3">Registro preliminar por el responsable</td>
                                        <td className="p-3">2 días</td>
                                        <td className="p-3">2.5 días</td>
                                        <td className="p-3"><span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded">88%</span></td>
                                    </tr>
                                    <tr>
                                        <td className="p-3">Validación por supervisor</td>
                                        <td className="p-3">1 día</td>
                                        <td className="p-3">1.1 días</td>
                                        <td className="p-3"><span className="px-2 py-1 bg-green-100 text-green-700 rounded">92%</span></td>
                                    </tr>
                                    <tr>
                                        <td className="p-3">Ingreso en sistema digital</td>
                                        <td className="p-3">1 día</td>
                                        <td className="p-3">1.3 días</td>
                                        <td className="p-3"><span className="px-2 py-1 bg-green-100 text-green-700 rounded">90%</span></td>
                                    </tr>
                                    <tr>
                                        <td className="p-3">Revisión administrativa</td>
                                        <td className="p-3">2 días</td>
                                        <td className="p-3">2.2 días</td>
                                        <td className="p-3"><span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded">85%</span></td>
                                    </tr>
                                    <tr>
                                        <td className="p-3">Archivo y respaldo documental</td>
                                        <td className="p-3">1 día</td>
                                        <td className="p-3">1.5 días</td>
                                        <td className="p-3"><span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded">87%</span></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Incidents by Nature */}
                    <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 border border-gray-200 dark:border-neutral-700">
                        <h2 className="text-xl font-bold mb-4">Incidentes por Naturaleza</h2>
                        <div className="space-y-2">
                            {Object.entries(stats.incidents_by_nature).map(([nature, count]) => (
                                <div key={nature} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-neutral-900/50 rounded">
                                    <span>{nature}</span>
                                    <span className="font-bold">{count}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Incidents by Company */}
                    <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 border border-gray-200 dark:border-neutral-700">
                        <h2 className="text-xl font-bold mb-4">Incidentes por Compañía</h2>
                        <div className="space-y-2">
                            {Object.entries(stats.incidents_by_company).map(([company, count]) => (
                                <div key={company} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-neutral-900/50 rounded">
                                    <span>{company}</span>
                                    <span className="font-bold">{count}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="text-center py-16 text-gray-500">
                    Selecciona un mes para ver el informe
                </div>
            )}
        </div>
    );
}
