#!/bin/bash

echo "🔍 Scanning for potential hardcoded secrets..."
echo ""

# Check for database URLs
echo "Checking for database URLs..."
if grep -r "postgresql://" . --exclude-dir=node_modules --exclude-dir=.git --exclude=".env*" --exclude="check-secrets.sh" -q; then
    echo "❌ FOUND: Potential database URLs in code"
    grep -r "postgresql://" . --exclude-dir=node_modules --exclude-dir=.git --exclude=".env*" --exclude="check-secrets.sh"
else
    echo "✅ PASS: No database URLs in code"
fi

echo ""

# Check for API keys
echo "Checking for API keys..."
if grep -r "API_KEY.*=" . --exclude-dir=node_modules --exclude-dir=.git --exclude=".env*" --exclude="check-secrets.sh" -q; then
    echo "❌ FOUND: Potential API keys in code"
    grep -r "API_KEY.*=" . --exclude-dir=node_modules --exclude-dir=.git --exclude=".env*" --exclude="check-secrets.sh"
else
    echo "✅ PASS: No API keys in code"
fi

echo ""

# Check for NextAuth secrets
echo "Checking for NextAuth secrets..."
if grep -r "NEXTAUTH_SECRET.*=" . --exclude-dir=node_modules --exclude-dir=.git --exclude=".env*" --exclude="check-secrets.sh" -q; then
    echo "❌ FOUND: Potential NextAuth secrets in code"
    grep -r "NEXTAUTH_SECRET.*=" . --exclude-dir=node_modules --exclude-dir=.git --exclude=".env*" --exclude="check-secrets.sh"
else
    echo "✅ PASS: No NextAuth secrets in code"
fi

echo ""
echo "🔍 Scan complete!"
