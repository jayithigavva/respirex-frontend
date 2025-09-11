# Respiratory Disease AI Frontend

A modern Next.js frontend application for uploading audio files and visualizing respiratory disease classification results.

## Features

- **Modern UI**: Clean, responsive design with Tailwind CSS
- **Audio Upload**: Drag & drop or click to upload audio files
- **Real-time Analysis**: Upload audio and get instant disease predictions
- **Interactive Visualization**: Audio player with highlighted anomaly segments
- **Responsive Design**: Works on desktop and mobile devices
- **Error Handling**: Comprehensive error handling and user feedback

## Tech Stack

- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **Framer Motion**: Smooth animations and transitions
- **Axios**: HTTP client for API calls
- **React Dropzone**: File upload handling

## Setup and Installation

### Prerequisites
- Node.js 18+
- npm or yarn

### Local Development

1. **Clone the repository**
   ```bash
   git clone <your-frontend-repo-url>
   cd respiratory-disease-frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Configure API URL**
   - Update the API URL in `app/page.tsx`:
   ```typescript
   const API_BASE_URL = 'http://localhost:10000' // For local development
   // or
   const API_BASE_URL = 'https://your-backend.onrender.com' // For production
   ```

4. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. **Open your browser**
   - Visit http://localhost:3000

## Deployment on Vercel

### Step 1: Prepare Repository

1. **Create a new GitHub repository** for your frontend
2. **Push your code** to the repository
3. **Ensure all files are committed**

### Step 2: Deploy on Vercel

1. **Go to [Vercel](https://vercel.com)** and sign up/login
2. **Click "New Project"**
3. **Import your GitHub repository**
4. **Configure the project**:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (or leave default)
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)

5. **Set Environment Variables** (if needed):
   - `NEXT_PUBLIC_API_URL`: Your backend API URL

6. **Deploy**
   - Click **"Deploy"**
   - Wait for deployment to complete (2-3 minutes)
   - Get your live URL (e.g., `https://your-project.vercel.app`)

### Step 3: Update API URL

After deploying your backend on Render:

1. **Get your backend URL** from Render dashboard
2. **Update environment variable** in Vercel:
   - Go to your project settings
   - Add environment variable: `NEXT_PUBLIC_API_URL`
   - Value: `https://your-backend.onrender.com`
3. **Redeploy** your frontend

## Configuration

### Environment Variables

Create a `.env.local` file for local development:

```env
NEXT_PUBLIC_API_URL=http://localhost:10000
```

### API Configuration

The frontend expects your backend API to be available at the configured URL. Update the API URL in:

```typescript
// app/page.tsx
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://my-backend.onrender.com'
```

## Features Overview

### Audio Upload
- **Drag & Drop**: Drag audio files directly onto the upload area
- **File Selection**: Click to open file browser
- **Supported Formats**: WAV, MP3, M4A, FLAC
- **File Validation**: Automatic file type and size validation

### Analysis Results
- **Disease Prediction**: Clear display of predicted disease and confidence
- **Probability Breakdown**: Visual breakdown of all disease probabilities
- **Anomaly Detection**: Highlighted segments for wheezes and crackles
- **Interactive Player**: Audio player with anomaly markers

### User Experience
- **Loading States**: Clear feedback during analysis
- **Error Handling**: Comprehensive error messages
- **Responsive Design**: Optimized for all screen sizes
- **Smooth Animations**: Framer Motion animations for better UX

## Customization

### Styling
- Modify `tailwind.config.js` for custom colors and themes
- Update `app/globals.css` for global styles
- Customize components in `app/page.tsx`

### Disease Colors
Update the disease color mapping in `getDiseaseColor()`:

```typescript
const colors: Record<string, string> = {
  'Healthy': 'text-green-600 bg-green-100',
  'COPD': 'text-red-600 bg-red-100',
  // Add your diseases here
}
```

### API Integration
Modify the API call in the `handleUpload()` function to match your backend's response format.

## Troubleshooting

### Common Issues

1. **API Connection Failed**
   - Check if backend is running and accessible
   - Verify API URL is correct
   - Check CORS settings on backend

2. **File Upload Issues**
   - Ensure file format is supported
   - Check file size limits
   - Verify backend is processing files correctly

3. **Build Errors**
   - Run `npm run build` locally to check for errors
   - Ensure all dependencies are installed
   - Check TypeScript errors

### Performance Optimization

- **Image Optimization**: Next.js automatically optimizes images
- **Code Splitting**: Automatic code splitting for better performance
- **Static Generation**: Pages are statically generated when possible

## Development

### Project Structure
```
frontend/
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── public/
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── README.md
```

### Available Scripts

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run start`: Start production server
- `npm run lint`: Run ESLint

## Support

For issues and questions:
1. Check the troubleshooting section above
2. Review Vercel deployment logs
3. Test locally first before deploying
4. Check browser console for errors