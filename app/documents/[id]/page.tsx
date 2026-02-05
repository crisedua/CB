'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, Trash2, RefreshCw, Edit2, Save, X } from 'lucide-react';

import EditableField from './EditableField';

interface Incident {
    id: string;
    created_at: string;
    scanned_images: string[];
    act_number: string;
    incident_number: string;
    list_number: string;
    date: string;
    time: string;
    arrival_time: string;
    return_time: string;
    retired_time: string;
    address: string;
    corner: string;
    area: string;
    commune: string;
    population: string;
    commander: string;
    company_commander: string;
    company_number: string;
    department: string;
    floor: string;
    nature: string;
    fire_rescue_location: string;
    origin: string;
    cause: string;
    damage: string;
    has_insurance: boolean;
    insurance_company: string;
    mobile_units: string[];
    insurance_conductors: string;
    other_classes: string;
    company_quinta: number;
    company_primera: number;
    company_segunda: number;
    company_tercera: number;
    company_cuarta: number;
    company_sexta: number;
    company_septima: number;
    company_octava: number;
    company_bc_bp: number;
    attendance_correction: string;
    sector_rural: boolean;
    sector_location: string;
    sector_numbers: number[];
    cant_lesionados: number;
    cant_involucrados: number;
    cant_damnificados: number;
    cant_7_3: number;
    observations: string;
    other_observations: string;
    report_prepared_by: string;
    list_prepared_by: string;
    officer_in_charge: string;
    called_by_command: string;
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

interface Institution {
    institution_type: string;
    present: boolean;
    name: string;
    grade: string;
    comisaria: string;
    movil: string;
    cargo: string;
    entidad: string;
}

export default function DocumentDetailPage({ params }: { params: { id: string } }) {
    const [incident, setIncident] = useState<Incident | null>(null);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [people, setPeople] = useState<Person[]>([]);
    const [institutions, setInstitutions] = useState<Institution[]>([]);
    const [loading, setLoading] = useState(true);
    const [rescanning, setRescanning] = useState(false);
    const [editing, setEditing] = useState(false);
    const [editedIncident, setEditedIncident] = useState<Incident | null>(null);
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

            const { data: institutionsData } = await supabase
                .from('incident_institutions')
                .select('*')
                .eq('incident_id', params.id);
            setInstitutions(institutionsData || []);

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

    const handleEdit = () => {
        setEditedIncident({ ...incident! });
        setEditing(true);
    };

    const handleCancelEdit = () => {
        setEditedIncident(null);
        setEditing(false);
    };

    const handleSaveEdit = async () => {
        if (!editedIncident) return;

        try {
            // Convert date if needed
            let formattedDate = editedIncident.date;
            if (formattedDate && formattedDate.includes('/')) {
                const parts = formattedDate.split('/');
                if (parts.length === 3) {
                    formattedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
                }
            }

            const { error } = await supabase
                .from('incidents')
                .update({
                    act_number: editedIncident.act_number,
                    incident_number: editedIncident.incident_number,
                    list_number: editedIncident.list_number,
                    date: formattedDate,
                    time: editedIncident.time,
                    arrival_time: editedIncident.arrival_time,
                    return_time: editedIncident.return_time,
                    retired_time: editedIncident.retired_time,
                    commander: editedIncident.commander,
                    company_commander: editedIncident.company_commander,
                    company_number: editedIncident.company_number,
                    department: editedIncident.department,
                    floor: editedIncident.floor,
                    address: editedIncident.address,
                    corner: editedIncident.corner,
                    area: editedIncident.area,
                    commune: editedIncident.commune,
                    population: editedIncident.population,
                    nature: editedIncident.nature,
                    fire_rescue_location: editedIncident.fire_rescue_location,
                    origin: editedIncident.origin,
                    cause: editedIncident.cause,
                    damage: editedIncident.damage,
                    has_insurance: editedIncident.has_insurance,
                    insurance_company: editedIncident.insurance_company,
                    mobile_units: editedIncident.mobile_units,
                    insurance_conductors: editedIncident.insurance_conductors,
                    other_classes: editedIncident.other_classes,
                    company_quinta: editedIncident.company_quinta,
                    company_primera: editedIncident.company_primera,
                    company_segunda: editedIncident.company_segunda,
                    company_tercera: editedIncident.company_tercera,
                    company_cuarta: editedIncident.company_cuarta,
                    company_sexta: editedIncident.company_sexta,
                    company_septima: editedIncident.company_septima,
                    company_octava: editedIncident.company_octava,
                    company_bc_bp: editedIncident.company_bc_bp,
                    attendance_correction: editedIncident.attendance_correction,
                    sector_rural: editedIncident.sector_rural,
                    sector_location: editedIncident.sector_location,
                    sector_numbers: editedIncident.sector_numbers,
                    cant_lesionados: editedIncident.cant_lesionados,
                    cant_involucrados: editedIncident.cant_involucrados,
                    cant_damnificados: editedIncident.cant_damnificados,
                    cant_7_3: editedIncident.cant_7_3,
                    observations: editedIncident.observations,
                    other_observations: editedIncident.other_observations,
                    report_prepared_by: editedIncident.report_prepared_by,
                    list_prepared_by: editedIncident.list_prepared_by,
                    officer_in_charge: editedIncident.officer_in_charge,
                    called_by_command: editedIncident.called_by_command
                })
                .eq('id', params.id);

            if (error) throw error;

            setIncident(editedIncident);
            setEditing(false);
            alert('Cambios guardados');
        } catch (e: any) {
            console.error('Error saving:', e);
            alert('Error al guardar: ' + e.message);
        }
    };

    const handleFieldChange = (field: keyof Incident, value: any) => {
        if (editedIncident) {
            setEditedIncident({ ...editedIncident, [field]: value });
        }
    };

    const handleRescan = async () => {
        if (!incident?.scanned_images || incident.scanned_images.length === 0) {
            alert('No hay imágenes escaneadas para re-procesar');
            return;
        }

        if (!confirm('¿Re-escanear este documento? Esto actualizará todos los datos extraídos.')) return;

        setRescanning(true);
        try {
            // Fetch images from URLs and convert to base64
            const imagePromises = incident.scanned_images.map(async (url) => {
                const response = await fetch(url);
                const blob = await response.blob();
                return new Promise<string>((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.readAsDataURL(blob);
                });
            });

            const images = await Promise.all(imagePromises);

            // Call extraction API
            const res = await fetch('/api/extract', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ images }),
            });

            const extractedData = await res.json();

            if (!res.ok) {
                throw new Error(extractedData.error || 'Error al extraer datos');
            }

            // Convert date format
            let formattedDate = null;
            if (extractedData.date) {
                const parts = extractedData.date.split('/');
                if (parts.length === 3) {
                    formattedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
                }
            }

            // Update incident
            const { error: updateError } = await supabase
                .from('incidents')
                .update({
                    act_number: extractedData.act_number,
                    incident_number: extractedData.incident_number,
                    list_number: extractedData.list_number,
                    date: formattedDate,
                    time: extractedData.time,
                    arrival_time: extractedData.arrival_time,
                    return_time: extractedData.return_time,
                    retired_time: extractedData.retired_time,
                    commander: extractedData.commander,
                    company_commander: extractedData.company_commander,
                    company_number: extractedData.company_number,
                    department: extractedData.department,
                    floor: extractedData.floor,
                    address: extractedData.address,
                    corner: extractedData.corner,
                    area: extractedData.area,
                    commune: extractedData.commune,
                    population: extractedData.population,
                    nature: extractedData.nature,
                    fire_rescue_location: extractedData.fire_rescue_location,
                    origin: extractedData.origin,
                    cause: extractedData.cause,
                    damage: extractedData.damage,
                    has_insurance: extractedData.insurance?.has_insurance,
                    insurance_company: extractedData.insurance?.company,
                    mobile_units: extractedData.insurance?.mobile_units,
                    insurance_conductors: extractedData.insurance?.conductors,
                    other_classes: extractedData.insurance?.other_classes,
                    company_quinta: extractedData.company_attendance?.quinta,
                    company_primera: extractedData.company_attendance?.primera,
                    company_segunda: extractedData.company_attendance?.segunda,
                    company_tercera: extractedData.company_attendance?.tercera,
                    company_cuarta: extractedData.company_attendance?.cuarta,
                    company_sexta: extractedData.company_attendance?.sexta,
                    company_septima: extractedData.company_attendance?.septima,
                    company_octava: extractedData.company_attendance?.octava,
                    company_bc_bp: extractedData.company_attendance?.bc_bp,
                    attendance_correction: extractedData.attendance_correction,
                    sector_rural: extractedData.attendance_sector?.rural,
                    sector_location: extractedData.attendance_sector?.location,
                    sector_numbers: extractedData.attendance_sector?.sector_numbers,
                    cant_lesionados: extractedData.cant_lesionados,
                    cant_involucrados: extractedData.cant_involucrados,
                    cant_damnificados: extractedData.cant_damnificados,
                    cant_7_3: extractedData.cant_7_3,
                    observations: extractedData.observations,
                    other_observations: extractedData.other_observations,
                    report_prepared_by: extractedData.report_prepared_by,
                    list_prepared_by: extractedData.list_prepared_by,
                    officer_in_charge: extractedData.officer_in_charge,
                    called_by_command: extractedData.called_by_command,
                    raw_data: extractedData
                })
                .eq('id', params.id);

            if (updateError) throw updateError;

            // Delete and re-insert vehicles
            await supabase.from('incident_vehicles').delete().eq('incident_id', params.id);
            if (extractedData.vehicles?.length > 0) {
                const vehicles = extractedData.vehicles.map((v: any) => ({
                    incident_id: params.id,
                    brand: v.brand,
                    model: v.model,
                    plate: v.plate,
                    driver: v.driver,
                    run: v.run
                }));
                await supabase.from('incident_vehicles').insert(vehicles);
            }

            // Delete and re-insert people
            await supabase.from('incident_involved_people').delete().eq('incident_id', params.id);
            if (extractedData.involved_people?.length > 0) {
                const people = extractedData.involved_people.map((p: any) => ({
                    incident_id: params.id,
                    name: p.name,
                    run: p.run,
                    attended_by_132: p.attended_by_132,
                    observation: p.observation,
                    status: p.status
                }));
                await supabase.from('incident_involved_people').insert(people);
            }

            // Delete and re-insert institutions
            await supabase.from('incident_institutions').delete().eq('incident_id', params.id);
            if (extractedData.institutions?.length > 0) {
                const institutions = extractedData.institutions.map((inst: any) => ({
                    incident_id: params.id,
                    institution_type: inst.type,
                    present: inst.present !== false,
                    name: inst.name,
                    grade: inst.grade,
                    comisaria: inst.comisaria,
                    movil: inst.movil,
                    cargo: inst.cargo,
                    entidad: inst.entidad
                }));
                await supabase.from('incident_institutions').insert(institutions);
            }

            alert('¡Documento re-escaneado con éxito!');
            // Reload the page to show updated data
            window.location.reload();

        } catch (e: any) {
            console.error('Error rescanning:', e);
            alert('Error al re-escanear: ' + e.message);
        } finally {
            setRescanning(false);
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
                    <div className="flex gap-2">
                        {editing ? (
                            <>
                                <button
                                    onClick={handleCancelEdit}
                                    className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-lg border border-gray-300 dark:border-neutral-600"
                                >
                                    <X className="w-5 h-5" />
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSaveEdit}
                                    className="flex items-center gap-2 px-4 py-2 text-white bg-green-600 hover:bg-green-700 rounded-lg"
                                >
                                    <Save className="w-5 h-5" />
                                    Guardar
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={handleEdit}
                                    className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-lg border border-gray-300 dark:border-neutral-600"
                                >
                                    <Edit2 className="w-5 h-5" />
                                    Editar
                                </button>
                                {incident.scanned_images && incident.scanned_images.length > 0 && (
                                    <button
                                        onClick={handleRescan}
                                        disabled={rescanning}
                                        className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 disabled:opacity-50"
                                    >
                                        <RefreshCw className={`w-5 h-5 ${rescanning ? 'animate-spin' : ''}`} />
                                        {rescanning ? 'Re-escaneando...' : 'Re-escanear'}
                                    </button>
                                )}
                                <button
                                    onClick={handleDelete}
                                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </header>

            <div className="space-y-4">
                {/* Scanned Images */}
                {incident.scanned_images && incident.scanned_images.length > 0 && (
                    <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 border border-gray-200 dark:border-neutral-700">
                        <h2 className="font-bold text-lg mb-4">Documentos Escaneados</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {incident.scanned_images.map((imageUrl, idx) => (
                                <div key={idx} className="relative group">
                                    <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full font-semibold z-10">
                                        Página {idx + 1}
                                    </div>
                                    <img 
                                        src={imageUrl} 
                                        alt={`Página ${idx + 1}`}
                                        className="w-full rounded-lg border border-gray-200 dark:border-neutral-700 cursor-pointer hover:shadow-lg transition-shadow"
                                        onClick={() => window.open(imageUrl, '_blank')}
                                    />
                                    <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity rounded-lg pointer-events-none"></div>
                                </div>
                            ))}
                        </div>
                        <p className="text-xs text-gray-500 mt-4">Haz clic en una imagen para verla en tamaño completo</p>
                    </div>
                )}

                {/* All Extracted Fields Table */}
                <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 border border-gray-200 dark:border-neutral-700">
                    <h2 className="font-bold text-lg mb-4">Datos Extraídos {editing && <span className="text-sm text-blue-600">(Modo Edición)</span>}</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 dark:bg-neutral-900/50">
                                <tr>
                                    <th className="text-left p-3 font-semibold text-gray-700 dark:text-gray-300 w-1/3">Campo</th>
                                    <th className="text-left p-3 font-semibold text-gray-700 dark:text-gray-300">Valor</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-neutral-700">
                                <tr>
                                    <td className="p-3 font-medium text-gray-600 dark:text-gray-400">N° Acto</td>
                                    <td className="p-3">
                                        {editing ? (
                                            <input
                                                type="text"
                                                value={editedIncident?.act_number || ''}
                                                onChange={(e) => handleFieldChange('act_number', e.target.value)}
                                                className="w-full px-2 py-1 border rounded dark:bg-neutral-700 dark:border-neutral-600"
                                            />
                                        ) : (
                                            incident.act_number || '-'
                                        )}
                                    </td>
                                </tr>
                                <tr>
                                    <td className="p-3 font-medium text-gray-600 dark:text-gray-400">N° de Incendio</td>
                                    <td className="p-3">
                                        {editing ? (
                                            <input
                                                type="text"
                                                value={editedIncident?.incident_number || ''}
                                                onChange={(e) => handleFieldChange('incident_number', e.target.value)}
                                                className="w-full px-2 py-1 border rounded dark:bg-neutral-700 dark:border-neutral-600"
                                            />
                                        ) : (
                                            incident.incident_number || '-'
                                        )}
                                    </td>
                                </tr>
                                <tr>
                                    <td className="p-3 font-medium text-gray-600 dark:text-gray-400">Lista N°</td>
                                    <td className="p-3">
                                        {editing ? (
                                            <input
                                                type="text"
                                                value={editedIncident?.list_number || ''}
                                                onChange={(e) => handleFieldChange('list_number', e.target.value)}
                                                className="w-full px-2 py-1 border rounded dark:bg-neutral-700 dark:border-neutral-600"
                                            />
                                        ) : (
                                            incident.list_number || '-'
                                        )}
                                    </td>
                                </tr>
                                <tr><td className="p-3 font-medium text-gray-600 dark:text-gray-400">Fecha</td><td className="p-3"><EditableField label="Fecha" value={editing ? editedIncident?.date : incident.date} editing={editing} onChange={(v) => handleFieldChange('date', v)} type="text" /></td></tr>
                                <tr><td className="p-3 font-medium text-gray-600 dark:text-gray-400">Hora del Acto</td><td className="p-3"><EditableField label="Hora del Acto" value={editing ? editedIncident?.time : incident.time} editing={editing} onChange={(v) => handleFieldChange('time', v)} type="text" /></td></tr>
                                <tr><td className="p-3 font-medium text-gray-600 dark:text-gray-400">Llegada al Lugar</td><td className="p-3"><EditableField label="Llegada al Lugar" value={editing ? editedIncident?.arrival_time : incident.arrival_time} editing={editing} onChange={(v) => handleFieldChange('arrival_time', v)} type="text" /></td></tr>
                                <tr><td className="p-3 font-medium text-gray-600 dark:text-gray-400">Retirada</td><td className="p-3"><EditableField label="Retirada" value={editing ? editedIncident?.retired_time : incident.retired_time} editing={editing} onChange={(v) => handleFieldChange('retired_time', v)} type="text" /></td></tr>
                                <tr><td className="p-3 font-medium text-gray-600 dark:text-gray-400">Hora de Regreso</td><td className="p-3"><EditableField label="Hora de Regreso" value={editing ? editedIncident?.return_time : incident.return_time} editing={editing} onChange={(v) => handleFieldChange('return_time', v)} type="text" /></td></tr>
                                <tr><td className="p-3 font-medium text-gray-600 dark:text-gray-400">A Cargo del Cuerpo</td><td className="p-3"><EditableField label="A Cargo del Cuerpo" value={editing ? editedIncident?.commander : incident.commander} editing={editing} onChange={(v) => handleFieldChange('commander', v)} type="text" /></td></tr>
                                <tr><td className="p-3 font-medium text-gray-600 dark:text-gray-400">A Cargo de la Compañía</td><td className="p-3"><EditableField label="A Cargo de la Compañía" value={editing ? editedIncident?.company_commander : incident.company_commander} editing={editing} onChange={(v) => handleFieldChange('company_commander', v)} type="text" /></td></tr>
                                <tr><td className="p-3 font-medium text-gray-600 dark:text-gray-400">N° Compañía</td><td className="p-3"><EditableField label="N° Compañía" value={editing ? editedIncident?.company_number : incident.company_number} editing={editing} onChange={(v) => handleFieldChange('company_number', v)} type="text" /></td></tr>
                                <tr><td className="p-3 font-medium text-gray-600 dark:text-gray-400">Depto</td><td className="p-3"><EditableField label="Depto" value={editing ? editedIncident?.department : incident.department} editing={editing} onChange={(v) => handleFieldChange('department', v)} type="text" /></td></tr>
                                <tr><td className="p-3 font-medium text-gray-600 dark:text-gray-400">Piso</td><td className="p-3"><EditableField label="Piso" value={editing ? editedIncident?.floor : incident.floor} editing={editing} onChange={(v) => handleFieldChange('floor', v)} type="text" /></td></tr>
                                <tr><td className="p-3 font-medium text-gray-600 dark:text-gray-400">Dirección Exacta</td><td className="p-3"><EditableField label="Dirección Exacta" value={editing ? editedIncident?.address : incident.address} editing={editing} onChange={(v) => handleFieldChange('address', v)} type="text" /></td></tr>
                                <tr><td className="p-3 font-medium text-gray-600 dark:text-gray-400">Esquina</td><td className="p-3"><EditableField label="Esquina" value={editing ? editedIncident?.corner : incident.corner} editing={editing} onChange={(v) => handleFieldChange('corner', v)} type="text" /></td></tr>
                                <tr><td className="p-3 font-medium text-gray-600 dark:text-gray-400">Comuna</td><td className="p-3"><EditableField label="Comuna" value={editing ? editedIncident?.commune : incident.commune} editing={editing} onChange={(v) => handleFieldChange('commune', v)} type="text" /></td></tr>
                                <tr><td className="p-3 font-medium text-gray-600 dark:text-gray-400">Población</td><td className="p-3"><EditableField label="Población" value={editing ? editedIncident?.population : incident.population} editing={editing} onChange={(v) => handleFieldChange('population', v)} type="text" /></td></tr>
                                <tr><td className="p-3 font-medium text-gray-600 dark:text-gray-400">Sector</td><td className="p-3"><EditableField label="Sector" value={editing ? editedIncident?.area : incident.area} editing={editing} onChange={(v) => handleFieldChange('area', v)} type="text" /></td></tr>
                                <tr><td className="p-3 font-medium text-gray-600 dark:text-gray-400">Naturaleza del Lugar</td><td className="p-3"><EditableField label="Naturaleza del Lugar" value={editing ? editedIncident?.nature : incident.nature} editing={editing} onChange={(v) => handleFieldChange('nature', v)} type="text" /></td></tr>
                                <tr><td className="p-3 font-medium text-gray-600 dark:text-gray-400">Lugar del Fuego o Rescate</td><td className="p-3"><EditableField label="Lugar del Fuego o Rescate" value={editing ? editedIncident?.fire_rescue_location : incident.fire_rescue_location} editing={editing} onChange={(v) => handleFieldChange('fire_rescue_location', v)} type="text" /></td></tr>
                                <tr><td className="p-3 font-medium text-gray-600 dark:text-gray-400">Origen</td><td className="p-3"><EditableField label="Origen" value={editing ? editedIncident?.origin : incident.origin} editing={editing} onChange={(v) => handleFieldChange('origin', v)} type="text" /></td></tr>
                                <tr><td className="p-3 font-medium text-gray-600 dark:text-gray-400">Causa</td><td className="p-3"><EditableField label="Causa" value={editing ? editedIncident?.cause : incident.cause} editing={editing} onChange={(v) => handleFieldChange('cause', v)} type="text" /></td></tr>
                                <tr><td className="p-3 font-medium text-gray-600 dark:text-gray-400">Daños</td><td className="p-3"><EditableField label="Daños" value={editing ? editedIncident?.damage : incident.damage} editing={editing} onChange={(v) => handleFieldChange('damage', v)} type="text" /></td></tr>
                                <tr><td className="p-3 font-medium text-gray-600 dark:text-gray-400">Seguro</td><td className="p-3"><EditableField label="Seguro" value={editing ? editedIncident?.has_insurance : incident.has_insurance} editing={editing} onChange={(v) => handleFieldChange('has_insurance', v)} type="boolean" /></td></tr>
                                <tr><td className="p-3 font-medium text-gray-600 dark:text-gray-400">Compañía de Seguros</td><td className="p-3"><EditableField label="Compañía de Seguros" value={editing ? editedIncident?.insurance_company : incident.insurance_company} editing={editing} onChange={(v) => handleFieldChange('insurance_company', v)} type="text" /></td></tr>
                                <tr><td className="p-3 font-medium text-gray-600 dark:text-gray-400">Móviles Asistentes</td><td className="p-3"><EditableField label="Móviles Asistentes" value={editing ? editedIncident?.mobile_units?.join(', ') : incident.mobile_units?.join(', ')} editing={editing} onChange={(v) => handleFieldChange('mobile_units', v ? v.split(',').map((s: string) => s.trim()) : [])} type="text" /></td></tr>
                                <tr><td className="p-3 font-medium text-gray-600 dark:text-gray-400">Conductores</td><td className="p-3"><EditableField label="Conductores" value={editing ? editedIncident?.insurance_conductors : incident.insurance_conductors} editing={editing} onChange={(v) => handleFieldChange('insurance_conductors', v)} type="text" /></td></tr>
                                <tr><td className="p-3 font-medium text-gray-600 dark:text-gray-400">Otras Cías</td><td className="p-3"><EditableField label="Otras Cías" value={editing ? editedIncident?.other_classes : incident.other_classes} editing={editing} onChange={(v) => handleFieldChange('other_classes', v)} type="text" /></td></tr>
                                <tr><td className="p-3 font-medium text-gray-600 dark:text-gray-400">Compañía 5ª</td><td className="p-3"><EditableField label="Compañía 5ª" value={editing ? editedIncident?.company_quinta : incident.company_quinta} editing={editing} onChange={(v) => handleFieldChange('company_quinta', v)} type="number" /></td></tr>
                                <tr><td className="p-3 font-medium text-gray-600 dark:text-gray-400">Compañía 1ª</td><td className="p-3"><EditableField label="Compañía 1ª" value={editing ? editedIncident?.company_primera : incident.company_primera} editing={editing} onChange={(v) => handleFieldChange('company_primera', v)} type="number" /></td></tr>
                                <tr><td className="p-3 font-medium text-gray-600 dark:text-gray-400">Compañía 2ª</td><td className="p-3"><EditableField label="Compañía 2ª" value={editing ? editedIncident?.company_segunda : incident.company_segunda} editing={editing} onChange={(v) => handleFieldChange('company_segunda', v)} type="number" /></td></tr>
                                <tr><td className="p-3 font-medium text-gray-600 dark:text-gray-400">Compañía 3ª</td><td className="p-3"><EditableField label="Compañía 3ª" value={editing ? editedIncident?.company_tercera : incident.company_tercera} editing={editing} onChange={(v) => handleFieldChange('company_tercera', v)} type="number" /></td></tr>
                                <tr><td className="p-3 font-medium text-gray-600 dark:text-gray-400">Compañía 4ª</td><td className="p-3"><EditableField label="Compañía 4ª" value={editing ? editedIncident?.company_cuarta : incident.company_cuarta} editing={editing} onChange={(v) => handleFieldChange('company_cuarta', v)} type="number" /></td></tr>
                                <tr><td className="p-3 font-medium text-gray-600 dark:text-gray-400">Compañía 6ª</td><td className="p-3"><EditableField label="Compañía 6ª" value={editing ? editedIncident?.company_sexta : incident.company_sexta} editing={editing} onChange={(v) => handleFieldChange('company_sexta', v)} type="number" /></td></tr>
                                <tr><td className="p-3 font-medium text-gray-600 dark:text-gray-400">Compañía 7ª</td><td className="p-3"><EditableField label="Compañía 7ª" value={editing ? editedIncident?.company_septima : incident.company_septima} editing={editing} onChange={(v) => handleFieldChange('company_septima', v)} type="number" /></td></tr>
                                <tr><td className="p-3 font-medium text-gray-600 dark:text-gray-400">Compañía 8ª</td><td className="p-3"><EditableField label="Compañía 8ª" value={editing ? editedIncident?.company_octava : incident.company_octava} editing={editing} onChange={(v) => handleFieldChange('company_octava', v)} type="number" /></td></tr>
                                <tr><td className="p-3 font-medium text-gray-600 dark:text-gray-400">BC/BP</td><td className="p-3"><EditableField label="BC/BP" value={editing ? editedIncident?.company_bc_bp : incident.company_bc_bp} editing={editing} onChange={(v) => handleFieldChange('company_bc_bp', v)} type="number" /></td></tr>
                                <tr><td className="p-3 font-medium text-gray-600 dark:text-gray-400">Corrección</td><td className="p-3"><EditableField label="Corrección" value={editing ? editedIncident?.attendance_correction : incident.attendance_correction} editing={editing} onChange={(v) => handleFieldChange('attendance_correction', v)} type="text" /></td></tr>
                                <tr><td className="p-3 font-medium text-gray-600 dark:text-gray-400">Sector Rural</td><td className="p-3"><EditableField label="Sector Rural" value={editing ? editedIncident?.sector_rural : incident.sector_rural} editing={editing} onChange={(v) => handleFieldChange('sector_rural', v)} type="boolean" /></td></tr>
                                <tr><td className="p-3 font-medium text-gray-600 dark:text-gray-400">Sector Lugar</td><td className="p-3"><EditableField label="Sector Lugar" value={editing ? editedIncident?.sector_location : incident.sector_location} editing={editing} onChange={(v) => handleFieldChange('sector_location', v)} type="text" /></td></tr>
                                <tr><td className="p-3 font-medium text-gray-600 dark:text-gray-400">Sectores Asistentes</td><td className="p-3"><EditableField label="Sectores Asistentes" value={editing ? editedIncident?.sector_numbers?.join(', ') : incident.sector_numbers?.join(', ')} editing={editing} onChange={(v) => handleFieldChange('sector_numbers', v ? v.split(',').map((s: string) => parseInt(s.trim())).filter((n: number) => !isNaN(n)) : [])} type="text" /></td></tr>
                                <tr><td className="p-3 font-medium text-gray-600 dark:text-gray-400">Cant. Lesionados</td><td className="p-3"><EditableField label="Cant. Lesionados" value={editing ? editedIncident?.cant_lesionados : incident.cant_lesionados} editing={editing} onChange={(v) => handleFieldChange('cant_lesionados', v)} type="number" /></td></tr>
                                <tr><td className="p-3 font-medium text-gray-600 dark:text-gray-400">Cant. Involucrados</td><td className="p-3"><EditableField label="Cant. Involucrados" value={editing ? editedIncident?.cant_involucrados : incident.cant_involucrados} editing={editing} onChange={(v) => handleFieldChange('cant_involucrados', v)} type="number" /></td></tr>
                                <tr><td className="p-3 font-medium text-gray-600 dark:text-gray-400">Cant. Damnificados</td><td className="p-3"><EditableField label="Cant. Damnificados" value={editing ? editedIncident?.cant_damnificados : incident.cant_damnificados} editing={editing} onChange={(v) => handleFieldChange('cant_damnificados', v)} type="number" /></td></tr>
                                <tr><td className="p-3 font-medium text-gray-600 dark:text-gray-400">Cant. 7-3</td><td className="p-3"><EditableField label="Cant. 7-3" value={editing ? editedIncident?.cant_7_3 : incident.cant_7_3} editing={editing} onChange={(v) => handleFieldChange('cant_7_3', v)} type="number" /></td></tr>
                                <tr><td className="p-3 font-medium text-gray-600 dark:text-gray-400">Observaciones</td><td className="p-3"><EditableField label="Observaciones" value={editing ? editedIncident?.observations : incident.observations} editing={editing} onChange={(v) => handleFieldChange('observations', v)} type="textarea" /></td></tr>
                                <tr><td className="p-3 font-medium text-gray-600 dark:text-gray-400">Otras Observaciones</td><td className="p-3"><EditableField label="Otras Observaciones" value={editing ? editedIncident?.other_observations : incident.other_observations} editing={editing} onChange={(v) => handleFieldChange('other_observations', v)} type="textarea" /></td></tr>
                                <tr><td className="p-3 font-medium text-gray-600 dark:text-gray-400">Informe Elaborado Por</td><td className="p-3"><EditableField label="Informe Elaborado Por" value={editing ? editedIncident?.report_prepared_by : incident.report_prepared_by} editing={editing} onChange={(v) => handleFieldChange('report_prepared_by', v)} type="text" /></td></tr>
                                <tr><td className="p-3 font-medium text-gray-600 dark:text-gray-400">Lista Confeccionada Por</td><td className="p-3"><EditableField label="Lista Confeccionada Por" value={editing ? editedIncident?.list_prepared_by : incident.list_prepared_by} editing={editing} onChange={(v) => handleFieldChange('list_prepared_by', v)} type="text" /></td></tr>
                                <tr><td className="p-3 font-medium text-gray-600 dark:text-gray-400">Oficial/Bombero a Cargo</td><td className="p-3"><EditableField label="Oficial/Bombero a Cargo" value={editing ? editedIncident?.officer_in_charge : incident.officer_in_charge} editing={editing} onChange={(v) => handleFieldChange('officer_in_charge', v)} type="text" /></td></tr>
                                <tr><td className="p-3 font-medium text-gray-600 dark:text-gray-400">Llamado de Comandancia</td><td className="p-3"><EditableField label="Llamado de Comandancia" value={editing ? editedIncident?.called_by_command : incident.called_by_command} editing={editing} onChange={(v) => handleFieldChange('called_by_command', v)} type="text" /></td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Vehicles */}
                {vehicles.length > 0 && (
                    <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 border border-gray-200 dark:border-neutral-700">
                        <h2 className="font-bold text-lg mb-4">Vehículos ({vehicles.length})</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 dark:bg-neutral-900/50">
                                    <tr>
                                        <th className="text-left p-3">Marca</th>
                                        <th className="text-left p-3">Modelo</th>
                                        <th className="text-left p-3">Patente</th>
                                        <th className="text-left p-3">Conductor</th>
                                        <th className="text-left p-3">RUN</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-neutral-700">
                                    {vehicles.map((vehicle, idx) => (
                                        <tr key={idx}>
                                            <td className="p-3">{vehicle.brand || '-'}</td>
                                            <td className="p-3">{vehicle.model || '-'}</td>
                                            <td className="p-3">{vehicle.plate || '-'}</td>
                                            <td className="p-3">{vehicle.driver || '-'}</td>
                                            <td className="p-3">{vehicle.run || '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* People */}
                {people.length > 0 && (
                    <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 border border-gray-200 dark:border-neutral-700">
                        <h2 className="font-bold text-lg mb-4">Personas Involucradas ({people.length})</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 dark:bg-neutral-900/50">
                                    <tr>
                                        <th className="text-left p-3">Nombre</th>
                                        <th className="text-left p-3">RUN</th>
                                        <th className="text-left p-3">Atendido 132</th>
                                        <th className="text-left p-3">Estado</th>
                                        <th className="text-left p-3">Observación</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-neutral-700">
                                    {people.map((person, idx) => (
                                        <tr key={idx}>
                                            <td className="p-3">{person.name || '-'}</td>
                                            <td className="p-3">{person.run || '-'}</td>
                                            <td className="p-3">{person.attended_by_132 ? '✓ Sí' : 'No'}</td>
                                            <td className="p-3">{person.status || '-'}</td>
                                            <td className="p-3">{person.observation || '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Institutions */}
                {institutions.length > 0 && (
                    <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 border border-gray-200 dark:border-neutral-700">
                        <h2 className="font-bold text-lg mb-4">Instituciones Presentes ({institutions.length})</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 dark:bg-neutral-900/50">
                                    <tr>
                                        <th className="text-left p-3">Tipo</th>
                                        <th className="text-left p-3">Nombre</th>
                                        <th className="text-left p-3">Grado</th>
                                        <th className="text-left p-3">Comisaría</th>
                                        <th className="text-left p-3">Cargo</th>
                                        <th className="text-left p-3">Entidad</th>
                                        <th className="text-left p-3">Móvil</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-neutral-700">
                                    {institutions.map((inst, idx) => (
                                        <tr key={idx}>
                                            <td className="p-3 capitalize">{inst.institution_type || '-'}</td>
                                            <td className="p-3">{inst.name || '-'}</td>
                                            <td className="p-3">{inst.grade || '-'}</td>
                                            <td className="p-3">{inst.comisaria || '-'}</td>
                                            <td className="p-3">{inst.cargo || '-'}</td>
                                            <td className="p-3">{inst.entidad || '-'}</td>
                                            <td className="p-3">{inst.movil || '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
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
