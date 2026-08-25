import re

with open('src/services/storage.ts', 'r') as f:
    content = f.read()

# Replace INITIAL_STUDENTS
content = re.sub(r'export const INITIAL_STUDENTS: Student\[\] = \[.*?\];', 'export const INITIAL_STUDENTS: Student[] = [];', content, flags=re.DOTALL)

# Replace INITIAL_MEDICAL_RECORDS
content = re.sub(r'export const INITIAL_MEDICAL_RECORDS: MedicalRecord\[\] = \[.*?\];', 'export const INITIAL_MEDICAL_RECORDS: MedicalRecord[] = [];', content, flags=re.DOTALL)

with open('src/services/storage.ts', 'w') as f:
    f.write(content)
