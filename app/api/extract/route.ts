import OpenAI from 'openai';
import { NextResponse } from 'next/server';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || "dummy-key",
});

export async function POST(req: Request) {
    try {
        const { image } = await req.json();

        if (!image) {
            return NextResponse.json({ error: 'No image provided' }, { status: 400 });
        }

        const prompt = `
You are an expert at transcribing handwritten Chilean fire department incident reports.
Extract EVERY piece of information from this form into structured JSON.

FORM STRUCTURE TO EXTRACT:

1. HEADER SECTION:
- act_number (Acto / N° de Incendio)
- list_number (Lista N°)
- date (Fecha - format DD/MM/YYYY)
- time (Hora del Acto - format HH:MM)
- return_time (Hora de Regreso)
- retired_time (Retirada)
- arrival_location (Llegada al Lugar)
- commander (A Cargo del Cuerpo)
- company_commander (A Cargo de la Compañía, N°, Depto, Piso)
- address (Dirección Exacta)
- corner (Esquina más próx.)
- commune (Comuna)
- population (Población)
- nature (Naturaleza del lugar)
- fire_rescue_location (Lugar del fuego o Rescate)
- origin (Origen)
- cause (Causa)

2. VEHICLES TABLE (Marca, Modelo, Patente, Nombre Conductor, RUN):
- vehicles: array of { brand, model, plate, driver, run }
  Example from form: 
  - { brand: "DAC", model: "152", plate: "PPBL-28", driver: "Luis Carmona", run: "12.594.066-6" }
  - { brand: "MAZDA", model: "B1-50", plate: "SDIII", driver: "Alejandro Eschmann", run: "14.337.968-7" }

3. INSURANCE SECTION:
- insurance: { has_insurance (Si/NO), company, mobile_units (R-5, RCS, etc.), conductors, other_conductors }

4. COMPANY ATTENDANCE (Compañía grid with columns 5ª, 1ª, 2ª, 3ª, 4ª, 6ª, 7ª, 8ª, BC/BP):
- company_attendance: { 
    quinta: number, 
    primera: number, 
    segunda: number, 
    tercera: number, 
    cuarta: number, 
    sexta: number, 
    septima: number, 
    octava: number, 
    bc_bp: number 
  }
- attendance_sector: { rural: boolean, lugar: string, sector_numbers: array }
- attendance_correction (Corrección)

5. INJURED/INVOLVED PEOPLE TABLE:
- cant_lesionados (Cant. Lesionados)
- cant_involucrados (Cant. Involucrados)
- cant_damnificados (Cant. Damnificados)
- involved_people: array of {
    name (Nombre Completo),
    run,
    attended_by_132 (SI/NO as boolean),
    observation (Trasladado por 1-2, Rechaza traslado, etc.)
  }

6. OBSERVATIONS:
- observations (Observaciones - main narrative text)
- other_observations (Otras Observaciones)

7. INSTITUTIONS PRESENT (bottom section):
- institutions_present: {
    location (En el lugar): { pdi, prensa, bernagred, saesa, suralic, ong, otros },
    carabineros: { present, name, comisaria, grado, movil },
    ambulancia: { present, name, cargo, entidad, movil }
  }

8. REPORT METADATA:
- report_prepared_by (Informe elaborado por - Incendio)
- list_prepared_by (Lista confeccionada por)
- officer_in_charge (Oficial O Bombero a Cargo - with signature)
- called_by_command (Llamado de Comandancia)

CRITICAL PARSING INSTRUCTIONS:
1. Extract ALL handwritten text from every field, even if partially filled
2. For tables, extract ALL rows with any data
3. For checkboxes (SI/NO), return boolean values
4. For the attendance grid, extract the numbers written in each company column
5. Parse mobile units like "R-5 ✓", "RCS ✓" as array entries
6. Extract conductor names from "Conductor(es):" field
7. Read signatures and names at the bottom
8. If a field is empty, set to null
9. If text is illegible, mark as "illegible"

Return ONLY valid JSON with no markdown formatting.
`;

        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: prompt },
                        {
                            type: "image_url",
                            image_url: {
                                url: image,
                                detail: "high" // Use high detail for better handwriting recognition
                            },
                        },
                    ],
                },
            ],
            max_tokens: 8000, // Increased for more comprehensive extraction
            temperature: 0.1, // Lower temperature for more consistent extraction
        });

        // Debug info
        console.log("Usage:", response.usage);

        const content = response.choices[0].message.content;
        const cleanContent = content?.replace(/```json/g, '').replace(/```/g, '').trim();

        return NextResponse.json(JSON.parse(cleanContent || '{}'));

    } catch (error: any) {
        console.error("AI Error Detailed:", error);

        // Check for common OpenAI errors
        if (error.status === 401) {
            return NextResponse.json({ error: 'Incorrect OpenAI API Key' }, { status: 401 });
        }
        if (error.status === 429) {
            return NextResponse.json({ error: 'OpenAI Rate Limit Exceeded' }, { status: 429 });
        }

        return NextResponse.json({
            error: error.message || 'Failed to process image',
            details: error.toString()
        }, { status: 500 });
    }
}
