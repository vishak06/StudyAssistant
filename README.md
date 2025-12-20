# 📚 Study Assistant

An AI-powered study companion that transforms your learning materials into comprehensive notes and practice questions. Simply upload a PDF or provide a URL, and let our intelligent assistant generate structured study materials to enhance your learning experience.

## ✨ Features

- **📄 PDF Processing**: Upload PDF documents and automatically extract content for analysis
- **🔗 URL Processing**: Provide web article URLs to generate study materials from online content
- **🤖 AI-Powered Analysis**: Uses Lyzr AI agents to intelligently process and analyze content
- **📝 Smart Note Generation**: Automatically creates well-structured, comprehensive study notes
- **❓ Practice Questions**: Generates targeted practice questions to reinforce learning
- **🎨 Modern UI**: Clean, responsive interface with real-time progress indicators
- **📱 Fullscreen Mode**: Expand notes or questions to fullscreen for focused studying
- **⚡ Real-time Progress**: Live status updates during content processing

## 🛠️ Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Lucide React Icons
- **Markdown Rendering**: ReactMarkdown with remark-gfm
- **AI Processing**: Lyzr AI API with multi-agent workflow
- **File Storage**: Vercel Blob Storage
- **Deployment**: Vercel Platform

## 🚀 How It Works

### Processing Pipeline

1. **Input Router Agent**: Identifies and validates the input type (PDF or URL)
2. **Content Extractor Agent**: Extracts raw text content from the source
3. **Content Analyzer Agent**: Analyzes the content structure and identifies key concepts
4. **Smart Note Generator Agent**: Creates organized, comprehensive study notes
5. **Practice Question Generator Agent**: Generates relevant practice questions
6. **Error Displayer Agent**: Handles and displays any processing errors

### AI Agent IDs
- Input Router: `693a58b8bc73a1ed4a58e809`
- Content Extractor: `693a5901829cb256a64c4251`
- Content Analyzer: `693a593a829cb256a64c4255`
- Smart Note Generator (PDF): `69463835cf278553868d5d4b`
- Practice Question Generator (PDF): `6946390581c8a74f1ca94db6`
- Practice Question Generator (URL): `693a59a4bc73a1ed4a58e818`
- Error Displayer: `693a59eebc73a1ed4a58e823`

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd study-assistant
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   LYZR_API_KEY=your_lyzr_api_key_here
   BLOB_READ_WRITE_TOKEN=your_vercel_blob_token_here
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🎯 Usage

### Uploading a PDF

1. Click on the **"Upload PDF"** card on the home page
2. Select a PDF file from your device (text-based PDFs work best)
3. Click **"Submit"** to start processing
4. Wait for the AI to analyze your content (typically 1-2 minutes)
5. View your generated notes and practice questions on the results page

### Processing a URL

1. Click on the **"Provide URL"** card on the home page
2. Enter the URL of the article or webpage you want to study
3. Click **"Submit"** to begin processing
4. The AI will extract and analyze the web content
5. Review your personalized study materials on the results page

### Viewing Results

- **Split View**: See notes and questions side-by-side
- **Fullscreen Mode**: Click the expand icon to focus on one section
- **Markdown Formatting**: Content is beautifully formatted with headings, lists, and emphasis
- **Back to Home**: Return to upload new materials anytime

## 🗂️ Project Structure

```
study-assistant/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── process-pdf/      # PDF processing endpoint
│   │   │   │   └── route.ts
│   │   │   └── process-url/      # URL processing endpoint
│   │   │       └── route.ts
│   │   ├── error/                # Error handling page
│   │   │   └── page.tsx
│   │   ├── results/              # Results display page
│   │   │   └── page.tsx
│   │   ├── globals.css           # Global styles
│   │   ├── layout.tsx            # Root layout
│   │   └── page.tsx              # Home page
│   └── components/
│       └── Navbar.tsx            # Navigation component
├── public/                       # Static assets
├── .env.local                    # Environment variables
├── next.config.ts                # Next.js configuration
├── tailwind.config.ts            # Tailwind CSS configuration
├── tsconfig.json                 # TypeScript configuration
└── package.json                  # Project dependencies
```

## 🔧 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `LYZR_API_KEY` | Your Lyzr AI API key for agent processing | Yes |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob storage token for file uploads | Yes |

## 📡 API Endpoints

### POST `/api/process-pdf`
Processes uploaded PDF files through the AI pipeline.

**Request**: `multipart/form-data` with `file` field
**Response**: 
```json
{
  "success": true,
  "notes": "Generated study notes...",
  "questions": "Generated practice questions..."
}
```

### POST `/api/process-url`
Processes web content from provided URLs.

**Request**: 
```json
{
  "url": "https://example.com/article"
}
```
**Response**: 
```json
{
  "success": true,
  "notes": "Generated study notes...",
  "questions": "Generated practice questions..."
}
```

## 🎨 Key Features Explained

### Mutual Exclusivity
The app ensures only one input type is active at a time - uploading a PDF disables URL input and vice versa.

### Progress Indicators
Real-time status messages keep users informed during the processing stages:
- Uploading and extracting content...
- Analyzing content structure...
- Generating smart notes...
- Preparing practice questions...

### Error Handling
Comprehensive error handling with user-friendly messages and actionable suggestions for resolving issues.

### Responsive Design
Fully responsive interface that works seamlessly on desktop, tablet, and mobile devices.

## 🚀 Deployment

### Deploy to Vercel

1. **Push your code to GitHub**

2. **Import to Vercel**
   - Go to [Vercel](https://vercel.com/new)
   - Import your repository
   - Configure environment variables
   - Deploy!

3. **Set Environment Variables**
   - Add `LYZR_API_KEY` in Vercel dashboard
   - Add `BLOB_READ_WRITE_TOKEN` in Vercel dashboard

### Build Command
```bash
npm run build
```

### Start Command
```bash
npm run start
```

## 📝 Best Practices

### For PDF Upload
- Use text-based PDFs (not scanned images)
- Ensure the PDF contains selectable text
- Keep file sizes reasonable (<10MB recommended)
- Use PDFs with clear structure and formatting

### For URL Processing
- Provide public, accessible URLs
- Ensure the webpage contains substantive text content
- Works best with articles, blog posts, and educational content
- May not work with paywalled or authentication-required content

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- AI powered by [Lyzr](https://www.lyzr.ai/)
- Icons from [Lucide](https://lucide.dev/)
- Hosted on [Vercel](https://vercel.com/)

## 📞 Support

For issues, questions, or suggestions, please open an issue in the repository.

---

**Made with ❤️ for better learning**
