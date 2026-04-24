from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib.units import inch

def create_pdf(filename):
    c = canvas.Canvas(filename, pagesize=letter)
    
    # Title
    c.setFont("Helvetica-Bold", 16)
    c.drawString(1 * inch, 10 * inch, "FDA GUIDANCE DOCUMENT")
    
    c.setFont("Helvetica", 14)
    c.drawString(1 * inch, 9.5 * inch, "Cardiac Safety Monitoring in Phase III Clinical Trials")
    
    c.setFont("Helvetica", 12)
    c.drawString(1 * inch, 9 * inch, "Document Number: FDA-2026-D-0412")
    c.drawString(1 * inch, 8.7 * inch, "Issue Date: March 15, 2026")
    
    # Section
    c.setFont("Helvetica-Bold", 14)
    c.drawString(1 * inch, 7.7 * inch, "SECTION 4.2 — HRV SDNN THRESHOLD REVISION")
    
    # Content
    c.setFont("Helvetica", 12)
    text_y = 7.0 * inch
    lines = [
        "Following post-market surveillance data from 12 Phase III cardiac trials (n=4,847),",
        "the FDA has revised the Heart Rate Variability Standard Deviation of Normal-to-Normal",
        "(HRV SDNN) alert threshold for Phase III cardiac trials.",
        "",
        "Effective immediately:",
        "- Previous threshold: HRV SDNN < 25ms -> FLAG AS AT RISK",
        "- Revised threshold: HRV SDNN < 28ms -> FLAG AS AT RISK",
        "",
        "Rationale: Analysis revealed that patients with HRV SDNN between 25-28ms showed",
        "a 34% elevated risk of adverse cardiac events within 90 days. The revised threshold",
        "ensures earlier detection and intervention.",
        "",
        "Trial phases affected: Phase II, Phase III",
        "Biomarker: HRV_SDNN",
        "Operator: LESS_THAN",
        "New threshold value: 28",
        "Unit: ms",
        "Duration window: 30 days",
        "Effective date: 2026-03-15"
    ]
    
    for line in lines:
        c.drawString(1 * inch, text_y, line)
        text_y -= 0.25 * inch
        
    c.save()

if __name__ == "__main__":
    create_pdf("sample_fda_guideline.pdf")
