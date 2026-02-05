import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
            return NextResponse.json({
                error: 'Environment variables not set',
                supabaseUrl: supabaseUrl ? 'SET' : 'MISSING',
                supabaseKey: supabaseKey ? 'SET' : 'MISSING'
            }, { status: 500 });
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        // List all buckets
        const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();

        if (bucketsError) {
            return NextResponse.json({
                error: 'Failed to list buckets',
                details: bucketsError,
                supabaseUrl: supabaseUrl
            }, { status: 500 });
        }

        // Check if incident-scans bucket exists
        const incidentScansBucket = buckets?.find(b => b.id === 'incident-scans');

        return NextResponse.json({
            success: true,
            supabaseUrl: supabaseUrl,
            totalBuckets: buckets?.length || 0,
            buckets: buckets?.map(b => ({ id: b.id, name: b.name, public: b.public })),
            incidentScansBucketExists: !!incidentScansBucket,
            incidentScansBucket: incidentScansBucket || null
        });

    } catch (error: any) {
        return NextResponse.json({
            error: 'Unexpected error',
            message: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}
