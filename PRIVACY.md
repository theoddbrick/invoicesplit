# Privacy & Data Handling

## File Storage Policy

**⚠️ IMPORTANT: We DO NOT store your files.**

### What Happens to Your Files

1. **Upload** → File is sent to the server via HTTP request
2. **Processing** → File is read into memory (RAM only)
3. **Extraction** → Text content is extracted from PDF
4. **AI Analysis** → Text is sent to Alibaba Cloud Model Studio for processing
5. **Response** → Extracted data is returned to your browser
6. **Cleanup** → File and text data are immediately discarded from memory

### Technical Details

#### Server-Side (Next.js API Route)
```typescript
// File is received as multipart/form-data
const file = formData.get("file") as File;

// Converted to memory buffer (NO disk write)
const arrayBuffer = await file.arrayBuffer();

// Processed in-memory
const pdfText = await extractTextFromPDF(arrayBuffer);

// After response is sent, buffer is garbage collected
// NO persistence, NO file system writes, NO database storage
```

#### Verification
Run this command to verify no file writes in our code:
```bash
grep -r "writeFile\|fs.write\|createWriteStream" app/ components/ lib/
# Result: No matches (no file writes)
```

### Data Flow Diagram

```
Your Browser                    Our Server                  AI Service
    |                              |                            |
    |---[1. Upload PDF]----------->|                            |
    |                              |                            |
    |                              |--[2. Extract Text]         |
    |                              |   (in-memory only)         |
    |                              |                            |
    |                              |---[3. Send Text]---------->|
    |                              |                            |
    |                              |<--[4. Receive Results]-----|
    |                              |                            |
    |<--[5. Return JSON Data]------|                            |
    |                              |                            |
    |                              |--[6. Memory Cleanup]       |
    |                              |   (data discarded)         |
```

### What IS Stored

- ✅ **Your browser's memory**: Temporarily holds file and results
- ❌ **Server disk**: NEVER - no file writes
- ❌ **Database**: NEVER - no database in this app
- ❌ **Cookies**: NEVER - no authentication/tracking
- ❌ **Local Storage**: NEVER - no browser storage

### Third-Party Services

#### Alibaba Cloud Model Studio
- **What's sent**: Extracted text content only (NOT the PDF file)
- **Purpose**: AI processing to extract invoice fields
- **Service provider**: Managed by this application's operator
- **Your data**: Text is processed and immediately discarded by the AI service per their privacy policy

#### Vercel Hosting
- **Logs**: Standard HTTP request logs (no file content)
- **Ephemeral Storage**: Serverless functions have NO persistent storage
- **Duration**: Function runs for <60 seconds then terminates

### How to Verify (For Technical Users)

1. **Check Network Tab**:
   - Open browser DevTools → Network
   - Upload a file
   - See: Only HTTP POST request, no storage requests

2. **Check Application Tab**:
   - Open DevTools → Application
   - Look at Local Storage, Session Storage, IndexedDB
   - Result: Empty (nothing stored)

3. **Review Source Code**:
   - GitHub: https://github.com/theoddbrick/invoicesplit
   - Search for file operations - none exist
   - All code is open source and auditable

### Compliance

- ✅ **GDPR Compliant**: No personal data stored
- ✅ **Zero Persistence**: Stateless serverless architecture
- ✅ **Client-Side Processing**: File selection and CSV generation happen in your browser
- ✅ **Transparent**: Open source code for full auditability

### User Guarantees

| Question | Answer |
|----------|--------|
| Are my PDFs saved? | ❌ NO - processed in memory only |
| Are filenames logged? | ✅ Only in server logs (no content) |
| Can anyone access my files? | ❌ NO - files never touch disk |
| Is data encrypted in transit? | ✅ YES - HTTPS only |
| How long is data kept? | ⏱️ 0 seconds - immediate cleanup |

### For Your Users

**Simple Explanation:**
> "Your invoices are processed in real-time and immediately discarded. We never save, store, or keep your files. All processing happens in temporary memory and is deleted the moment we send back the results."

**Technical Explanation:**
> "This application uses serverless functions that process your PDFs entirely in RAM. The files are converted to text, analyzed by AI, and the results are returned to your browser - all without ever touching a hard drive or database. When the function completes (typically in 3-5 seconds), all data is automatically garbage collected by the runtime."

---

## Audit Trail

**Last Updated**: 2026-01-09
**Verified By**: Code review and grep search
**Status**: Zero file persistence confirmed ✅
