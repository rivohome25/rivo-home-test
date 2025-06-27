# CREDENTIAL ROTATION GUIDE

## Emergency Credential Rotation

If credentials have been compromised, follow these steps IMMEDIATELY:

### 1. Supabase Keys
1. Go to Supabase Dashboard → Settings → API
2. Generate new anon and service role keys
3. Update environment variables
4. Restart all services
5. Revoke old keys

### 2. Stripe Keys
1. Go to Stripe Dashboard → Developers → API Keys
2. Create new restricted API key with minimal permissions
3. Update webhook endpoint secret
4. Test payment flows
5. Delete old keys

### 3. Third-party Services
1. Mailchimp: Regenerate API key
2. Any monitoring services: Rotate keys
3. CI/CD systems: Update secrets

## Regular Rotation Schedule

- **Supabase Keys**: Every 90 days
- **Stripe Keys**: Every 90 days  
- **API Keys**: Every 60 days
- **Webhook Secrets**: Every 30 days

## Rotation Checklist

- [ ] Generate new credentials
- [ ] Update all environments (dev, staging, prod)
- [ ] Update CI/CD pipeline secrets
- [ ] Test all integrations
- [ ] Revoke old credentials
- [ ] Update documentation
- [ ] Notify team of rotation

## Security Monitoring

After rotation, monitor for:
- Failed authentication attempts
- Unusual API usage patterns
- Error rates in logs
- User complaints about service issues

## Emergency Contacts

- Security Team: security@your-company.com
- DevOps Team: devops@your-company.com
- On-call Engineer: +1-xxx-xxx-xxxx
