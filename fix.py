import pathlib
p = pathlib.Path('portfolio/views.py')
lines = p.read_text().splitlines()
new = []
for l in lines:
    s = l.strip()
    if s.startswith('gainers') or s.startswith('losers'):
        continue
    new.append(l)
    if s.startswith('rows = calc.build_holdings'):
        new.append('        gainers = sorted((r for r in rows if r["profit_loss"] > 0), key=lambda r: r["profit_loss"], reverse=True)[:3]')
        new.append('        losers = sorted((r for r in rows if r["profit_loss"] < 0), key=lambda r: r["profit_loss"])[:3]')
p.write_text("\n".join(new)+"\n")
print("FIXED")