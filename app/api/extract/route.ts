import OpenAI from 'openai';
import { NextResponse } from 'next/server';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || "dummy-key",
});

export async function POST(req: Request) {
    try {
        const { images } = await req.json();

        if (!images || images.length === 0) {
            return NextResponse.json({ error: 'No images provided' }, { status: 400 });
        }

        const prompt = `
You are an expert at extracting data from handwritten fire department incident reports.

${images.length > 1 ? `This form has ${images.length} pages. Combine information from ALL pages.` : ''}

Carefully read this Chilean fire department form and extract ALL visible information into a JSON object.

Extract these fields (use null if not present):

{
  "act_number": "N° Acto",
  "date": "DD/MM/YYYY",
  "time": "HH:MM",
  "return_time": "Hora de Regreso",
  "commander": "A Cargo del Cuerpo",
  "company_commander": "A Cargo de la Compañía",
  "address": "Dirección Exacta",
  "corner": "Esquina",
  "commune": "Comuna",
  "population": "Población",
  "area": "Sector",
  "nature": "Naturaleza",
  "origin": "Origen",
  "cause": "Causa",
  "vehicles": [
    {
      "brand": "Marca",
      "model": "Modelo",
      "plate": "Patente",
      "driver": "Nombre Conductor",
      "run": "RUN"
    }
  ],
  "insurance": {
    "has_insurance": true/false,
    "company": "Compañía de Seguros",
    "mobile_units": ["R-5", "RCS"],
    "conductors": "Conductor(es)"
  },
  "company_attendance": {
    "quinta": 0,
    "primera": 0,
    "segunda": 0,
    "tercera": 0,
    "cuarta": 0,
    "sexta": 0,
    "septima": 0,
    "octava": 0,
    "bc_bp": 0
  },
  "cant_lesionados": 0,
  "cant_involucrados": 0,
  "cant_damnificados": 0,
  "involved_people": [
    {
      "name": "Nombre Completo",
      "run": "RUN",
      "attended_by_132": true/false,
      "observation": "Observación"
    }
  ],
  "observations": "Full text from Observaciones section",
  "other_observations": "Full text from Otras Observaciones",
  "institutions_present": {
    "carabineros": true/false,
    "samu": true/false,
    "pdi": true/false,
    "prensa": true/false,
    "bernagred": true/false,
    "saesa": true/false,
    "other": "other institutions"
  }
}

CRITICAL RULES:
- Extract ALL handwritten text from every section across ALL pages
- For tables (vehicles, people), extract EVERY row that has any data
- For checkboxes marked with ✓ or X, set to true
- Read all numbers from the attendance grid carefully
- Include full observation text
- If a field is empty, use null
- If text is illegible, use "illegible"
${images.length > 1 ? '- Combine data from both pages into a single complete JSON object' : ''}

Return ONLY the JSON object, no markdown formatting.
`;

        // Build content array with all images
        const content: any[] = [{ type: "text", text: prompt }];
        
        images.forEach((image: string, index: number) => {
            content.push({
                type: "image_url",
                image_url: {
                    url: image,
                    detail: "high"
                },
            });
        });

        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "user",
                    content: content,
                },
            ],
            max_tokens: 8000,
            temperature: 0.1,
        });

        // Debug info
        console.log("Usage:", response.usage);

        const responseContent = response.choices[0].message.content;
        const cleanContent = responseContent?.replace(/```json/g, '').replace(/```/g, '').trim();

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
