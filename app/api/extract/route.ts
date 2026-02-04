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
Extract ALL information from this Chilean fire department incident report form.
Read EVERY handwritten field, table, checkbox, and section carefully.

Return a JSON object with these fields (set to null if empty):

BASIC INFO:
- act_number: N° Acto/Parte
- date: Fecha (DD/MM/YYYY)
- time: Hora del Acto (HH:MM)
- return_time: Hora de Regreso
- commander: A Cargo del Cuerpo
- company_commander: A Cargo de la Compañía
- address: Dirección Exacta
- corner: Esquina más próx.
- commune: Comuna
- population: Población
- area: Sector
- nature: Naturaleza del lugar
- origin: Origen
- cause: Causa

VEHICLES (extract ALL rows from Marca/Modelo/Patente/Conductor/RUN table):
- vehicles: [{ brand, model, plate, driver, run }]

INSURANCE & MOBILE UNITS:
- insurance: { has_insurance: boolean, company: string, mobile_units: ["R-5", "RCS"], conductors: string }

COMPANY ATTENDANCE (extract numbers from grid):
- company_attendance: { quinta, primera, segunda, tercera, cuarta, sexta, septima, octava, bc_bp }

PEOPLE COUNTS & DETAILS:
- cant_lesionados: number
- cant_involucrados: number  
- cant_damnificados: number
- involved_people: [{ name, run, attended_by_132: boolean, observation }]

OBSERVATIONS:
- observations: full text from "Observaciones:" section
- other_observations: text from "Otras Observaciones:" section

INSTITUTIONS (checkboxes at bottom):
- institutions_present: { 
    carabineros: boolean,
    samu: boolean,
    pdi: boolean,
    prensa: boolean,
    bernagred: boolean,
    saesa: boolean,
    other: string
  }

IMPORTANT:
1. Extract ALL handwritten text, even if messy
2. For tables, get EVERY row that has any data
3. For SI/NO checkboxes, return true/false
4. Read numbers carefully from attendance grid
5. Don't skip any sections
6. If illegible, write "illegible" not null

Return ONLY valid JSON, no markdown.
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
