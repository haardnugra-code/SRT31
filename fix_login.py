with open('src/components/LoginModal.tsx', 'r') as f:
    content = f.read()

# Fix the quotes at the end of lines which were added by the sed maybe?
content = content.replace("';'", "';")
content = content.replace("react';", "react';\n") # wait, head showed: import React, { useState } from 'react';'
# Let's just remove any trailing single quote at the end of every line.
lines = content.split('\n')
new_lines = []
for line in lines:
    if line.endswith("'"):
        line = line[:-1]
    new_lines.append(line)

content = '\n'.join(new_lines)
with open('src/components/LoginModal.tsx', 'w') as f:
    f.write(content)
