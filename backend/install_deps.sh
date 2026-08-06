#!/bin/bash

echo "📦 Installing dependencies..."

# Install packages
go get github.com/go-sql-driver/mysql
go get github.com/google/uuid
go get github.com/joho/godotenv
go get golang.org/x/crypto/bcrypt

# Tidy
go mod tidy

echo "✅ Dependencies installed successfully!"
echo ""
echo "🚀 Run seeder: go run seeders/seeder.go"
