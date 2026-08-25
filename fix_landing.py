with open('src/components/LandingPage.tsx', 'r') as f:
    lines = f.readlines()

new_lines = []
skip = False
for i, line in enumerate(lines):
    if "Lihat Struktur Lengkap" in line:
        skip = True
        # remove the button opening and closing tag
        # The button is exactly around line 262-264
        pass
    else:
        new_lines.append(line)

with open('test.txt', 'w') as f:
    f.writelines(new_lines)
