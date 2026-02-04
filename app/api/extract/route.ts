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
- involved_people: array of ALL people listed { name, run, age, address, insurance, diagnosis, attended_by_132 (boolean), observation, status }

- attendance: array of ALL firefighters who attended { volunteer_name, volunteer_id, present (boolean) }

- institutions_present: object { 
    carabineros (boolean and patrol_number if present), 
    samu (boolean and ambulance_number if present), 
    municipal_security (boolean), 
    chilquinta (boolean), 
    esval (boolean), 
    gas_station (boolean),
    other (any other institutions mentioned)
  }

- observations (Observaciones principales / narrative text - extract ALL written text verbatim)
- other_observations (Otras observaciones / additional notes / marginal notes)

IMPORTANT INSTRUCTIONS:
1. Read EVERY section of the form, including headers, footers, and margins
2. Extract ALL handwritten text, even if messy or abbreviated
3. For checkboxes, note which ones are marked
4. For tables (vehicles, people, attendance), extract ALL rows, even partially filled
5. Preserve exact spelling and abbreviations used
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
                            },
                        },
                    ],
                },
            ],
            max_tokens: 4096,
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
