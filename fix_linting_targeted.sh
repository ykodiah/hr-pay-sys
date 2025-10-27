#!/bin/bash

# Fix specific unescaped entities in key files
echo "Fixing unescaped entities..."

# Fix about page
sed -i "s/Don't/Don\&apos;t/g" app/about/page.tsx
sed -i "s/we're/we\&apos;re/g" app/about/page.tsx
sed -i "s/you're/you\&apos;re/g" app/about/page.tsx
sed -i "s/let's/let\&apos;s/g" app/about/page.tsx
sed -i "s/it's/it\&apos;s/g" app/about/page.tsx
sed -i "s/that's/that\&apos;s/g" app/about/page.tsx
sed -i "s/we'll/we\&apos;ll/g" app/about/page.tsx
sed -i "s/you'll/you\&apos;ll/g" app/about/page.tsx
sed -i "s/\"Akwaaba\"/\&quot;Akwaaba\&quot;/g" app/about/page.tsx

# Fix careers page
sed -i "s/Don't/Don\&apos;t/g" app/careers/page.tsx
sed -i "s/we're/we\&apos;re/g" app/careers/page.tsx
sed -i "s/you're/you\&apos;re/g" app/careers/page.tsx
sed -i "s/let's/let\&apos;s/g" app/careers/page.tsx
sed -i "s/it's/it\&apos;s/g" app/careers/page.tsx
sed -i "s/that's/that\&apos;s/g" app/careers/page.tsx
sed -i "s/we'll/we\&apos;ll/g" app/careers/page.tsx
sed -i "s/you'll/you\&apos;ll/g" app/careers/page.tsx

# Fix contact page
sed -i "s/Don't/Don\&apos;t/g" app/contact/page.tsx
sed -i "s/we're/we\&apos;re/g" app/contact/page.tsx
sed -i "s/you're/you\&apos;re/g" app/contact/page.tsx
sed -i "s/let's/let\&apos;s/g" app/contact/page.tsx
sed -i "s/it's/it\&apos;s/g" app/contact/page.tsx
sed -i "s/that's/that\&apos;s/g" app/contact/page.tsx
sed -i "s/we'll/we\&apos;ll/g" app/contact/page.tsx
sed -i "s/you'll/you\&apos;ll/g" app/contact/page.tsx

# Fix demo page
sed -i "s/Don't/Don\&apos;t/g" app/demo/page.tsx
sed -i "s/we're/we\&apos;re/g" app/demo/page.tsx
sed -i "s/you're/you\&apos;re/g" app/demo/page.tsx
sed -i "s/let's/let\&apos;s/g" app/demo/page.tsx
sed -i "s/it's/it\&apos;s/g" app/demo/page.tsx
sed -i "s/that's/that\&apos;s/g" app/demo/page.tsx
sed -i "s/we'll/we\&apos;ll/g" app/demo/page.tsx
sed -i "s/you'll/you\&apos;ll/g" app/demo/page.tsx

# Fix get-started page
sed -i "s/Don't/Don\&apos;t/g" app/get-started/page.tsx
sed -i "s/we're/we\&apos;re/g" app/get-started/page.tsx
sed -i "s/you're/you\&apos;re/g" app/get-started/page.tsx
sed -i "s/let's/let\&apos;s/g" app/get-started/page.tsx
sed -i "s/it's/it\&apos;s/g" app/get-started/page.tsx
sed -i "s/that's/that\&apos;s/g" app/get-started/page.tsx
sed -i "s/we'll/we\&apos;ll/g" app/get-started/page.tsx
sed -i "s/you'll/you\&apos;ll/g" app/get-started/page.tsx

# Fix help page
sed -i "s/Don't/Don\&apos;t/g" app/help/page.tsx
sed -i "s/we're/we\&apos;re/g" app/help/page.tsx
sed -i "s/you're/you\&apos;re/g" app/help/page.tsx
sed -i "s/let's/let\&apos;s/g" app/help/page.tsx
sed -i "s/it's/it\&apos;s/g" app/help/page.tsx
sed -i "s/that's/that\&apos;s/g" app/help/page.tsx
sed -i "s/we'll/we\&apos;ll/g" app/help/page.tsx
sed -i "s/you'll/you\&apos;ll/g" app/help/page.tsx

# Fix launch page
sed -i "s/Don't/Don\&apos;t/g" app/launch/page.tsx
sed -i "s/we're/we\&apos;re/g" app/launch/page.tsx
sed -i "s/you're/you\&apos;re/g" app/launch/page.tsx
sed -i "s/let's/let\&apos;s/g" app/launch/page.tsx
sed -i "s/it's/it\&apos;s/g" app/launch/page.tsx
sed -i "s/that's/that\&apos;s/g" app/launch/page.tsx
sed -i "s/we'll/we\&apos;ll/g" app/launch/page.tsx
sed -i "s/you'll/you\&apos;ll/g" app/launch/page.tsx

# Fix login page
sed -i "s/Don't/Don\&apos;t/g" app/login/page.tsx
sed -i "s/we're/we\&apos;re/g" app/login/page.tsx
sed -i "s/you're/you\&apos;re/g" app/login/page.tsx
sed -i "s/let's/let\&apos;s/g" app/login/page.tsx
sed -i "s/it's/it\&apos;s/g" app/login/page.tsx
sed -i "s/that's/that\&apos;s/g" app/login/page.tsx
sed -i "s/we'll/we\&apos;ll/g" app/login/page.tsx
sed -i "s/you'll/you\&apos;ll/g" app/login/page.tsx

# Fix not-found page
sed -i "s/Don't/Don\&apos;t/g" app/not-found.tsx
sed -i "s/we're/we\&apos;re/g" app/not-found.tsx
sed -i "s/you're/you\&apos;re/g" app/not-found.tsx
sed -i "s/let's/let\&apos;s/g" app/not-found.tsx
sed -i "s/it's/it\&apos;s/g" app/not-found.tsx
sed -i "s/that's/that\&apos;s/g" app/not-found.tsx
sed -i "s/we'll/we\&apos;ll/g" app/not-found.tsx
sed -i "s/you'll/you\&apos;ll/g" app/not-found.tsx

# Fix privacy page
sed -i "s/Don't/Don\&apos;t/g" app/privacy/page.tsx
sed -i "s/we're/we\&apos;re/g" app/privacy/page.tsx
sed -i "s/you're/you\&apos;re/g" app/privacy/page.tsx
sed -i "s/let's/let\&apos;s/g" app/privacy/page.tsx
sed -i "s/it's/it\&apos;s/g" app/privacy/page.tsx
sed -i "s/that's/that\&apos;s/g" app/privacy/page.tsx
sed -i "s/we'll/we\&apos;ll/g" app/privacy/page.tsx
sed -i "s/you'll/you\&apos;ll/g" app/privacy/page.tsx

# Fix terms page
sed -i "s/Don't/Don\&apos;t/g" app/terms/page.tsx
sed -i "s/we're/we\&apos;re/g" app/terms/page.tsx
sed -i "s/you're/you\&apos;re/g" app/terms/page.tsx
sed -i "s/let's/let\&apos;s/g" app/terms/page.tsx
sed -i "s/it's/it\&apos;s/g" app/terms/page.tsx
sed -i "s/that's/that\&apos;s/g" app/terms/page.tsx
sed -i "s/we'll/we\&apos;ll/g" app/terms/page.tsx
sed -i "s/you'll/you\&apos;ll/g" app/terms/page.tsx

# Fix training page
sed -i "s/Don't/Don\&apos;t/g" app/training/page.tsx
sed -i "s/we're/we\&apos;re/g" app/training/page.tsx
sed -i "s/you're/you\&apos;re/g" app/training/page.tsx
sed -i "s/let's/let\&apos;s/g" app/training/page.tsx
sed -i "s/it's/it\&apos;s/g" app/training/page.tsx
sed -i "s/that's/that\&apos;s/g" app/training/page.tsx
sed -i "s/we'll/we\&apos;ll/g" app/training/page.tsx
sed -i "s/you'll/you\&apos;ll/g" app/training/page.tsx

echo "Targeted linting fixes applied"
