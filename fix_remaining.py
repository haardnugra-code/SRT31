import os

def replace_in_file(filepath, old, new):
    with open(filepath, 'r') as f:
        content = f.read()
    content = content.replace(old, new)
    with open(filepath, 'w') as f:
        f.write(content)

replace_in_file('src/components/GuideTab.tsx', 'Sekolah Rakyat Kemensos RI', 'Sekolah Rakyat Terintegrasi 31 Palembang')
replace_in_file('src/components/RecapTab.tsx', 'Sekolah atau Kemensos RI', 'Sekolah')
replace_in_file('src/components/PrayerAttendanceTab.tsx', 'Sekolah Rakyat Kemensos RI', 'Sekolah Rakyat Terintegrasi 31 Palembang')

