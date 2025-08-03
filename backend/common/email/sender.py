import smtplib
from email.mime.text import MIMEText


def send_confirmation_email(to_email, subject, body_html):
    print(f"[DEBUG] Sending email to {to_email}")
    msg = MIMEText(body_html, "html")
    msg["Subject"] = subject
    msg["From"] = "your@email.com"
    msg["To"] = to_email

    with smtplib.SMTP("smtp.gmail.com", 587) as server:
        server.starttls()
        server.login("your@email.com", "your-password")
        server.send_message(msg)
