# -*- coding: utf-8 -*-
from pathlib import Path

ROOT = Path(__file__).parent
p = ROOT / "shop.html"
lines = p.read_text(encoding="utf-8").splitlines(keepends=True)
start_i = next(i for i, L in enumerate(lines) if 'row row-cols-2 row-cols-md-3 g-3' in L)
end_i = next(i for i, L in enumerate(lines) if 'aria-label="صفحه\u200cبندی محصولات"' in L)

grid = (ROOT / "_shop_grid_snippet.html").read_text(encoding="utf-8")
new_lines = lines[:start_i] + [grid] + lines[end_i:]
p.write_text("".join(new_lines), encoding="utf-8")
print("patched", start_i, end_i)
