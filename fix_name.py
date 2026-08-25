import os
import re

files_to_check = []
for root, _, files in os.walk('src'):
    for file in files:
        if file.endswith('.ts') or file.endswith('.tsx'):
            files_to_check.append(os.path.join(root, file))

for filepath in files_to_check:
    with open(filepath, 'r') as f:
        content = f.read()
    
    original = content
    
    # 1. Sidebar.tsx
    if 'Sidebar.tsx' in filepath:
        content = content.replace('Kemensos RI', 'Terintegrasi 31 Palembang')
    
    # 2. LoginModal.tsx
    if 'LoginModal.tsx' in filepath:
        content = content.replace('<p className="text-[9px] text-slate-400 font-bold tracking-widest">KEMENSOS RI © 2026</p>', '')
        content = content.replace('Sekolah Rakyat</h1>', 'Sekolah Rakyat</h1>\n        <p className="text-[10px] font-bold text-white/80 text-center uppercase tracking-widest mb-1">\n          Terintegrasi 31 Palembang\n        </p>')
    
    # 3. LandingPage.tsx
    if 'LandingPage.tsx' in filepath:
        content = content.replace('KEMENSOS RI', 'TERINTEGRASI 31 PALEMBANG')
        content = content.replace('Kemensos RI', 'Terintegrasi 31 Palembang')
        content = content.replace('Sekolah Rakyat Terintegrasi 31 Palembang (Terintegrasi 31 Palembang)', 'Sekolah Rakyat Terintegrasi 31 Palembang')
        
    # 4. PrayerAttendanceTab.tsx
    if 'PrayerAttendanceTab.tsx' in filepath:
        content = content.replace('SEKOLAH RAKYAT KEMENSOS RI', 'SEKOLAH RAKYAT TERINTEGRASI 31 PALEMBANG')
        
    # 5. storage.ts
    if 'storage.ts' in filepath:
        content = content.replace('(Kemensos RI)', '')
        content = content.replace('Kemensos RI', 'Sekolah Rakyat Terintegrasi 31 Palembang')
        
    if content != original:
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"Updated {filepath}")

