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
      You are an expert at transcribing handwritten fire department incident reports.
      Extract the following information into a JSON object.
      
      Fields to extract:
      - act_number (e.g., 10-4-1)
      - date (DD/MM/YYYY)
      - time (HH:MM or HH:MM:SS)
      - commander (A Cargo del Cuerpo)
      - company_commander (A Cargo de la Compania)
      - address (Direccion)
      - corner (Esquina)
      - nature (Naturaleza)
      - origin
      - cause
      - vehicles: array of objects { brand, model, plate, driver, run }
      - involved_people: array of objects { name, run, attended_by_132 (boolean), observation, status }
      - attendance: array of objects { volunteer_name, volunteer_id, role }
      
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
