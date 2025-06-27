# VIRUS SCANNING SETUP

## Option 1: ClamAV Integration (Recommended for production)

### Install ClamAV
```bash
# Ubuntu/Debian
sudo apt-get install clamav clamav-daemon

# macOS
brew install clamav

# Update virus definitions
sudo freshclam
```

### Create virus scanning service
```typescript
// lib/virus-scanner.ts
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function scanFileForViruses(filePath: string): Promise<boolean> {
  try {
    await execAsync(`clamscan "${filePath}"`);
    return true; // No virus found
  } catch (error) {
    console.error('Virus scan failed:', error);
    return false; // Virus found or scan failed
  }
}
```

## Option 2: Cloud-based scanning (Alternative)

### Use VirusTotal API or similar cloud services
- More scalable but requires API keys
- Consider privacy implications of uploading files

## Integration into upload flow

```typescript
// Add to file upload handler
import { scanFileForViruses } from '@/lib/virus-scanner';

const isClean = await scanFileForViruses(tempFilePath);
if (!isClean) {
  throw new Error('File failed virus scan');
}
```
