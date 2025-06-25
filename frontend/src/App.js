import React, { useState, useRef } from 'react';
import { Upload, Download, FileText, Zap, BarChart3, Info, AlertCircle, CheckCircle2 } from 'lucide-react';

const CompressionPortal = () => {
  const [file, setFile] = useState(null);
  const [fileMetadata, setFileMetadata] = useState(null);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState('huffman');
  const [isProcessing, setIsProcessing] = useState(false);
  const [compressionStats, setCompressionStats] = useState(null);
  const [compressedData, setCompressedData] = useState(null); // This is the JSON string from compression
  const [decompressedData, setDecompressedData] = useState(null); // This is the decompressed output (string or base64)
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const algorithms = {
    huffman: {
      name: 'Huffman Coding',
      description: 'Huffman coding is a lossless data compression algorithm that uses variable-length codes for different characters based on their frequency. More frequent characters get shorter codes, making it highly efficient for text compression.',
      bestFor: 'Text files, documents with repeated patterns'
    },
    rle: {
      name: 'Run-Length Encoding',
      description: 'RLE compresses data by replacing consecutive repeated characters with the character followed by its count. Very effective for data with many consecutive repeated elements.',
      bestFor: 'Images with large uniform areas, simple graphics'
    }
  };

  const supportedTypes = ['text/plain', 'text/csv', 'text/html', 'text/css', 'text/javascript', 'application/json', 'image/bmp', 'image/png', 'image/jpg', 'image/jpeg'];

  const handleFileUpload = (event) => {
    const uploadedFile = event.target.files[0];
    if (!uploadedFile) return;

    // Reset previous states related to previous operations
    setError('');
    setCompressionStats(null);
    setCompressedData(null); // Clear compressed data from previous operations
    setDecompressedData(null); // Clear decompressed data from previous operations

    // Check file type (client-side validation)
    const isSupportedMime = supportedTypes.includes(uploadedFile.type);
    const isSupportedExtension = uploadedFile.name.match(/\.(txt|csv|html|css|js|json|bmp|png|jpg|jpeg)$/i);

    if (!isSupportedMime && !isSupportedExtension) {
      setError('Unsupported file type. Please upload text files, JSON, CSS, JavaScript, or common image formats.');
      setFile(null); // Clear the file state if unsupported
      setFileMetadata(null);
      return;
    }

    setFile(uploadedFile);
    setFileMetadata({
      name: uploadedFile.name,
      size: uploadedFile.size,
      type: uploadedFile.type || 'Unknown', // Fallback for types not recognized by browser
      lastModified: new Date(uploadedFile.lastModified).toLocaleString()
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleCompress = async () => {
    if (!file) {
      setError('Please select a file first.');
      return;
    }

    setIsProcessing(true);
    setError('');
    setDecompressedData(null); // Clear decompressed data from previous decompressions
    setCompressedData(null); // Clear previous compressed data to avoid confusion

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('algorithm', selectedAlgorithm);

      const response = await fetch('http://localhost:3001/api/compress', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Compression failed: ${response.statusText}`);
      }

      const result = await response.json();
      setCompressionStats(result.stats);
      setCompressedData(result.compressedData); // Store the JSON string received from backend

    } catch (err) {
      console.error("Compression error:", err);
      setError(err.message || 'Compression failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDecompress = async () => {
    // This function will now always try to decompress the *currently uploaded file*
    // if `file` is available, otherwise it'll use `compressedData` (which is from a fresh compression)

    if (!file && !compressedData) { // Check if either a file is uploaded or compressedData exists
        setError('Please upload a file or compress one first.');
        return;
    }

    setIsProcessing(true);
    setError('');
    setDecompressedData(null); // Clear previous decompressed data

    try {
      const formData = new FormData();
      formData.append('algorithm', selectedAlgorithm);

      // Determine the input for decompression:
      // If a file is uploaded, we send that file for decompression.
      // We assume this uploaded file *is* the previously compressed JSON.
      // If no file is uploaded but compressedData exists (from a fresh compression), send that in body.
      if (file) {
        formData.append('file', file);
        // Also send originalIsArray if available from fileMetadata or compressionStats
        if (compressionStats && compressionStats.originalIsArray !== undefined) {
             formData.append('originalIsArray', compressionStats.originalIsArray.toString());
        } else {
             // If no compressionStats (e.g., direct upload for decompress),
             // try to infer from file type, or set a default.
             // Best practice: rely on what the backend outputs in its compressed data structure.
             // For now, let's just make sure the backend handles inferring based on data.
        }
      } else if (compressedData) {
        // This path is for decompressing the data that was *just compressed* in the same session
        // It bypasses file upload and sends the compressed data string directly.
        // The backend should also handle this.
        // Change to a JSON request instead of FormData if sending compressedData string directly
        const response = await fetch('http://localhost:3001/api/decompress', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                compressedData: compressedData,
                algorithm: selectedAlgorithm,
                originalIsArray: compressionStats?.originalIsArray // Pass original type info
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Decompression failed: ${response.statusText}`);
        }
        const result = await response.json();
        setDecompressedData(result.decompressedData);
        // Update file metadata for download based on decompressed output type and name
        setFileMetadata(prev => ({
            ...prev,
            type: result.decompressedType || prev?.type,
            name: result.decompressedFileName || prev?.name
        }));
        return; // Exit here if this path was taken
      }


      // If we are here, it means we are using formData (sending the file)
      const response = await fetch('http://localhost:3001/api/decompress', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Decompression failed: ${response.statusText}`);
      }

      const result = await response.json();
      setDecompressedData(result.decompressedData);
      // Update file metadata for download based on decompressed output type and name
      setFileMetadata(prev => ({
          ...prev,
          type: result.decompressedType || prev?.type,
          name: result.decompressedFileName || prev?.name
      }));

    } catch (err) {
      console.error("Decompression error:", err);
      setError(err.message || 'Decompression failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadFile = (data, filename, type = 'text/plain') => {
    let blobData = data;
    // If the data is a base64 string (from backend for binary files), decode it
    if (typeof data === 'string' && (type.startsWith('image/') || type === 'application/octet-stream')) {
      try {
        blobData = Uint8Array.from(atob(data), c => c.charCodeAt(0));
      } catch (e) {
        console.warn("Could not decode base64 for download, falling back to direct data:", e);
        blobData = data;
      }
    }

    const blob = new Blob([blobData], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadCompressed = () => {
    if (compressedData && fileMetadata) {
      // The backend returns compressedData as a JSON string, so download it as .json
      const filename = `${fileMetadata.name.split('.')[0]}_compressed_${selectedAlgorithm}.json`;
      downloadFile(compressedData, filename, 'application/json');
    }
  };

  const downloadDecompressed = () => {
    if (decompressedData && fileMetadata) {
      const filenameParts = fileMetadata.name.split('.');
      // Use the actual fileMetadata.name as updated by decompress response or original
      const originalExtension = fileMetadata.name.includes('.') ? fileMetadata.name.split('.').pop() : 'bin';
      const filename = `${filenameParts[0]}_decompressed.${originalExtension}`;
      downloadFile(decompressedData, filename, fileMetadata.type);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Data Compression Portal</h1>
            <p className="text-gray-600">Upload, compress, and analyze your files with advanced algorithms</p>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Panel - File Upload & Algorithm Selection */}
            <div className="lg:col-span-1 space-y-6">
              {/* File Upload */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                  <Upload className="mr-2 h-5 w-5" />
                  File Upload
                  {file && <CheckCircle2 className="h-5 w-5 text-green-500 ml-2" />} {/* Feedback on upload */}
                </h2>

                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <FileText className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                  <p className="text-gray-600 mb-2">Click to upload or drag and drop</p>
                  <p className="text-sm text-gray-500">Supports: TXT, JSON, CSV, HTML, CSS, JS, BMP, PNG, JPG (as original or compressed JSON)</p>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileUpload}
                  className="hidden"
                  accept=".txt,.json,.csv,.html,.css,.js,.bmp,.png,.jpg,.jpeg"
                />

                {fileMetadata && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-medium text-gray-800 mb-2">File Details</h3>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p><span className="font-medium">Name:</span> {fileMetadata.name}</p>
                      <p><span className="font-medium">Size:</span> {formatFileSize(fileMetadata.size)}</p>
                      <p><span className="font-medium">Type:</span> {fileMetadata.type}</p>
                      <p><span className="font-medium">Modified:</span> {fileMetadata.lastModified}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Algorithm Selection */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                  <Zap className="mr-2 h-5 w-5" />
                  Algorithm
                </h2>

                <div className="space-y-3">
                  {Object.entries(algorithms).map(([key, algo]) => (
                    <label key={key} className="flex items-start space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="algorithm"
                        value={key}
                        checked={selectedAlgorithm === key}
                        onChange={(e) => setSelectedAlgorithm(e.target.value)}
                        className="mt-1"
                      />
                      <div>
                        <div className="font-medium text-gray-800">{algo.name}</div>
                        <div className="text-sm text-gray-600">{algo.bestFor}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Center Panel - Processing & Controls */}
            <div className="lg:col-span-1 space-y-6">
              {/* Action Buttons */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Actions</h2>

                <div className="space-y-3">
                  <button
                    onClick={handleCompress}
                    disabled={!file || isProcessing}
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                  >
                    {isProcessing && !decompressedData ? ( // Show processing for compression
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Compressing...
                      </>
                    ) : (
                      <>
                        <Zap className="mr-2 h-4 w-4" />
                        Compress File
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleDecompress}
                    // Decompress button is enabled if a file is uploaded (assumed to be compressed JSON)
                    // OR if compressedData from a fresh compression exists.
                    disabled={(!file && !compressedData) || isProcessing}
                    className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                  >
                    {isProcessing && decompressedData ? ( // Show processing for decompression
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Decompressing...
                      </>
                    ) : (
                      <>
                        <Zap className="mr-2 h-4 w-4" />
                        Decompress File
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Download Buttons */}
              {(compressedData || decompressedData) && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">Downloads</h2>

                  <div className="space-y-3">
                    {compressedData && (
                      <button
                        onClick={downloadCompressed}
                        className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download Compressed (.json)
                      </button>
                    )}

                    {decompressedData && (
                      <button
                        onClick={downloadDecompressed}
                        className="w-full bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download Decompressed
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Error Display */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
                  <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                  <p className="text-red-700">{error}</p>
                </div>
              )}
            </div>

            {/* Right Panel - Statistics & Information */}
            <div className="lg:col-span-1 space-y-6">
              {/* Compression Statistics */}
              {compressionStats && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                    <BarChart3 className="mr-2 h-5 w-5" />
                    Statistics
                  </h2>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{formatFileSize(compressionStats.originalSize)}</div>
                        <div className="text-sm text-gray-600">Original Size</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{formatFileSize(compressionStats.compressedSize)}</div>
                        <div className="text-sm text-gray-600">Compressed Size</div>
                      </div>
                    </div>

                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">{compressionStats.compressionRatio}%</div>
                      <div className="text-sm text-gray-600">Compression Ratio</div>
                    </div>

                    <div className="text-center p-3 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">{compressionStats.processingTime}ms</div>
                      <div className="text-sm text-gray-600">Processing Time</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Algorithm Information */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                  <Info className="mr-2 h-5 w-5" />
                  Algorithm Info
                </h2>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-gray-800 mb-2">{algorithms[selectedAlgorithm].name}</h3>
                    <p className="text-sm text-gray-600 mb-2">{algorithms[selectedAlgorithm].description}</p>
                    <div className="text-sm">
                      <span className="font-medium text-gray-700">Best for:</span>
                      <span className="text-gray-600 ml-2">{algorithms[selectedAlgorithm].bestFor}</span>
                    </div>
                  </div>
                </div>
              </div>
              {/* No Status Section as requested */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompressionPortal;