from pathlib import Path
import fitz

src = Path(r"C:\Users\omola\NSML\nsml-workdesk\references\screenshots\figma-capture")
out = src / "png"
out.mkdir(exist_ok=True)

for pdf_path in src.glob("*.pdf"):
    doc = fitz.open(pdf_path)
    for i, page in enumerate(doc, start=1):
        pix = page.get_pixmap(matrix=fitz.Matrix(2, 2), alpha=False)
        pix.save(out / f"{pdf_path.stem}-{i}.png")
    doc.close()

print(f"Done. PNGs saved to: {out}")