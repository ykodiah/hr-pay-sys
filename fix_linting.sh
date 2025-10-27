#!/bin/bash

# Fix unescaped entities in JSX files
find app components -name "*.tsx" -type f -exec sed -i "s/'/\&apos;/g" {} \;
find app components -name "*.tsx" -type f -exec sed -i 's/"/\&quot;/g' {} \;

# Fix the module assignment issue in ClientAppLayout.tsx
sed -i 's/module =/window.module =/g' app/app/ClientAppLayout.tsx

echo "Linting fixes applied"
