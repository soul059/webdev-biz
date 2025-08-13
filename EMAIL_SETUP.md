# Add these SMTP configuration variables to your .env.local file

# SMTP Configuration for Email Sending
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=your-email@gmail.com

# For development/testing, you can use Ethereal Email (creates temporary accounts)
# Visit https://ethereal.email/ to create test credentials
# SMTP_HOST=smtp.ethereal.email
# SMTP_PORT=587
# SMTP_SECURE=false
# SMTP_USER=ethereal.user@ethereal.email
# SMTP_PASS=ethereal.pass
# SMTP_FROM=ethereal.user@ethereal.email

# Alternative SMTP providers:
# Gmail: smtp.gmail.com (port 587, use app password)
# Outlook: smtp-mail.outlook.com (port 587)
# SendGrid: smtp.sendgrid.net (port 587)
# Mailgun: smtp.mailgun.org (port 587)
# Amazon SES: email-smtp.us-east-1.amazonaws.com (port 587)

# Note: For Gmail, you need to use an "App Password" instead of your regular password
# 1. Enable 2-factor authentication on your Google account
# 2. Go to Google Account settings > Security > App passwords
# 3. Generate a new app password for "Mail"
# 4. Use that app password as SMTP_PASS
