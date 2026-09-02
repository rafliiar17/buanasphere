---
trigger: always_on
---

# Tool Calling & Parameter Rules

- **Absolute Paths**: All file operations (`write_to_file`, `replace_file_content`, `view_file`, etc.) must use full absolute paths starting with `/home/archy/...`. Never use `~` or relative paths.
- **Required Schema Fields**: Ensure all required schema arguments (`TargetFile`, `Overwrite`, `CodeContent`, `Description`, `toolAction`, `toolSummary`) are strictly provided.
