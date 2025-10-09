# Supabase CLI Quick Reference

## 🚀 Quick Start Commands

### 1. Link to Your Remote Project
```bash
npx supabase link --project-ref YOUR_PROJECT_REF
```

### 2. Push Database Migrations
```bash
npx supabase db push
```

### 3. Generate TypeScript Types
```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_REF > types/supabase.ts
```

### 4. Start Your App
```bash
npm run dev
```

## 📋 Complete Setup Checklist

- [ ] Update `.env.local` with your Supabase credentials
- [ ] Link to remote project: `npx supabase link --project-ref YOUR_PROJECT_REF`
- [ ] Push migrations: `npx supabase db push`
- [ ] Generate types: `npx supabase gen types typescript --project-id YOUR_PROJECT_REF > types/supabase.ts`
- [ ] Test the application: `npm run dev`

## 🔧 Useful Commands

| Command | Description |
|---------|-------------|
| `npx supabase link --project-ref YOUR_PROJECT_REF` | Link to remote project |
| `npx supabase db push` | Push migrations to remote |
| `npx supabase db pull` | Pull remote changes |
| `npx supabase gen types typescript --project-id YOUR_PROJECT_REF > types/supabase.ts` | Generate TypeScript types |
| `npx supabase dashboard` | Open Supabase Dashboard |
| `npx supabase migration new migration_name` | Create new migration |
| `npx supabase migration list` | List migrations |

## 🎯 What the Migrations Do

1. **Adds `annual_salary` column** to `employee_financial` table
2. **Creates `custom_banks` table** for company-specific banks
3. **Removes loan-related columns** from `employee_financial` table
4. **Sets up RLS policies** for data security
5. **Creates helper functions** for bank management

## 🐛 Troubleshooting

### If migrations fail:
```bash
npx supabase db pull
npx supabase db push
```

### If types don't update:
```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_REF > types/supabase.ts
```

### If you get permission errors:
- Check your API keys in `.env.local`
- Verify you're linked to the correct project

## 📁 Important Files

- `.env.local` - Your Supabase credentials
- `supabase/migrations/` - Database migration files
- `types/supabase.ts` - Generated TypeScript types
- `scripts/` - Helper scripts

## 🎉 You're Ready!

Once you complete the setup, your employee financial form will have:
- ✅ Annual salary field (mandatory)
- ✅ Auto-calculated monthly salary
- ✅ Enhanced bank list with First National Bank Ghana Limited
- ✅ Custom bank functionality
- ✅ Removed loan details section

Happy coding! 🚀