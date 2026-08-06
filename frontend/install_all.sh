#!/bin/bash

echo "📦 Installing all dependencies..."

# Install Radix UI
npm install @radix-ui/react-slot @radix-ui/react-label @radix-ui/react-select @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-tabs @radix-ui/react-checkbox @radix-ui/react-radio-group @radix-ui/react-switch --legacy-peer-deps

# Install utilities
npm install clsx tailwind-merge class-variance-authority --legacy-peer-deps

# Install form
npm install react-hook-form @hookform/resolvers zod --legacy-peer-deps

# Install UI
npm install lucide-react react-toastify qrcode.react --legacy-peer-deps

# Install HTTP client
npm install axios --legacy-peer-deps

echo "✅ All dependencies installed!"
echo ""
echo "🚀 Run: npm run dev"
