# Quick Start Guide

## Prerequisites
- Node.js 18 or later
- MongoDB (local or Atlas)
- Cloudinary account

## 1. Environment Setup

Update `.env.local` with your actual values:

```env
# Authentication
NEXTAUTH_SECRET=generate-a-random-32-character-string
NEXTAUTH_URL=http://localhost:3000

# MongoDB
MONGODB_URI=mongodb://localhost:27017/freelance-receipts
# OR for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/freelance-receipts

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret

# Admin Account
ADMIN_EMAIL=your-email@example.com
ADMIN_PASSWORD=your-secure-password

# Security
ENCRYPTION_KEY=generate-a-32-character-encryption-key
JWT_SECRET=generate-another-random-string
```

## 2. Database Setup

### Local MongoDB
```bash
# Install MongoDB locally
# On Windows: Download from https://www.mongodb.com/try/download/community
# On Mac: brew install mongodb-community
# On Linux: Follow MongoDB installation guide

# Start MongoDB service
mongod
```

### MongoDB Atlas (Cloud)
1. Create account at https://cloud.mongodb.com
2. Create a new cluster
3. Get connection string
4. Add to MONGODB_URI in .env.local

## 3. Cloudinary Setup
1. Create account at https://cloudinary.com
2. Go to Dashboard
3. Copy Cloud Name, API Key, and API Secret
4. Add to .env.local

## 4. Installation & Setup
```bash
# Install dependencies
npm install

# Create admin user
npm run setup-admin

# Start development server
npm run dev
```

## 5. Access the Application
- **Home**: http://localhost:3000
- **Admin Login**: http://localhost:3000/admin/login
- **Admin Dashboard**: http://localhost:3000/admin/dashboard

## Default Admin Credentials
Use the email and password you set in `.env.local`:
- Email: your-email@example.com
- Password: your-secure-password

## Key Features to Test
1. Login to admin panel
2. Create a receipt with all details
3. View the generated QR code
4. Test the receipt URL
5. Check analytics dashboard

## Production Deployment

### Vercel (Recommended)
1. Push code to GitHub
2. Import project to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Environment Variables for Production
Update these for production:
- NEXTAUTH_URL=https://your-domain.vercel.app
- Use strong, unique secrets
- Use MongoDB Atlas for database
- Ensure all API keys are secure

## Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running
- Check connection string format
- Verify network access (for Atlas)

### Cloudinary Issues
- Verify API credentials
- Check account limits
- Ensure proper folder permissions

### Build Errors
- Run `npm run lint` to check for issues
- Verify all environment variables are set
- Check TypeScript errors

## Security Notes
- Never commit .env files
- Use strong passwords and secrets
- Regularly update dependencies
- Enable HTTPS in production
