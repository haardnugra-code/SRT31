with open('src/components/LoginModal.tsx', 'r') as f:
    content = f.read()

content = content.replace("\\'", "'")

with open('src/components/LoginModal.tsx', 'w') as f:
    f.write(content)
