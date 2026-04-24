import os
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from datetime import datetime

def create_demo_pdf():
    # Ensure directory exists or output to root
    output_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "FDA_Cardiac_Guidance_2026.pdf")
    
    doc = SimpleDocTemplate(output_path, pagesize=letter,
                            rightMargin=72, leftMargin=72,
                            topMargin=72, bottomMargin=18)
    
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(name='Justify', alignment=4))
    
    Story = []
    
    # Title
    Story.append(Paragraph("U.S. Food and Drug Administration", styles["Heading1"]))
    Story.append(Paragraph("Center for Drug Evaluation and Research (CDER)", styles["Heading2"]))
    Story.append(Spacer(1, 12))
    
    Story.append(Paragraph(f"Date: {datetime.now().strftime('%B %d, %Y')}", styles["Normal"]))
    Story.append(Spacer(1, 12))
    
    Story.append(Paragraph("Subject: Postmarket Safety Monitoring Update for Phase III Cardiac and Metabolic Trials", styles["Heading3"]))
    Story.append(Spacer(1, 12))
    
    # Content body
    text1 = """
    This guidance represents the current thinking of the Food and Drug Administration (FDA) on this topic. It does not establish any rights for any person and is not binding on FDA or the public.
    """
    Story.append(Paragraph(text1, styles["Italic"]))
    Story.append(Spacer(1, 12))
    
    text2 = """
    In light of recent post-market surveillance data across Phase III cardiac and metabolic trials, the agency has re-evaluated the safety thresholds for continuous autonomic nervous system monitoring. Analysis of multi-center trial data suggests that the previously established baseline thresholds were triggering a high rate of false-positive alerts without corresponding clinical deterioration.
    """
    Story.append(Paragraph(text2, styles["Justify"]))
    Story.append(Spacer(1, 12))
    
    text3 = """
    Therefore, the agency advises adjusting the monitoring threshold for Heart Rate Variability (SDNN). The critical threshold should be revised from 25ms to 28ms effective immediately to reduce false-positive alerts while maintaining patient safety margins.
    """
    Story.append(Paragraph(text3, styles["Justify"]))
    Story.append(Spacer(1, 12))
    
    text4 = """
    Sponsors and Principal Investigators are expected to update their automated pharmacovigilance pipelines to reflect this revision within 30 days of this publication. Patients currently enrolled in active trials whose recent continuous monitoring data falls within the newly restricted margin (between 25ms and 28ms) must be retrospectively re-evaluated and flagged for secondary cardiac review.
    """
    Story.append(Paragraph(text4, styles["Justify"]))
    
    doc.build(Story)
    print(f"Successfully generated Demo PDF at: {output_path}")

if __name__ == "__main__":
    create_demo_pdf()
