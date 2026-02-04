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
You are an expert at transcribing handwritten fire department incident reports (Bomberos Chile).
Your goal is to extract EVERY piece of information written on the form into a structured JSON object.
Read ALL text carefully, including small notes, checkboxes, and marginal annotations.

CRITICAL: Extract ALL fields present on the form, even if partially filled or handwritten in margins.

Fields to extract:
- act_number (N° Acto / Parte / N° Parte)
- ticket_number (N° Boleta)
- date (DD/MM/YYYY format)
- time (HH:MM format)
- address (Dirección del siniestro - full street address)
- corner (Esquina / referencia / entre calles)
- area (Sector / Población / Villa / Barrio)
- box (N° Casilla / Caja)

- nature (Naturaleza del llamado / siniestro - e.g., incendio, rescate, accidente)
- origin (Origen del incidente)
- cause (Causa del incidente)
- damage (Daños materiales / descripción)

- commander (A Cargo del Cuerpo / Comandante del Cuerpo)
- company_commander (A Cargo de la Compañía / Comandante Cía)
- total_volunteers (Total de Voluntarios / Dotación)
- safety_officer (Oficial de Seguridad)

- vehicles: array of ALL vehicles/machines listed { brand, model, plate, driver, run, company (e.g., "B-1", "M-2") }

- involved_people: CRITICAL - Parse ALL people mentioned in ANY section:
  * Look in dedicated "Personas Involucradas" tables
  * Parse from observations text (e.g., "3 involucrados", "1 adulto lesionado")
  * Extract from narrative descriptions
  * Each person should be: { name, run, age, address, insurance, diagnosis, attended_by_132 (boolean), observation, status }
  * If names aren't provided but people are mentioned (e.g., "3 involucrados"), create entries like:
    - { name: "Persona 1", observation: "Involucrado en incidente" }
    - { name: "Persona 2", observation: "Involucrado en incidente" }
  * If someone was "trasladado x 132" or "atendido por 132", set attended_by_132: true
  * Parse injury descriptions: "adulto lesionado" → { age: "adulto", status: "lesionado", attended_by_132: true }

- attendance: array of ALL firefighters who attended { volunteer_name, volunteer_id, present (boolean) }

- institutions_present: Parse from checkboxes AND text mentions:
  * carabineros (boolean and patrol_number if present)
  * samu (boolean and ambulance_number if present)
  * municipal_security (boolean)
  * chilquinta (boolean)
  * esval (boolean)
  * gas_station (boolean)
  * other (any other institutions mentioned)
  * If mentioned in text like "✓ Carabineros" or "Carabineros presentes", set to true

- observations (Observaciones principales / narrative text - extract ALL written text verbatim, but DON'T duplicate info already parsed into structured fields)
- other_observations (Otras observaciones / additional notes / marginal notes)

PARSING RULES FOR OBSERVATIONS TEXT:
1. If observations mention people counts (e.g., "3 involucrados"), create that many entries in involved_people array
2. If observations mention injuries (e.g., "1 adulto lesionado"), add to involved_people with status: "lesionado"
3. If observations mention "trasladado x 132" or "atendido 132", set attended_by_132: true for that person
4. Extract institution names from observations and add to institutions_present
5. Keep the original observation text, but ALSO parse it into structured data

IMPORTANT INSTRUCTIONS:
1. Read EVERY section of the form, including headers, footers, and margins
2. Extract ALL handwritten text, even if messy or abbreviated
3. For checkboxes, note which ones are marked
4. For tables (vehicles, people, attendance), extract ALL rows, even partially filled
5. Parse narrative text into structured data when possible
6. If text is illegible, mark as "illegible" rather than null
7. Include any stamps, signatures, or official marks mentioned

If a field is completely empty or not present on the form, set it to null.
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
