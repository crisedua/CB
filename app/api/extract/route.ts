import OpenAI from 'openai';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "dummy-key",
});

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10; // 10 requests per minute

// Input validation helpers (A03: Injection Prevention)
function validateBase64Image(image: string): boolean {
  if (typeof image !== 'string') return false;
  if (image.length > 10 * 1024 * 1024) return false; // Max 10MB
  if (!image.startsWith('data:image/')) return false;
  return true;
}

function sanitizeInput(input: any): any {
  if (typeof input === 'string') {
    // Remove potential XSS/injection characters
    return input.replace(/[<>\"']/g, '').trim();
  }
  return input;
}

// Rate limiting check
async function checkRateLimit(identifier: string): Promise<boolean> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW);
    
    const { data, error } = await supabase
      .from('rate_limits')
      .select('request_count')
      .eq('identifier', identifier)
      .eq('endpoint', '/api/extract')
      .gte('window_start', windowStart.toISOString())
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
      console.error('Rate limit check error:', error);
      return true; // Allow on error
    }

    if (data && data.request_count >= RATE_LIMIT_MAX_REQUESTS) {
      return false; // Rate limit exceeded
    }

    // Update or insert rate limit record
    if (data) {
      await supabase
        .from('rate_limits')
        .update({ request_count: data.request_count + 1 })
        .eq('identifier', identifier)
        .eq('endpoint', '/api/extract')
        .gte('window_start', windowStart.toISOString());
    } else {
      await supabase
        .from('rate_limits')
        .insert({
          identifier,
          endpoint: '/api/extract',
          request_count: 1,
          window_start: new Date().toISOString()
        });
    }

    return true;
  } catch (e) {
    console.error('Rate limit error:', e);
    return true; // Allow on error
  }
}

export async function POST(req: Request) {
  try {
    // Get client IP for rate limiting
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : 'unknown';
    
    // Check rate limit (A04: Insecure Design - Rate Limiting)
    const rateLimitOk = await checkRateLimit(ip);
    if (!rateLimitOk) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    // Parse and validate request body
    let body;
    try {
      body = await req.json();
    } catch (e) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

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

    // Input validation (A03: Injection)
    if (!images || !Array.isArray(images)) {
      console.error("Error: Images must be an array");
      return NextResponse.json(
        { error: 'Images must be an array' },
        { status: 400 }
      );
    }

    if (images.length === 0) {
      console.error("Error: No images provided in request");
      return NextResponse.json(
        { error: 'No images provided' },
        { status: 400 }
      );
    }

    if (images.length > 5) {
      console.error("Error: Too many images");
      return NextResponse.json(
        { error: 'Maximum 5 images allowed' },
        { status: 400 }
      );
    }

    // Validate each image
    for (let i = 0; i < images.length; i++) {
      if (!validateBase64Image(images[i])) {
        console.error(`Error: Invalid image format at index ${i}`);
        return NextResponse.json(
          { error: `Invalid image format at index ${i}` },
          { status: 400 }
        );
      }
    }

    const prompt = `
You are an expert at extracting data from handwritten Chilean fire department incident reports.
${images.length > 1 ? `This form has ${images.length} pages. Read ALL pages and combine the information.` : ''}

CRITICAL: Read EVERY field on the form, even if handwriting is messy. Extract ALL visible text.

Return a complete JSON object with these exact fields:

{
  "act_number": "Acto: (top left)",
  "incident_number": "N° de Incendio: (top right)",
  "list_number": "Lista N°: (top right)",
  "date": "Fecha (Día, mes y año): DD/MM/YYYY",
  "time": "Hora del Acto: HH:MM",
  "arrival_time": "Llegada al Lugar: HH:MM",
  "retired_time": "Retirada: HH:MM",
  "return_time": "Hora de Regreso: HH:MM",
  
  "commander": "A Cargo del Cuerpo: (full name)",
  "company_commander": "A Cargo de la Compañía: (full name)",
  "company_number": "N°: (next to company commander)",
  "department": "Depto:",
  "floor": "Piso:",
  
  "address": "Dirección Exacta: (full street address)",
  "corner": "Esquina (más próx.):",
  "commune": "Comuna:",
  "population": "Población:",
  "area": "Sector:",
  
  "nature": "Naturaleza del lugar: (e.g., Casa habitación, Loza Hall)",
  "fire_rescue_location": "Lugar del fuego o Rescate: (detailed location)",
  "origin": "Origen: (cause origin)",
  "cause": "Causa: (cause description)",
  
  "vehicles": [
    "Extract ALL rows from Marca/Modelo/Patente/Nombre Conductor/RUN table",
    {"brand": "Marca", "model": "Modelo", "plate": "Patente", "driver": "Nombre Conductor", "run": "RUN"}
  ],
  
  "insurance": {
    "has_insurance": "SI or NO checkbox",
    "company": "Compañía de Seguros:",
    "mobile_units": ["Extract ALL checked: R-5, RX-2, RX-5, RCS"],
    "conductors": "Conductor(es): (all names listed)",
    "other_classes": "Otras Cías: (text)"
  },
  
  "company_attendance": {
    "quinta": "5ª column number",
    "primera": "1ª column number",
    "segunda": "2ª column number",
    "tercera": "3ª column number",
    "cuarta": "4ª column number",
    "sexta": "6ª column number",
    "septima": "7ª column number",
    "octava": "8ª column number",
    "bc_bp": "BC/BP column number"
  },
  
  "attendance_sector": {
    "rural": "Rural checkbox true/false",
    "location": "Lugar: text",
    "sector_numbers": "Asiste Sector: [1,2,3,4,5,6] checked boxes"
  },
  
  "attendance_correction": "Corrección: text",
  
  "cant_lesionados": "Cant. Lesionados: number",
  "cant_involucrados": "Cant. Involucrados: number",
  "cant_damnificados": "Cant. Damnificados: number",
  "cant_7_3": "Cant. 7-3: number",
  
  "involved_people": [
    "Extract ALL rows from people table",
    {
      "name": "Nombre Completo",
      "run": "RUN",
      "attended_by_132": "SI/NO checkbox as boolean",
      "observation": "Observación (Trasladado por 1-2, Rechaza traslado, etc.)",
      "status": "Estado: Hospitalizado, etc."
    }
  ],
  
  "observations": "Observaciones: (FULL TEXT - transcribe everything written)",
  "other_observations": "Otras Observaciones: (FULL TEXT)",
  
  "institutions": [
    "Extract from bottom section - En el lugar checkboxes AND detailed entries",
    {
      "type": "carabineros/ambulancia/pdi/prensa/bernagred/saesa/suralic/ong",
      "present": true,
      "name": "Nombre Completo (for carabineros/ambulancia)",
      "grade": "Grado (for carabineros)",
      "comisaria": "Comisaría (for carabineros)",
      "movil": "Móvil number",
      "cargo": "Cargo (for ambulancia)",
      "entidad": "Entidad (for ambulancia)"
    }
  ],
  
  "report_prepared_by": "Informe elaborado por: Incendio: (name)",
  "list_prepared_by": "Lista confeccionada por: (name)",
  "officer_in_charge": "Oficial O Bombero a Cargo: (name - look for signature/name at bottom)",
  "called_by_command": "Llamado de Comandancia: (text)"
}

EXTRACTION INSTRUCTIONS:
1. Read EVERY section of the form from top to bottom
2. Extract ALL handwritten text, even if messy or abbreviated
3. For tables (vehicles, people), get EVERY row with ANY data
4. For checkboxes (✓, X, filled), return true if marked
5. For attendance grid, read numbers in each company column carefully
6. For institutions, check BOTH the checkboxes AND the detailed name/info sections below
7. Transcribe observations EXACTLY as written
8. If field is empty, use null
9. If illegible, use "illegible"
${images.length > 1 ? '10. Combine ALL data from both pages' : ''}

Return ONLY valid JSON, no markdown.
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

    // Sanitize error messages to avoid information disclosure (A05: Security Misconfiguration)
    let errorMessage = 'Failed to process image';
    let statusCode = 500;

    // Check for common OpenAI errors
    if (error.status === 401) {
      errorMessage = 'Authentication error';
      statusCode = 401;
    } else if (error.status === 429) {
      errorMessage = 'Service temporarily unavailable';
      statusCode = 429;
    } else if (error.status === 400) {
      errorMessage = 'Invalid request';
      statusCode = 400;
    }

    // Log full error server-side but don't expose to client
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
}
