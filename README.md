# CTR Nirmal Kumar — Official Citizen Portal & Petition Management System

Official portal of **CTR. Nirmal Kumar**, Minister for Energy Resources & Law, Government of Tamil Nadu, and MLA for Thiruparankundram Constituency.

## Features
- **Official Ministerial Website**: Profile, roles, news stories, event updates, and gallery.
- **Bilingual Interface**: Full Tamil (தமிழ்) and English support.
- **Citizen Portal (குடிமக்கள் சேவை மையம்)**:
  - **Submit Petition (மனு சமர்ப்பிக்க)**: Citizens submit grievances directly to the constituency office.
  - **Track Petition (மனுவின் நிலை அறிய)**: Live tracking of petition status and official timeline actions.
  - **Registered Petitions Dashboard**: View past submissions associated with verified citizen credentials.
- **Security & OTP Verification**:
  - Free Gmail SMTP STARTTLS email delivery via `ironkyle007@gmail.com`.
  - Cryptographically secure 6-digit OTPs hashed with HMAC-SHA256 (no plaintext OTPs stored).
  - 5-minute expiry, 60-second cooldown, brute-force protection (max 5 attempts), and single-use tokens.
- **MySQL Database**: Persistent storage for petitions, citizen records, and audit timelines.

## Tech Stack
- **Frontend**: React 18, Vite 5, Vanilla CSS, Lucide React icons
- **Backend**: Node.js, Express 5, Nodemailer (Gmail SMTP STARTTLS on port 587)
- **Database**: MySQL 8.0 (`mysql2/promise`)

## Running Locally

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment Variables**:
   Copy `.env.example` to `.env` and configure:
   - MySQL credentials (`DB_USER`, `DB_PASSWORD`, `DB_NAME`)
   - Gmail SMTP credentials (`SMTP_USER`, `SMTP_APP_PASSWORD`)

3. **Start Development Environment**:
   ```bash
   npm run dev
   ```
   - Frontend: `https://localhost:5173/`
   - Backend API & SPA: `http://127.0.0.1:5000/`

4. **Production Build**:
   ```bash
   npm run build
   ```
