#!/usr/bin/env bash
echo "========================================================"
echo "  SISTEM KEASRAMAAN SEKOLAH RAKYAT - KEMENSOS RI"
echo "  Menjalankan Aplikasi dalam Mode Desktop Standalone..."
echo "========================================================"
echo ""

if [ ! -d "node_modules" ]; then
    echo "Menginstal dependensi..."
    npm install
fi

echo "Membuka jendela aplikasi desktop..."
npm run desktop
