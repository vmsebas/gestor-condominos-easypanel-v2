#!/bin/bash

# Script de identificación rápida del proyecto
# Ejecuta: bash identify.sh

echo "🔍 IDENTIFICANDO PROYECTO..."
echo ""
echo "📁 Directorio actual:"
pwd
echo ""

if [ -f "package.json" ]; then
    echo "📦 Package.json encontrado:"
    echo "   Nombre: $(cat package.json | grep '"name"' | sed 's/.*: "\(.*\)".*/\1/')"
    echo "   Versión: $(cat package.json | grep '"version"' | sed 's/.*: "\(.*\)".*/\1/')"
    echo ""
else
    echo "❌ No se encontró package.json en este directorio"
    exit 1
fi

if [ -d ".git" ]; then
    echo "🔗 Git Remote:"
    git remote -v | grep origin | head -1
    echo ""
    echo "📌 Branch actual:"
    git branch --show-current
    echo ""
else
    echo "⚠️  No es un repositorio Git"
    echo ""
fi

if [ -f "PROJECT_ID.md" ]; then
    echo "✅ Este es un proyecto identificado correctamente"
    echo ""
    echo "📄 Características principales:"
    grep -A 6 "### Active Features" PROJECT_ID.md | tail -6
else
    echo "⚠️  Falta PROJECT_ID.md - considera agregarlo"
fi

echo ""
echo "🐳 Docker containers relacionados:"
docker ps --filter "name=gestor" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || echo "   No se puede acceder a Docker"

echo ""
echo "💡 Para más información: cat PROJECT_ID.md"
