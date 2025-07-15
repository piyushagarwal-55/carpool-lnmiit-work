#!/usr/bin/env python3
"""
Script to fix duplicate style names in BusBookingSystem.tsx
"""

import re
from collections import defaultdict

def fix_duplicate_styles(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Find all style names
    style_pattern = r'^(\s+)([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*\{'
    matches = re.findall(style_pattern, content, re.MULTILINE)
    
    # Count occurrences
    style_counts = defaultdict(int)
    for indent, style_name in matches:
        style_counts[style_name] += 1
    
    # Find duplicates
    duplicates = {name: count for name, count in style_counts.items() if count > 1}
    
    print(f"Found {len(duplicates)} duplicate style names:")
    for name, count in duplicates.items():
        print(f"  {name}: {count} occurrences")
    
    # Replace duplicates with numbered versions
    for style_name, count in duplicates.items():
        occurrence = 0
        def replace_match(match):
            nonlocal occurrence
            occurrence += 1
            indent = match.group(1)
            if occurrence == 1:
                # Keep first occurrence as is
                return match.group(0)
            else:
                # Add number suffix to subsequent occurrences
                return f"{indent}{style_name}{occurrence}: {{"
        
        pattern = rf'^(\s+){re.escape(style_name)}\s*:\s*\{{'
        content = re.sub(pattern, replace_match, content, flags=re.MULTILINE)
        occurrence = 0  # Reset for next style name
    
    # Write back to file
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"Fixed duplicates in {file_path}")

if __name__ == "__main__":
    fix_duplicate_styles("app/components/BusBookingSystem.tsx")
