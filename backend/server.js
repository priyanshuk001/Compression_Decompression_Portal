// ... (existing imports)
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const { huffmanCompress, huffmanDecompress } = require('./algorithms/huffman');
const { rleCompress, rleDecompress } = require('./algorithms/rle');

const app = express();
const port = 3001;

// Middleware
app.use(cors());
// IMPORTANT: For file uploads, we generally don't need express.json() for the file itself,
// but it's fine if other parts of the request are JSON. Keep limits in mind.
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Multer configuration for file uploads (re-using the same for compress and decompress)
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Helper function to measure processing time
const measureTime = (fn) => {
  const start = Date.now();
  const result = fn();
  const end = Date.now();
  return { result, time: end - start };
};

// Helper function to convert buffer to string safely
const bufferToString = (buffer) => {
  try {
    return buffer.toString('utf8');
  } catch (error) {
    return buffer.toString('binary'); // Fallback for binary data that might not be valid UTF-8
  }
};

// Helper function to detect if data is binary
const isBinaryData = (buffer) => {
  const sample = buffer.slice(0, Math.min(buffer.length, 512)); // Sample up to 512 bytes
  let binaryBytes = 0;

  for (let i = 0; i < sample.length; i++) {
    const byte = sample[i];
    // Check for null bytes or control characters (excluding common whitespace like tab, newline, carriage return)
    if (byte === 0 || (byte < 32 && byte !== 9 && byte !== 10 && byte !== 13)) {
      binaryBytes++;
    }
  }

  // If a significant portion of sampled bytes are "binary-looking", consider it binary
  return (binaryBytes / sample.length) > 0.3; // Threshold can be adjusted
};

// API Routes

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Compression endpoint (no changes here)
app.post('/api/compress', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { algorithm } = req.body;
    if (!algorithm || !['huffman', 'rle'].includes(algorithm)) {
      return res.status(400).json({ error: 'Invalid or missing algorithm' });
    }

    const fileBuffer = req.file.buffer;
    const originalSize = fileBuffer.length;

    let inputData;
    let isArrayDataForCompress; // To correctly store if original data was array or string
    if (isBinaryData(fileBuffer)) {
      inputData = Array.from(fileBuffer);
      isArrayDataForCompress = true;
    } else {
      inputData = bufferToString(fileBuffer);
      isArrayDataForCompress = false;
    }

    let compressedData, compressionTime;

    if (algorithm === 'huffman') {
      const { result, time } = measureTime(() => huffmanCompress(inputData));
      compressedData = result;
      compressionTime = time;
    } else if (algorithm === 'rle') {
      // Assuming rleCompress also returns an object with isArrayData, like advanced RLE
      const { result, time } = measureTime(() => rleCompress(inputData));
      compressedData = result;
      compressionTime = time;
    } else {
      return res.status(400).json({ error: 'Unsupported compression algorithm' });
    }

    // Calculate compressed size for JSON string
    const compressedSize = Buffer.byteLength(JSON.stringify(compressedData), 'utf8');

    const compressionRatio = Math.round(((originalSize - compressedSize) / originalSize) * 100);

    const stats = {
      originalSize,
      compressedSize,
      compressionRatio: Math.max(0, compressionRatio),
      processingTime: compressionTime,
      algorithm,
      fileName: req.file.originalname,
      fileType: req.file.mimetype,
      originalIsArray: isArrayDataForCompress // Store this for decompression
    };

    res.json({
      success: true,
      compressedData: JSON.stringify(compressedData), // Send as string to client
      stats
    });

  } catch (error) {
    console.error('Compression error:', error);
    res.status(500).json({
      error: 'Compression failed',
      details: error.message
    });
  }
});

// Decompression endpoint (MODIFIED)
// This endpoint now accepts a file upload OR JSON body, but prefers file upload if present.
app.post('/api/decompress', upload.single('file'), async (req, res) => {
  try {
    let inputToDecompress;
    let algorithm;
    let originalIsArray;
    let fileName = 'decompressed_file'; // Default filename if not available

    if (req.file) {
      // Case 1: File uploaded directly for decompression
      // We assume the uploaded file is the 'compressedData' that was previously JSON stringified.
      // And the algorithm is provided in req.body
      try {
        inputToDecompress = JSON.parse(bufferToString(req.file.buffer));
        algorithm = req.body.algorithm;
        fileName = req.file.originalname; // Use uploaded file's name for reference
        // originalIsArray will need to be inferred or passed.
        // For simplicity, let's assume it's part of the compressed data if the structure includes it,
        // or we'll default based on the output of decompression.
        originalIsArray = req.body.originalIsArray === 'true'; // Convert string 'true'/'false' to boolean
        if (inputToDecompress && typeof inputToDecompress === 'object' && inputToDecompress.isArrayData !== undefined) {
             originalIsArray = inputToDecompress.isArrayData;
        }

      } catch (parseError) {
        return res.status(400).json({ error: 'Uploaded file is not a valid compressed data JSON format.', details: parseError.message });
      }

    } else if (req.body.compressedData) {
      // Case 2: compressedData provided in JSON body (e.g., from a recent compression)
      try {
        inputToDecompress = JSON.parse(req.body.compressedData);
        algorithm = req.body.algorithm;
        originalIsArray = req.body.originalIsArray; // Get from client if available
      } catch (parseError) {
        return res.status(400).json({ error: 'Invalid compressed data format in body.', details: parseError.message });
      }

    } else {
      return res.status(400).json({ error: 'No compressed data (file or body) provided for decompression.' });
    }

    if (!algorithm || !['huffman', 'rle'].includes(algorithm)) {
      return res.status(400).json({ error: 'Invalid or missing algorithm for decompression' });
    }

    let decompressedResult, decompressionTime;

    if (algorithm === 'huffman') {
      const { result, time } = measureTime(() => huffmanDecompress(inputToDecompress));
      decompressedResult = result;
      decompressionTime = time;
    } else if (algorithm === 'rle') {
      const { result, time } = measureTime(() => rleDecompress(inputToDecompress));
      decompressedResult = result;
      decompressionTime = time;
    } else {
      return res.status(400).json({ error: 'Unsupported decompression algorithm' });
    }

    let outputData;
    let outputMimeType = 'application/octet-stream'; // Default for binary

    // Reconstruct the original data format based on originalIsArray or type inference
    if (decompressedResult instanceof Uint8Array || Array.isArray(decompressedResult)) {
        // Assume it's binary data (e.g., image, binary file)
        // Convert to Buffer, then to a base64 string for safe JSON transport if needed
        // Or if the client needs it as a direct binary string (less common, but was used before)
        outputData = Buffer.from(decompressedResult).toString('base64');
        // Try to infer original MIME type from file metadata (if known from upload)
        // Or default to common image types if it looks like one (not perfect)
        if (fileName.match(/\.(bmp|png|jpg|jpeg)$/i)) {
            // This is just a guess based on extension, better to pass from frontend.
            outputMimeType = `image/${fileName.split('.').pop()}`;
        }
    } else if (typeof decompressedResult === 'string') {
        // Assume it's text data
        outputData = decompressedResult;
        // Try to infer original MIME type from file metadata
        if (fileName.match(/\.(txt|csv|html|css|js|json)$/i)) {
            // This is just a guess based on extension, better to pass from frontend.
            outputMimeType = `text/${fileName.split('.').pop()}`;
            if (outputMimeType === 'text/js') outputMimeType = 'text/javascript'; // Correct common one
            if (outputMimeType === 'text/json') outputMimeType = 'application/json'; // Correct common one
        } else {
            outputMimeType = 'text/plain';
        }
    } else {
        // Fallback for other data types if any
        outputData = JSON.stringify(decompressedResult);
        outputMimeType = 'application/json';
    }


    res.json({
      success: true,
      decompressedData: outputData,
      processingTime: decompressionTime,
      decompressedType: outputMimeType, // Send back the inferred or original MIME type
      decompressedFileName: fileName // Potentially reconstruct original file name
    });

  } catch (error) {
    console.error('Decompression error:', error);
    res.status(500).json({
      error: 'Decompression failed',
      details: error.message
    });
  }
});

// ... (rest of the backend code - /api/stats, error handling, server start)

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);

  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File size too large. Maximum size is 10MB.' });
    }
  }

  res.status(500).json({
    error: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// Handle 404
app.use('*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log('Available endpoints:');
  console.log(`  GET  /api/health - Health check`);
  console.log(`  POST /api/compress - Compress file`);
  console.log(`  POST /api/decompress - Decompress file (accepts file upload)`); // Updated message
  console.log(`  GET  /api/stats - Get server statistics`);
});

module.exports = app;