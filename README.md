# Clinical Management System

A high-performance, minimalist clinical encounter and patient management system designed for speed, privacy, and visual excellence. Built for **Dr. Nizamuddin Utmani**, this platform streamlines the daily workflow of a busy clinic from registration to prescription generation.

**Live Link:** [polite-pithivier-9bcdff.netlify.app](https://polite-pithivier-9bcdff.netlify.app)


<img width="2450" height="1530" alt="polite-pithivier-9bcdff netlify app_dashboard (1)" src="https://github.com/user-attachments/assets/609fce5c-e7fd-4532-9068-98f37904451c" />




## 🚀 Key Features

- **⚡ Fast Encounter Workflow**: Create detailed clinical records in seconds with auto-suggesting symptoms, diagnoses, and medicines.
- **🖨️ Unified Printing Engine**: Generate professional, print-ready encounter notes including vitals, complaints, history, physical examination, lab results, and prescriptions.
- **📊 Quick Overview Cards**: At-a-glance summary of diagnoses, medications, and lab results for every patient visit.
- **🛡️ Privacy-First Storage**: Uses local-first persistence (IndexedDB/LocalStorage) with optional Cloudflare R2 backup for maximum patient data privacy.
- **📱 Fully Responsive**: Optimized for high-speed use on Laptops, Tablets, and Mobile devices.
- **🧪 Lab Integration**: Track lab status (waiting vs. completed) and attach digital reports to patient encounters.

## 🛠️ Technology Stack

- **Frontend**: React.js with Vite
- **Styling**: Modern CSS with HSL-tailored color palettes and Glassmorphism aesthetics
- **Icons**: Lucide React
- **Storage**: Browser Local Storage (Local-First)
- **Hosting**: Optimized for Netlify / Vercel

## 📦 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/e-clinic.git
   cd e-clinic
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run the development server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:5173](http://localhost:5173) in your browser.

### Building for Production

To create a minified, production-ready bundle:

```bash
npm run build
```
The output will be in the `dist/` directory, ready to be deployed to Netlify, Vercel, or any static host.

## ☁️ Cloud Sync & Backup (Recommended)

This project is designed to work offline but supports Cloudflare R2 for secure backups and lab report storage.

1. Create a [Cloudflare R2 Bucket](https://www.cloudflare.com/products/r2/).
2. Update your `src/lib/r2.js` with your API credentials.
3. Use the **Sync** button in the dashboard to backup your local database to the cloud.

## 👥 Demo Access

You can test the system using the following demo accounts:

- **Doctor**: `doctor@clinic.com` (Pass: `demo123`)
- **Admin**: `admin@clinic.com` (Pass: `demo123`)
- **Reception**: `reception@clinic.com` (Pass: `demo123`)

## 📄 License

Internal Project for Utmani Clinic. All rights reserved.

---
