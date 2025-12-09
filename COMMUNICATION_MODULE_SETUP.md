# Communication Module Setup

## Environment Variables

Add the following entries to your deployment environment and local `.env` file (see `.env.example` for the full list):

- `COMMUNICATION_CREDENTIAL_SECRET` - 32+ character secret used to encrypt tenant provider credentials.
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` - existing Supabase configuration.
- Provider-specific keys (e.g. SendGrid, Twilio, WhatsApp, Firebase) based on the channels you plan to activate.

Install new runtime dependencies:

\`\`\`bash
npm install
\`\`\`

## Database Migration

Run the new Supabase migration before deploying the updated application:

\`\`\`bash
supabase db push
# or, if you prefer manual migration execution
supabase migration up 20251031121000
\`\`\`

This creates `communication_provider_integrations`, the associated audit log table, triggers, policies, and the sanitized view consumed by the application.

## Verifying Provider Connections

1. Visit `app/communication/settings` in the admin console.
2. Populate the credentials for each channel (email, SMS, WhatsApp, push, Teams, Slack, webhooks).
3. Use the **Test connection** button to validate each integration. The API will run static health checks and persist `last_validated_at` / `validation_error` in Supabase.

## Automation Event Hook

Call the event endpoint whenever payroll or HR workflows emit lifecycle events:

\`\`\`http
POST /api/communication/events
Content-Type: application/json

{
  "type": "PAYROLL.COMPLETED",
  "employeeIds": ["<employee-uuid>"]
}
\`\`\`

The automation layer resolves employee contact details, selects the appropriate provider, and delivers notifications through the configured channel.

Supported event types out of the box:

- `PAYROLL.COMPLETED`
- `PAYROLL.VARIANCE_DETECTED`
- `LEAVE.APPROVED`
- `LEAVE.REJECTED`
- `HR.DOC_EXPIRING`

Extend `lib/communication/automations.ts` to add new event handlers or customise template text.
