'use client';

import { useState, useRef } from 'react';
import { Camera, Loader2, Save, RefreshCw, X, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function ScanPage() {
    const [images, setImages] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<any>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const fileArray = Array.from(files);
        const processedImages: string[] = [];
        let processedCount = 0;

        fileArray.forEach((file) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    // Resize to max 2560px to improve handwriting recognition
                    const MAX_SIZE = 2560;
                    if (width > height) {
                        if (width > MAX_SIZE) {
                            height *= MAX_SIZE / width;
                            width = MAX_SIZE;
                        }
                    } else {
                        if (height > MAX_SIZE) {
                            width *= MAX_SIZE / height;
                            height = MAX_SIZE;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, width, height);

                    // Compress to JPEG 0.85 for better quality
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
                    processedImages.push(dataUrl);
                    processedCount++;

                    // When all images are processed, update state
                    if (processedCount === fileArray.length) {
                        setImages(prev => {
                            // If we already have 1 image and we are uploading 1 new one, append it (Page 2)
                            if (prev.length === 1 && processedImages.length === 1) {
                                return [...prev, ...processedImages];
                            }
                            // Otherwise (0 images, or replacing, or uploading multiple at once), replace
                            return processedImages;
                        });

                        // Reset input so same file can be selected again if needed
                        if (fileInputRef.current) fileInputRef.current.value = '';
                    }
                };
                img.src = event.target?.result as string;
            };
            reader.readAsDataURL(file);
        });
    };

    const handleExtract = async () => {
        if (images.length === 0) return;
        setLoading(true);
        try {
            const res = await fetch('/api/extract', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ images }),
            });
            const json = await res.json();
            if (res.ok) {
                setData(json);
            } else {
                console.error(json);
                alert('Error al extraer datos: ' + (json.error || 'Desconocido'));
            }
        } catch (e: any) {
            console.error(e);
            alert('Error al extraer datos: ' + e.message);
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
            // Upload images to Supabase Storage
            const imageUrls: string[] = [];
            let uploadSuccess = true;
            
            console.log('Starting image upload process...');
            console.log('Number of images:', images.length);
            console.log('Supabase URL:', supabase.storage.url);
            
            for (let i = 0; i < images.length; i++) {
                const image = images[i];
                const timestamp = Date.now();
                const fileName = `incident_${timestamp}_page${i + 1}.jpg`;
                
                console.log(`Processing image ${i + 1}/${images.length}...`);
                
                try {
                    // Convert base64 to blob
                    const base64Data = image.split(',')[1];
                    const byteCharacters = atob(base64Data);
                    const byteNumbers = new Array(byteCharacters.length);
                    for (let j = 0; j < byteCharacters.length; j++) {
                        byteNumbers[j] = byteCharacters.charCodeAt(j);
                    }
                    const byteArray = new Uint8Array(byteNumbers);
                    const blob = new Blob([byteArray], { type: 'image/jpeg' });
                    
                    console.log(`Uploading ${fileName} (${blob.size} bytes)...`);
                    
                    // Upload to Supabase Storage
                    const { data: uploadData, error: uploadError } = await supabase.storage
                        .from('incident-scans')
                        .upload(fileName, blob, {
                            contentType: 'image/jpeg',
                            cacheControl: '3600',
                            upsert: false
                        });
                    
                    if (uploadError) {
                        console.error('Upload error details:', uploadError);
                        uploadSuccess = false;
                        alert(`No se pudo subir la imagen ${i + 1}.\n\nError: ${uploadError.message}\n\nVerifica:\n1. El bucket 'incident-scans' existe en Supabase Storage\n2. El bucket es público\n3. Las variables NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY están configuradas\n\nLos datos se guardarán sin las imágenes.`);
                        break;
                    }
                    
                    console.log('Upload successful:', uploadData);
                    
                    // Get public URL
                    const { data: urlData } = supabase.storage
                        .from('incident-scans')
                        .getPublicUrl(fileName);
                    
                    console.log('Public URL:', urlData.publicUrl);
                    imageUrls.push(urlData.publicUrl);
                } catch (imgError: any) {
                    console.error(`Error processing image ${i + 1}:`, imgError);
                    uploadSuccess = false;
                    alert(`Error al procesar imagen ${i + 1}: ${imgError.message}\n\nLos datos se guardarán sin las imágenes.`);
                    break;
                }
            }

            console.log('Upload complete. Success:', uploadSuccess);
            console.log('Image URLs:', imageUrls);

            // Save incident with image URLs (or empty array if upload failed)
            const { error, data: insertedData } = await supabase.from('incidents').insert({
                // Scanned images (empty if upload failed)
                scanned_images: uploadSuccess ? imageUrls : [],
                
                // Basic info
                act_number: data.act_number,
                incident_number: data.incident_number,
                list_number: data.list_number,
                date: formattedDate,
                time: data.time,
                arrival_time: data.arrival_time,
                return_time: data.return_time,
                retired_time: data.retired_time,
                
                // Command
                commander: data.commander,
                company_commander: data.company_commander,
                company_number: data.company_number,
                department: data.department,
                floor: data.floor,
                
                // Location
                address: data.address,
                corner: data.corner,
                area: data.area,
                commune: data.commune,
                population: data.population,
                
                // Incident details
                nature: data.nature,
                fire_rescue_location: data.fire_rescue_location,
                origin: data.origin,
                cause: data.cause,
                damage: data.damage,
                
                // Insurance
                has_insurance: data.insurance?.has_insurance,
                insurance_company: data.insurance?.company,
                mobile_units: data.insurance?.mobile_units,
                insurance_conductors: data.insurance?.conductors,
                other_classes: data.insurance?.other_classes,
                
                // Company attendance
                company_quinta: data.company_attendance?.quinta,
                company_primera: data.company_attendance?.primera,
                company_segunda: data.company_attendance?.segunda,
                company_tercera: data.company_attendance?.tercera,
                company_cuarta: data.company_attendance?.cuarta,
                company_sexta: data.company_attendance?.sexta,
                company_septima: data.company_attendance?.septima,
                company_octava: data.company_attendance?.octava,
                company_bc_bp: data.company_attendance?.bc_bp,
                attendance_correction: data.attendance_correction,
                
                // Sector
                sector_rural: data.attendance_sector?.rural,
                sector_location: data.attendance_sector?.location,
                sector_numbers: data.attendance_sector?.sector_numbers,
                
                // Counts
                cant_lesionados: data.cant_lesionados,
                cant_involucrados: data.cant_involucrados,
                cant_damnificados: data.cant_damnificados,
                cant_7_3: data.cant_7_3,
                
                // Observations
                observations: data.observations,
                other_observations: data.other_observations,
                
                // Report metadata
                report_prepared_by: data.report_prepared_by,
                list_prepared_by: data.list_prepared_by,
                officer_in_charge: data.officer_in_charge,
                called_by_command: data.called_by_command,
                
                // Raw data
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
                    attended_by_132: p.attended_by_132,
                    observation: p.observation,
                    status: p.status
                }));
                await supabase.from('incident_involved_people').insert(people);
            }

            // Insert attendance if any
            if (data.attendance?.length > 0 && insertedData) {
                const attendance = data.attendance.map((a: any) => ({
                    incident_id: insertedData.id,
                    volunteer_name: a.volunteer_name,
                    volunteer_id: a.volunteer_id,
                    present: a.present !== false // default to true
                }));
                await supabase.from('incident_attendance').insert(attendance);
            }

            // Insert institutions if any
            if (data.institutions?.length > 0 && insertedData) {
                const institutions = data.institutions.map((inst: any) => ({
                    incident_id: insertedData.id,
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

            {/* Main Content Area */}
            <div className={data ? "grid lg:grid-cols-2 gap-8" : "max-w-xl mx-auto"}>
                {images.length === 0 && (
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className="group border-2 border-dashed border-gray-300 rounded-2xl h-[60vh] flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-white hover:border-blue-400 hover:shadow-xl dark:border-neutral-700 dark:hover:bg-neutral-800"
                    >
                        <div className="p-6 bg-white dark:bg-neutral-800 rounded-full shadow-lg mb-6 group-hover:scale-110 transition-transform">
                            <Camera className="w-12 h-12 text-blue-500" />
                        </div>
                        <p className="text-gray-600 font-medium text-lg">Toca para abrir la cámara</p>
                        <p className="text-gray-400 text-sm mt-2">Sube 1 o 2 páginas del informe</p>
                    </div>
                )}

                {/* Hidden input always present in DOM */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    multiple
                    className="hidden"
                    onChange={handleFileChange}
                />

                {images.length > 0 && (
                    <div className={`flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 ${data ? 'mb-6' : ''}`}>
                        <div className="space-y-4">
                            {images.map((img, idx) => (
                                <div key={idx} className="relative rounded-2xl overflow-hidden shadow-2xl border border-gray-200 dark:border-neutral-700">
                                    <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full font-semibold">
                                        Página {idx + 1}
                                    </div>
                                    <img src={img} alt={`Página ${idx + 1}`} className="w-full max-h-[40vh] object-contain bg-black/5" />
                                    {!data && (
                                        <button
                                            onClick={() => setImages(images.filter((_, i) => i !== idx))}
                                            className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full backdrop-blur-md hover:bg-red-600"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>

                        {!data && (
                            <>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold active:scale-95 transition-transform dark:bg-neutral-800 dark:text-gray-300"
                                    >
                                        {images.length === 1 ? 'Agregar Página 2' : 'Cambiar Imágenes'}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setImages([]);
                                            setData(null);
                                            if (fileInputRef.current) fileInputRef.current.value = '';
                                        }}
                                        className="px-4 py-3 bg-red-100 text-red-600 rounded-xl font-semibold active:scale-95 transition-transform dark:bg-red-900/30 dark:text-red-400"
                                        title="Eliminar todas las imágenes"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                                <button
                                    onClick={handleExtract}
                                    disabled={loading}
                                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-blue-500/30 flex items-center justify-center gap-3 active:scale-95 transition-transform disabled:opacity-70"
                                >
                                    {loading ? (
                                        <div className="flex flex-col items-center gap-2">
                                            <Loader2 className="animate-spin w-6 h-6" />
                                            <span className="text-xs opacity-75">Analizando {images.length} página(s)... (aprox 30-60s)</span>
                                        </div>
                                    ) : (
                                        <>
                                            <span>Extraer Datos</span>
                                            <div className="px-2 py-1 bg-white/20 rounded text-xs">IA</div>
                                        </>
                                    )}
                                </button>
                            </>
                        )}
                    </div>
                )
                }

                {data && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 dark:bg-neutral-800 dark:border-neutral-700">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="font-bold text-xl">Revisar Datos</h2>
                                <span className="text-xs font-mono bg-green-100 text-green-700 px-2 py-1 rounded-full dark:bg-green-900/30 dark:text-green-400">Confianza Alta</span>
                            </div>

                            {/* Full Incident Details */}
                            <div className="space-y-4">
                                {/* ... Content Rendered ... */}

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3 bg-gray-50 rounded-lg dark:bg-neutral-900/50">
                                        <label className="text-xs text-gray-500 uppercase font-semibold">N° Acto / Incendio</label>
                                        <div className="font-medium">{data.act_number || '-'} {data.fire_type && `(Incendio: ${data.fire_type})`}</div>
                                    </div>
                                    <div className="p-3 bg-gray-50 rounded-lg dark:bg-neutral-900/50">
                                        <label className="text-xs text-gray-500 uppercase font-semibold">Tiempos</label>
                                        <div className="grid grid-cols-2 gap-x-2 text-sm">
                                            <div><span className="text-xs text-gray-400">Fecha:</span> {data.date}</div>
                                            <div><span className="text-xs text-gray-400">Hora:</span> {data.time}</div>
                                            {data.arrival_time && <div><span className="text-xs text-gray-400">Llegada:</span> {data.arrival_time}</div>}
                                            {data.withdrawal_time && <div><span className="text-xs text-gray-400">Retirada:</span> {data.withdrawal_time}</div>}
                                        </div>
                                    </div>
                                </div>

                                <div className="p-3 bg-gray-50 rounded-lg dark:bg-neutral-900/50">
                                    <label className="text-xs text-gray-500 uppercase font-semibold">Información del Lugar</label>
                                    <div className="font-medium text-lg">{data.address} {data.street_number && `#${data.street_number}`}</div>
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 text-sm text-gray-600 dark:text-gray-300">
                                        {data.corner && <div><span className="font-semibold text-gray-400 text-xs">Esq:</span> {data.corner}</div>}
                                        {data.apartment && <div><span className="font-semibold text-gray-400 text-xs">Depto:</span> {data.apartment}</div>}
                                        {data.floor && <div><span className="font-semibold text-gray-400 text-xs">Piso:</span> {data.floor}</div>}
                                        {data.commune && <div><span className="font-semibold text-gray-400 text-xs">Comuna:</span> {data.commune}</div>}
                                        {data.population && <div><span className="font-semibold text-gray-400 text-xs">Población:</span> {data.population}</div>}
                                        {data.area && <div><span className="font-semibold text-gray-400 text-xs">Sector:</span> {data.area}</div>}
                                        {data.fire_or_rescue_place && <div className="col-span-2 border-t pt-1 mt-1"><span className="font-semibold text-gray-400 text-xs">Lugar Fuego/Rescate:</span> {data.fire_or_rescue_place}</div>}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3 bg-gray-50 rounded-lg dark:bg-neutral-900/50">
                                        <label className="text-xs text-gray-500 uppercase font-semibold">Comandante Cuerpo</label>
                                        <div className="font-medium">{data.commander || '-'}</div>
                                    </div>
                                    <div className="p-3 bg-gray-50 rounded-lg dark:bg-neutral-900/50">
                                        <label className="text-xs text-gray-500 uppercase font-semibold">Comandante Cía</label>
                                        <div className="font-medium">{data.company_commander || '-'}</div>
                                    </div>
                                </div>

                                <div className="p-3 bg-gray-50 rounded-lg dark:bg-neutral-900/50">
                                    <label className="text-xs text-gray-500 uppercase font-semibold">Naturaleza / Origen / Causa</label>
                                    <div className="font-medium border-b pb-1 mb-1">{data.nature || 'N/A'}</div>
                                    <div className="text-sm text-gray-600 dark:text-gray-300">{[data.origin, data.cause].filter(Boolean).join(' - ')}</div>
                                </div>

                                {(data.cant_lesionados || data.cant_involucrados || data.cant_damnificados) && (
                                    <div className="p-3 bg-orange-50 rounded-lg dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
                                        <label className="text-xs text-orange-700 dark:text-orange-400 uppercase font-semibold mb-2 block">Cantidades</label>
                                        <div className="grid grid-cols-3 gap-2 text-sm">
                                            {data.cant_lesionados && <div><span className="text-orange-600 font-bold text-lg">{data.cant_lesionados}</span> <span className="text-xs">Lesionados</span></div>}
                                            {data.cant_involucrados && <div><span className="text-orange-600 font-bold text-lg">{data.cant_involucrados}</span> <span className="text-xs">Involucrados</span></div>}
                                            {data.cant_damnificados && <div><span className="text-orange-600 font-bold text-lg">{data.cant_damnificados}</span> <span className="text-xs">Damnificados</span></div>}
                                        </div>
                                    </div>
                                )}

                                {data.insurance && (
                                    <div className="p-3 bg-gray-50 rounded-lg dark:bg-neutral-900/50">
                                        <label className="text-xs text-gray-500 uppercase font-semibold">Seguro / Móviles</label>
                                        <div className="text-sm">
                                            {data.insurance.has_insurance ? 'Sí' : 'No'}
                                            {data.insurance.company && ` - ${data.insurance.company}`}
                                        </div>
                                        {data.insurance.mobile_units && (
                                            <div className="text-xs text-gray-500 mt-1">Móviles: {Array.isArray(data.insurance.mobile_units) ? data.insurance.mobile_units.join(', ') : data.insurance.mobile_units}</div>
                                        )}
                                        {data.insurance.conductors && (
                                            <div className="text-xs text-gray-500">Conductores: {data.insurance.conductors}</div>
                                        )}
                                    </div>
                                )}

                                {data.company_attendance && Object.keys(data.company_attendance).length > 0 && (
                                    <div className="p-3 bg-blue-50 rounded-lg dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                                        <label className="text-xs text-blue-700 dark:text-blue-400 uppercase font-semibold mb-2 block">Asistencia por Compañía</label>
                                        <div className="grid grid-cols-4 gap-2 text-xs">
                                            {data.company_attendance.quinta && <div className="font-semibold">5ª: {data.company_attendance.quinta}</div>}
                                            {data.company_attendance.primera && <div className="font-semibold">1ª: {data.company_attendance.primera}</div>}
                                            {data.company_attendance.segunda && <div className="font-semibold">2ª: {data.company_attendance.segunda}</div>}
                                            {data.company_attendance.tercera && <div className="font-semibold">3ª: {data.company_attendance.tercera}</div>}
                                            {data.company_attendance.cuarta && <div className="font-semibold">4ª: {data.company_attendance.cuarta}</div>}
                                            {data.company_attendance.sexta && <div className="font-semibold">6ª: {data.company_attendance.sexta}</div>}
                                            {data.company_attendance.septima && <div className="font-semibold">7ª: {data.company_attendance.septima}</div>}
                                            {data.company_attendance.octava && <div className="font-semibold">8ª: {data.company_attendance.octava}</div>}
                                            {data.company_attendance.bc_bp && <div className="font-semibold">BC/BP: {data.company_attendance.bc_bp}</div>}
                                        </div>
                                    </div>
                                )}

                                {data.observations && (
                                    <div className="p-3 bg-gray-50 rounded-lg dark:bg-neutral-900/50">
                                        <label className="text-xs text-gray-500 uppercase font-semibold">Observaciones</label>
                                        <div className="text-sm whitespace-pre-wrap font-mono text-gray-700 dark:text-gray-300">{data.observations}</div>
                                    </div>
                                )}

                                {data.other_observations && (
                                    <div className="p-3 bg-gray-50 rounded-lg dark:bg-neutral-900/50">
                                        <label className="text-xs text-gray-500 uppercase font-semibold">Otras Observaciones</label>
                                        <div className="text-sm whitespace-pre-wrap">{data.other_observations}</div>
                                    </div>
                                )}

                                {data.institutions_present && Object.keys(data.institutions_present).length > 0 && (
                                    <div className="p-3 bg-gray-50 rounded-lg dark:bg-neutral-900/50">
                                        <label className="text-xs text-gray-500 uppercase font-semibold mb-2 block">Instituciones Presentes</label>
                                        <div className="grid grid-cols-2 text-sm gap-y-1">
                                            {data.institutions_present.carabineros && <div>✓ Carabineros</div>}
                                            {data.institutions_present.samu && <div>✓ SAMU / Ambulancia</div>}
                                            {data.institutions_present.pdi && <div>✓ PDI</div>}
                                            {data.institutions_present.prensa && <div>✓ Prensa</div>}
                                            {data.institutions_present.sernapred && <div>✓ Sernapred</div>}
                                            {data.institutions_present.saesa && <div>✓ Saesa</div>}
                                            {data.institutions_present.suralis && <div>✓ Suralis</div>}
                                            {data.institutions_present.ong && <div>✓ ONG</div>}
                                            {data.institutions_present.other && <div className="col-span-2">✓ Otros: {data.institutions_present.other}</div>}
                                        </div>
                                    </div>
                                )}

                                {data.vehicles?.length > 0 && (
                                    <div className="p-3 bg-gray-50 rounded-lg dark:bg-neutral-900/50">
                                        <label className="text-xs text-gray-500 uppercase font-semibold mb-2 block">Vehículos ({data.vehicles.length})</label>
                                        {data.vehicles.map((v: any, i: number) => (
                                            <div key={i} className="text-sm border-t border-gray-200 mt-2 pt-2 first:border-0 first:mt-0 first:pt-0 grid grid-cols-[1fr_auto] gap-2">
                                                <div>
                                                    <span className="font-medium block">{v.brand} {v.model}</span>
                                                    <span className="text-xs text-gray-500">{v.plate}</span>
                                                </div>
                                                <div className="text-right text-xs">
                                                    {v.driver}<br />{v.run}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {data.involved_people?.length > 0 && (
                                    <div className="p-3 bg-gray-50 rounded-lg dark:bg-neutral-900/50">
                                        <label className="text-xs text-gray-500 uppercase font-semibold mb-2 block">Personas Involucradas ({data.involved_people.length})</label>
                                        {data.involved_people.map((p: any, i: number) => (
                                            <div key={i} className="text-sm border-t border-gray-200 mt-2 pt-2 first:border-0 first:mt-0 first:pt-0">
                                                <div className="font-medium">{p.name}</div>
                                                <div className="grid grid-cols-2 gap-x-4 mt-1">
                                                    <div className="text-xs text-gray-500">RUN: {p.run || 'N/A'}</div>
                                                    {p.attended_by_132 && <div className="text-xs text-red-600 font-semibold text-right">✓ Atendido 132</div>}
                                                </div>
                                                {p.moved_by && <div className="text-xs mt-1 text-blue-600"> Traslado: {p.moved_by}</div>}
                                                {p.status && <div className="text-xs">Estado: {p.status}</div>}
                                                {p.observation && <div className="text-xs italic mt-1 text-gray-600">"{p.observation}"</div>}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {data.attendance?.length > 0 && (
                                    <div className="p-3 bg-gray-50 rounded-lg dark:bg-neutral-900/50">
                                        <label className="text-xs text-gray-500 uppercase font-semibold mb-2 block">Asistencia de Voluntarios ({data.attendance.length})</label>
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                            {data.attendance.map((a: any, i: number) => (
                                                <div key={i} className="flex items-center gap-2">
                                                    <span className={a.present !== false ? 'text-green-600' : 'text-red-600'}>
                                                        {a.present !== false ? '✓' : '✗'}
                                                    </span>
                                                    <span>{a.volunteer_name || `Vol. ${a.volunteer_id}`}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Footer Data */}
                                {(data.report_made_by || data.command_call || data.signature_name) && (
                                    <div className="p-3 bg-gray-50 rounded-lg dark:bg-neutral-900/50">
                                        <label className="text-xs text-gray-500 uppercase font-semibold mb-2 block">Cierre del Informe</label>
                                        <div className="grid grid-cols-1 gap-2 text-sm">
                                            {data.report_made_by && <div><span className="text-xs text-gray-400 block">Elaborado por:</span> {data.report_made_by}</div>}
                                            {data.command_call && <div><span className="text-xs text-gray-400 block">Llamado Comandancia:</span> {data.command_call}</div>}
                                            {data.signature_name && <div><span className="text-xs text-gray-400 block">Firma / Cargo:</span> {data.signature_name}</div>}
                                        </div>
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
        </div>
    );
}
