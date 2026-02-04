import OpenAI from 'openai';
import { NextResponse } from 'next/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "dummy-key",
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { images } = body;

    console.log("API /extract body keys:", Object.keys(body));
    if (images) {
      console.log("Images array length:", images.length);
      if (images.length > 0) {
        console.log("First image start:", images[0].substring(0, 50));
      }
    } else {
      console.log("Images field is missing or null");
    }

    if (!images || images.length === 0) {
      console.error("Error: No images provided in request");
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
  "arrival_time": "Llegada al Lugar (HH:MM)",
  "withdrawal_time": "Retirada (HH:MM)",
  "return_time": "Hora de Regreso (HH:MM)",
  "commander": "A Cargo del Cuerpo (Extract any name in this section)",
  "company_commander": "A Cargo de la Compañía (Extract any name)",
  "address": "Dirección Exacta (Full address)",
  "street_number": "N° (Dirección)",
  "apartment": "Depto",
  "floor": "Piso",
  "corner": "Esquina (Cross street)",
  "commune": "Comuna",
  "population": "Población",
  "area": "Sector",
  "nature": "Naturaleza del lugar (e.g. Casa habitacion, Pastizales)",
  "fire_or_rescue_place": "Lugar del fuego o Rescate",
  "origin": "Origen (Detailed description)",
  "cause": "Causa (Detailed description)",
  "fire_type": "N° de Incendio",
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
    "has_insurance": true/false (Check for ANY indication of insurance),
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
      "attended_by_132": true/false (Check 'Se niega a atencion' or similar),
      "observation": "Observación",
      "moved_by": "Trasladado por 1-2 (Rechaza traslado)",
      "status": "Estado/Observación"
    }
  ],
  "observations": "Full text from Observaciones section (Transcribe EXACTLY as written)",
  "other_observations": "Full text from Otras Observaciones",
  "institutions_present": {
    "carabineros": true/false,
    "samu": true/false,
    "pdi": true/false,
    "prensa": true/false,
    "sernapred": true/false,
    "saesa": true/false,
    "suralis": true/false,
    "ong": true/false,
    "other": "Otros"
  },
  "report_made_by": "Informe elaborado por (Name)",
  "command_call": "Llamado de Comandancia (Name/Number)",
  "signature_name": "Oficial O Bombero a Cargo (Name under signature/mark)"
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
