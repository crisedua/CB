# Security Setup Guide

Follow these steps to complete the OWASP security implementation.

## Step 1: Install Dependencies

```bash
npm install @supabase/auth-helpers-nextjs
```

## Step 2: Run Database Migration

1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `migrations/add_authentication_security.sql`
4. Click "Run"

This will:
- Create audit_logs table
- Create rate_limits table
- Update RLS policies to require authentication
- Add audit triggers to all tables

## Step 3: Configure Supabase Authentication

### Enable Email Authentication:
1. Go to Supabase Dashboard > Authentication > Providers
2. Enable "Email" provider
3. Disable "Confirm email" if you want instant access (or keep enabled for production)
4. Save changes

### Configure Email Templates (Optional):
1. Go to Authentication > Email Templates
2. Customize the confirmation email template
3. Set your site URL to your Vercel domain

## Step 4: Secure Storage Bucket

1. Go to Storage > incident-scans
2. Click on the bucket settings (gear icon)
3. **Uncheck "Public bucket"** to make it private
4. Go to Policies tab
5. Add these policies:

**Policy 1: Authenticated Upload**
```sql
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'incident-scans');
```

**Policy 2: Authenticated Read**
```sql
CREATE POLICY "Authenticated users can read"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'incident-scans');
```

**Policy 3: Authenticated Update**
```sql
CREATE POLICY "Authenticated users can update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'incident-scans');
```

**Policy 4: Authenticated Delete**
```sql
CREATE POLICY "Authenticated users can delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'incident-scans');
```

## Step 5: Add Environment Variable

Add this to your Vercel environment variables:

```
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

You can find this in Supabase Dashboard > Settings > API > service_role key

⚠️ **IMPORTANT**: This is a secret key. Never commit it to git or expose it client-side.

## Step 6: Update Navigation (Optional)

Add login/logout buttons to your navigation. Example:

```typescript
// app/components/Navigation.tsx
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Navigation() {
    const [user, setUser] = useState(null);
    const router = useRouter();

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    return (
        <nav>
            {user ? (
                <div>
                    <span>{user.email}</span>
                    <button onClick={handleLogout}>Cerrar Sesión</button>
                </div>
            ) : (
                <a href="/login">Iniciar Sesión</a>
            )}
        </nav>
    );
}
```

## Step 7: Protect Routes (Optional)

Create an auth guard component:

```typescript
// app/components/AuthGuard.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const [loading, setLoading] = useState(true);
    const [authenticated, setAuthenticated] = useState(false);
    const router = useRouter();

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                setAuthenticated(true);
            } else {
                router.push('/login');
            }
            setLoading(false);
        });
    }, [router]);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (!authenticated) {
        return null;
    }

    return <>{children}</>;
}
```

Then wrap protected pages:

```typescript
// app/scan/page.tsx
import AuthGuard from '@/app/components/AuthGuard';

export default function ScanPage() {
    return (
        <AuthGuard>
            {/* Your page content */}
        </AuthGuard>
    );
}
```

## Step 8: Test Everything

### Test Authentication:
1. Go to `/signup` and create an account
2. Check your email for confirmation (if enabled)
3. Go to `/login` and sign in
4. Verify you can access protected pages

### Test Rate Limiting:
1. Open browser console
2. Run this script to make 11 requests quickly:
```javascript
for (let i = 0; i < 11; i++) {
    fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images: [] })
    }).then(r => r.json()).then(console.log);
}
```
3. The 11th request should return a 429 error

### Test Input Sanitization:
1. Edit a document
2. Try entering `<script>alert('xss')</script>` in a text field
3. Save and verify the script tags are removed

### Test Audit Logs:
1. Make some changes (create, update, delete incidents)
2. Go to Supabase Dashboard > SQL Editor
3. Run: `SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 10;`
4. Verify your actions are logged

## Step 9: Deploy

1. Commit all changes:
```bash
git add .
git commit -m "Implement OWASP security measures"
git push
```

2. Vercel will automatically deploy

3. After deployment, test in production:
   - Try accessing without login
   - Verify rate limiting works
   - Check audit logs

## Troubleshooting

### "User not authenticated" errors:
- Make sure you ran the migration
- Verify authentication is enabled in Supabase
- Check that you're logged in

### Rate limiting not working:
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set in Vercel
- Check that rate_limits table was created
- Look for errors in Vercel logs

### Storage bucket errors:
- Make sure bucket is private
- Verify storage policies are created
- Check that user is authenticated

### Audit logs not appearing:
- Verify triggers were created: `SELECT * FROM pg_trigger WHERE tgname LIKE 'audit%';`
- Check for errors in Supabase logs
- Make sure you're authenticated when making changes

## Security Checklist

- [ ] Database migration run successfully
- [ ] Authentication enabled in Supabase
- [ ] Storage bucket is private with auth policies
- [ ] Service role key added to Vercel
- [ ] Login/signup pages working
- [ ] Rate limiting tested and working
- [ ] Input sanitization tested
- [ ] Audit logs being created
- [ ] All tests passing
- [ ] Deployed to production

## Next Steps

Consider these additional security measures:

1. **Enable 2FA** for admin users
2. **Add CAPTCHA** to login/signup forms
3. **Implement password reset** functionality
4. **Add session timeout** (auto-logout after inactivity)
5. **Set up monitoring** for suspicious activity
6. **Regular security audits** and penetration testing
7. **Implement role-based access control** (RBAC)
8. **Add IP whitelisting** for admin functions

## Support

If you encounter issues:
1. Check Vercel logs for errors
2. Check Supabase logs in Dashboard > Logs
3. Review `SECURITY.md` for detailed documentation
4. Test locally first before deploying
