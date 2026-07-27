import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';

export async function GET(req, { params }) {
  try {
    const filename = params.filename;
    // Sanitize filename to prevent directory traversal
    const safeFilename = path.basename(filename);
    const filePath = path.join(os.tmpdir(), safeFilename);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    const fileBuffer = await fs.promises.readFile(filePath);
    let contentType = 'image/png';
    if (safeFilename.endsWith('.jpg') || safeFilename.endsWith('.jpeg')) {
      contentType = 'image/jpeg';
    } else if (safeFilename.endsWith('.svg')) {
      contentType = 'image/svg+xml';
    }

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (error) {
    console.error('Temp image serve error:', error);
    return NextResponse.json({ error: 'Failed to serve image' }, { status: 500 });
  }
}
