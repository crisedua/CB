# Security Quick Reference Card

## 🔐 OWASP Top 10 Implementation Status

| # | Vulnerability | Status | Key Protection |
|---|--------------|--------|----------------|
| A01 | Broken Access Control | ✅ | RLS + Auth required |
| A02 | Cryptographic Failures | ✅ | HTTPS + TLS |
| A03 | Injection | ✅ | Input validation + sanitization |
| A04 | Insecure Design | ✅ | Rate limiting (10/min) |
| A05 | Security Misconfiguration | ✅ | Security headers + CSP |
| A06 | Vulnerable Components | ⚠️ | Run `npm audit` |
| A07 | Auth Failures | ✅ | Supabase Auth |
| A08 | Data Integrity | ✅ | Audit logs |
| A09 | Logging Failures | ✅ | Comprehensive logging |
| A10 | SSRF | ✅ | No user URLs |

---

## 🚀 Quick Setup (5 Steps)

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Migration
Supabase Dashboard > SQL Editor > Paste `migrations/add_authentication_security.sql` > Run

### 3. Enable Auth
Supabase Dashboard > Authentication > Providers > Enable Email

### 4. Secure Storage
Supabase Dashboard > Storage > incident-scans > Make Private > Add Auth Policies

### 5. Add Env Var
Vercel > Settings > Environment Variables > Add:
```
SUPABASE_SERVICE_ROLE_KEY=your-key-here
```

---

## 🛡️ Security Features at a Glance

### Input Validation
- ✅ Max 5 images per request
- ✅ Max 10MB per image
- ✅ Base64 format validation
- ✅ Max 500 chars (text fields)
- ✅ Max 5000 chars (textarea)
- ✅ Number range: 0-999999

### Input Sanitization
- ✅ Removes `<>` characters
- ✅ Removes `javascript:` protocol
- ✅ Removes event handlers (`onclick=`, etc.)
- ✅ Trims whitespace

### Rate Limiting
- ✅ 10 requests per minute per IP
- ✅ Database-backed tracking
- ✅ Returns 429 when exceeded

### Security Headers
```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: [configured]
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

### Audit Logging
- ✅ All INSERT/UPDATE/DELETE operations
- ✅ Logs user ID, action, old/new data
- ✅ Timestamp, IP, user agent
- ✅ Success/failure tracking

---

## 🧪 Quick Tests

### Test Rate Limiting
```javascript
// Browser console - should fail on 11th request
for (let i = 0; i < 11; i++) {
    fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images: [] })
    }).then(r => r.json()).then(console.log);
}
```

### Test Input Sanitization
1. Edit a document
2. Enter: `<script>alert('xss')</script>`
3. Save
4. Verify script tags are removed

### Test Audit Logs
```sql
-- Supabase SQL Editor
SELECT * FROM audit_logs 
ORDER BY created_at DESC 
LIMIT 10;
```

### Test Authentication
1. Go to `/signup` - create account
2. Go to `/login` - sign in
3. Try accessing `/scan` without login (should redirect)

---

## 📁 Key Files

| File | Purpose |
|------|---------|
| `migrations/add_authentication_security.sql` | Database security setup |
| `SECURITY.md` | Full documentation |
| `SETUP_SECURITY.md` | Step-by-step guide |
| `app/api/extract/route.ts` | API validation + rate limiting |
| `app/documents/[id]/EditableField.tsx` | Input sanitization |
| `middleware.ts` | Security headers |
| `lib/supabase.ts` | Auth configuration |
| `app/login/page.tsx` | Login page |
| `app/signup/page.tsx` | Signup page |

---

## 🔍 Monitoring

### Check Audit Logs
```sql
-- Recent activity
SELECT * FROM audit_logs 
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;

-- Failed operations
SELECT * FROM audit_logs 
WHERE success = false
ORDER BY created_at DESC;

-- Activity by user
SELECT user_id, COUNT(*) as actions
FROM audit_logs
GROUP BY user_id
ORDER BY actions DESC;
```

### Check Rate Limits
```sql
-- Current rate limit status
SELECT identifier, endpoint, request_count, window_start
FROM rate_limits
WHERE window_start > NOW() - INTERVAL '1 hour'
ORDER BY request_count DESC;

-- Clean old records
SELECT cleanup_rate_limits();
```

---

## ⚠️ Common Issues

### "User not authenticated"
- ✅ Run migration
- ✅ Enable auth in Supabase
- ✅ Log in at `/login`

### Rate limiting not working
- ✅ Add `SUPABASE_SERVICE_ROLE_KEY` to Vercel
- ✅ Check rate_limits table exists
- ✅ Check Vercel logs for errors

### Storage errors
- ✅ Make bucket private
- ✅ Add storage policies
- ✅ Verify user is authenticated

### Audit logs empty
- ✅ Check triggers exist: `SELECT * FROM pg_trigger WHERE tgname LIKE 'audit%';`
- ✅ Verify user is authenticated
- ✅ Check Supabase logs

---

## 🎯 Production Checklist

- [ ] Migration run successfully
- [ ] Auth enabled in Supabase
- [ ] Storage bucket private with policies
- [ ] Service role key in Vercel
- [ ] Login/signup working
- [ ] Rate limiting tested (11 requests)
- [ ] Input sanitization tested (XSS attempt)
- [ ] Audit logs being created
- [ ] Security headers present (check DevTools)
- [ ] Error messages sanitized
- [ ] All tests passing
- [ ] Deployed to production

---

## 📞 Emergency Contacts

### If something breaks:
1. Check Vercel logs: Vercel Dashboard > Deployments > [Latest] > Logs
2. Check Supabase logs: Supabase Dashboard > Logs
3. Rollback: `git revert HEAD` and push
4. Disable auth temporarily: Comment out RLS policies

### Quick Rollback
```bash
# Revert to previous version
git revert HEAD
git push

# Or rollback in Vercel Dashboard
Vercel > Deployments > [Previous] > Promote to Production
```

---

## 🔗 Resources

- [OWASP Top 10](https://owasp.org/Top10/)
- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Next.js Security](https://nextjs.org/docs/advanced-features/security-headers)
- [CSP Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)

---

## 📊 Security Metrics

Track these regularly:
- Failed login attempts per day
- Rate limit violations per day
- Audit log entries per day
- Average response time (should not increase significantly)
- Error rate (should remain low)

---

**Last Updated**: February 2026
**Version**: 1.0
**Status**: Production Ready ✅
