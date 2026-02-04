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
      
      Fields to extract:
        - act_number(N° Acto / Parte)
            - ticket_number(N° Boleta)
            - date(DD / MM / YYYY)
            - time(HH: MM)
            - address(Dirección del siniestro)
            - corner(Esquina referencia)
            - area(Sector / Población / Villa)
            - box(N° Casilla)

            - nature(Naturaleza del llamado)
            - origin(Origen)
            - cause(Causa)
            - damage(Daños)

            - commander(A Cargo del Cuerpo)
            - company_commander(A Cargo de la Cía)
            - total_volunteers(Total Voluntarios)
            - safety_officer(Oficial de Seguridad)

            - vehicles: array of objects { brand, model, plate, driver, run, company(e.g.B - 1) }
        - involved_people: array of objects { name, run, age, address, insurance, diagnosis, attended_by_132, observation, status }

        - institutions_present: object with booleans / details { carabineros(patrol_number), samu(ambulance_number), municipal_security, chilquinta, esval, gas_station }

        - observations: Extract the full handwritten narrative / observations text verbatim.
      
      If a field is missing or illegible, set it to null.
      Return ONLY valid JSON.
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
