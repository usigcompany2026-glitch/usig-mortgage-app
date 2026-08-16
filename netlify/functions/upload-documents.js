// netlify/functions/upload-documents.js
// Receives base64-encoded files, stores them in Netlify Blobs

const { getStore } = require('@netlify/blobs');

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    let body;
    try {
        body = JSON.parse(event.body);
    } catch {
        return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON body' }) };
    }

    const { files } = body;
    if (!Array.isArray(files) || files.length === 0) {
        return { statusCode: 400, body: JSON.stringify({ error: 'No files provided' }) };
    }

    if (files.length > 5) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Maximum 5 files allowed' }) };
    }

    const store = getStore('mortgage-documents');
    const timestamp = Date.now();
    const uploads = [];

    for (const file of files) {
        if (!file.name || !file.data) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Each file must have name and data' }) };
        }

        // Strip data URL prefix: "data:<type>;base64,<data>"
        const base64Match = file.data.match(/^data:[^;]+;base64,(.+)$/);
        if (!base64Match) {
            return { statusCode: 400, body: JSON.stringify({ error: `Invalid file data for: ${file.name}` }) };
        }

        const buffer = Buffer.from(base64Match[1], 'base64');

        // Validate size (10MB max)
        if (buffer.byteLength > 10 * 1024 * 1024) {
            return { statusCode: 400, body: JSON.stringify({ error: `File too large: ${file.name}` }) };
        }

        const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const key = `${timestamp}/${sanitizedName}`;

        await store.set(key, buffer, {
            metadata: {
                contentType: file.type || 'application/octet-stream',
                originalName: file.name,
                uploadedAt: new Date().toISOString(),
                size: buffer.byteLength,
            },
        });

        uploads.push({
            name: file.name,
            size: file.size || buffer.byteLength,
            key,
            type: file.type || 'application/octet-stream',
        });
    }

    return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: true, uploads }),
    };
};
