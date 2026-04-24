import os
import sendgrid
from sendgrid.helpers.mail import Mail, Email, To, Content
import logging

logger = logging.getLogger(__name__)

async def generate_and_send_pv_report(evaluations, trial_id, new_rule_id):
    """
    Agent 4 logic:
    1. Render Jinja2 HTML report
    2. Convert to PDF via WeasyPrint
    3. Send email to PIs via SendGrid
    """
    
    # Placeholder for PDF generation
    pdf_path = f"/tmp/PV_Report_{new_rule_id}.pdf"
    
    # 3. Send Email via SendGrid
    sendgrid_api_key = os.environ.get('SENDGRID_API_KEY')
    from_email_address = os.environ.get('SENDGRID_FROM_EMAIL', 'noreply@reguvigil.com')
    
    if not sendgrid_api_key:
        logger.warning("SENDGRID_API_KEY not found. Skipping email dispatch.")
        return pdf_path
        
    try:
        sg = sendgrid.SendGridAPIClient(api_key=sendgrid_api_key)
        
        # In a real app, fetch PI emails from DB based on flagged patients' sites
        # Using demo emails requested by user
        demo_emails = ["priya.regulatory@demo.com", "dr.ramesh@demo.com"]
        
        for email in demo_emails:
            from_email = Email(from_email_address)
            to_email = To(email)
            subject = f"URGENT: PV Safety Report - Trial {trial_id} - New Rule Violations"
            content = Content(
                "text/html", 
                f"""
                <html>
                <body>
                    <h2>Pharmacovigilance Alert</h2>
                    <p>A new regulatory rule (v1.3) has been automatically applied to Trial {trial_id}.</p>
                    <p><strong>{len(evaluations)} patients</strong> have been newly flagged as AT RISK.</p>
                    <p>Please log in to the ReguVigil dashboard to download the full PDF safety report.</p>
                    <br>
                    <a href="http://localhost:3000/dashboard/report/1092">View PV Report</a>
                </body>
                </html>
                """
            )
            
            mail = Mail(from_email, to_email, subject, content)
            
            # Attach PDF if WeasyPrint generated it
            # (Skipping attachment logic for demo simplicity)
            
            response = sg.client.mail.send.post(request_body=mail.get())
            logger.info(f"Email sent to {email}. Status Code: {response.status_code}")
            
    except Exception as e:
        logger.error(f"Failed to send email via SendGrid: {str(e)}")
        
    return pdf_path
