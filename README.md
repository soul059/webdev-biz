# Freelance Receipt Generator

A professional receipt generator for freelance web developers with QR codes, admin panel, and secure data encryption.

## Features

- 🧾 **Digital Receipt Generation** - Create professional receipts with all project details
- 🔒 **Data Encryption** - All sensitive data is encrypted for security
- 📱 **QR Code Integration** - Each receipt has a QR code for easy access
- 📊 **Admin Dashboard** - Complete analytics and receipt management
- 💳 **Payment Tracking** - Track payment status (paid, pending, partial)
- 📄 **PDF Export** - Generate PDF receipts for download
- ☁️ **Cloud Storage** - Images stored securely on Cloudinary
- 📈 **Analytics** - View revenue analytics and payment statistics

## Technology Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, MongoDB with Mongoose
- **Authentication**: JWT-based admin authentication
- **Encryption**: CryptoJS for sensitive data encryption
- **QR Codes**: QRCode library for generating QR codes
- **Cloud Storage**: Cloudinary for image storage
- **PDF Generation**: jsPDF and html2canvas
- **Database**: MongoDB for storing receipts and admin data

## Installation

1. **Clone the repository**
   ```bash
   cd webdev-biz
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Copy `.env.local` and update with your actual values:
   ```env
   NEXTAUTH_SECRET=your-nextauth-secret-key-here
   NEXTAUTH_URL=http://localhost:3000
   
   MONGODB_URI=mongodb://localhost:27017/freelance-receipts
   
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret
   
   ADMIN_EMAIL=your-admin-email@example.com
   ADMIN_PASSWORD=your-secure-admin-password
   
   ENCRYPTION_KEY=your-32-character-encryption-key-here
   JWT_SECRET=your-jwt-secret-key-here
   ```

4. **Set up MongoDB**
   - Install MongoDB locally or use MongoDB Atlas
   - Update `MONGODB_URI` in your environment variables

5. **Set up Cloudinary**
   - Create a Cloudinary account
   - Get your cloud name, API key, and API secret
   - Update the Cloudinary variables in your environment

6. **Create admin user**
   ```bash
   node scripts/setup-admin.js
   ```

7. **Run the development server**
   ```bash
   npm run dev
   ```

8. **Open your browser**
   Navigate to `http://localhost:3000`

## Usage

### For Freelancers (Admin)

1. **Login to Admin Panel**
   - Go to `/admin/login`
   - Use your admin credentials

2. **Create Receipts**
   - Fill in client information
   - Add project details (title, description, technologies, deliverables)
   - Set payment information
   - Generate receipt with QR code

3. **View Analytics**
   - Track total revenue and receipts
   - Monitor payment statuses
   - View monthly revenue charts

### For Clients

1. **View Receipts**
   - Scan QR code or visit receipt URL
   - View all project and payment details
   - Print or save receipt

## API Endpoints

- `POST /api/auth/login` - Admin authentication
- `POST /api/receipts` - Create new receipt
- `GET /api/receipts` - Get all receipts (admin only)
- `GET /api/receipts/[id]` - Get specific receipt
- `GET /api/analytics` - Get analytics data (admin only)

## Security Features

- All sensitive data (client info, payment info) is encrypted
- Admin authentication with JWT tokens
- Receipt access via secure QR codes
- Environment-based configuration

## Project Structure

```
src/
├── app/                    # Next.js 13+ app directory
│   ├── admin/
│   │   ├── login/         # Admin login page
│   │   └── dashboard/     # Admin dashboard
│   ├── api/               # API routes
│   │   ├── auth/
│   │   ├── receipts/
│   │   └── analytics/
│   ├── receipt/           # Receipt viewing pages
│   └── globals.css        # Global styles
├── components/            # React components
│   └── ReceiptForm.tsx    # Receipt creation form
├── lib/                   # Utility libraries
│   ├── mongodb.ts         # Database connection
│   └── encryption.ts      # Data encryption utilities
└── models/                # MongoDB models
    ├── Receipt.ts         # Receipt model
    └── Admin.ts           # Admin user model
```

## Customization

### Styling
- Modify `tailwind.config.js` for custom colors and themes
- Update `src/app/globals.css` for global styles

### Receipt Template
- Customize receipt layout in `src/app/receipt/[id]/page.tsx`
- Modify PDF generation in receipt components

### Analytics
- Add new metrics in `src/app/api/analytics/route.ts`
- Create new charts in the dashboard

## Deployment

### Vercel (Recommended)
1. Push code to GitHub
2. Connect to Vercel
3. Add environment variables
4. Deploy

### Other Platforms
- Ensure Node.js 18+ support
- Set environment variables
- Configure MongoDB connection
- Set up Cloudinary

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is for personal/educational use. Please ensure you have appropriate licenses for commercial use.

## Support

For issues or questions:
1. Check the documentation
2. Review environment variable setup
3. Verify database connection
4. Check Cloudinary configuration

## Future Enhancements

- [ ] Multi-currency support
- [ ] Email notifications
- [ ] Receipt templates
- [ ] Client portal
- [ ] Invoice generation
- [ ] Tax calculations
- [ ] Export to accounting software
