// Run-Length Encoding Implementation

function rleCompress(data) {
  if (!data || (typeof data === 'string' && data.length === 0) || 
      (Array.isArray(data) && data.length === 0)) {
    throw new Error('Input data is empty');
  }

  const compressed = [];
  const isArrayData = Array.isArray(data);
  const length = isArrayData ? data.length : data.length;
  
  let i = 0;
  while (i < length) {
    const currentElement = isArrayData ? data[i] : data[i];
    let count = 1;
    
    // Count consecutive identical elements
    while (i + count < length && 
           (isArrayData ? data[i + count] === currentElement : data[i + count] === currentElement)) {
      count++;
    }
    
    // Store the element and its count
    // For efficiency, we only use RLE when count > 1, otherwise store as-is
    if (count > 1) {
      compressed.push({
        type: 'run',
        element: currentElement,
        count: count
      });
    } else {
      compressed.push({
        type: 'single',
        element: currentElement
      });
    }
    
    i += count;
  }
  
  return {
    compressed: compressed,
    originalLength: length,
    isArrayData: isArrayData
  };
}

function rleDecompress(compressedData) {
  if (!compressedData || !compressedData.compressed) {
    throw new Error('Invalid compressed data format');
  }
  
  const { compressed, originalLength, isArrayData } = compressedData;
  const decompressed = [];
  
  for (const item of compressed) {
    if (item.type === 'run') {
      // Expand the run
      for (let i = 0; i < item.count; i++) {
        decompressed.push(item.element);
      }
    } else if (item.type === 'single') {
      // Single element
      decompressed.push(item.element);
    } else {
      throw new Error('Invalid compressed item type');
    }
  }
  
  // Verify decompressed length matches original
  if (decompressed.length !== originalLength) {
    throw new Error('Decompression failed: length mismatch');
  }
  
  // Return in original format
  if (isArrayData) {
    return decompressed;
  } else {
    return decompressed.join('');
  }
}

// Advanced RLE with better compression for mixed data
function rleCompressAdvanced(data) {
  if (!data || (typeof data === 'string' && data.length === 0) || 
      (Array.isArray(data) && data.length === 0)) {
    throw new Error('Input data is empty');
  }

  const compressed = [];
  const isArrayData = Array.isArray(data);
  const length = isArrayData ? data.length : data.length;
  
  let i = 0;
  while (i < length) {
    const currentElement = isArrayData ? data[i] : data[i];
    let count = 1;
    
    // Count consecutive identical elements
    while (i + count < length && 
           (isArrayData ? data[i + count] === currentElement : data[i + count] === currentElement)) {
      count++;
    }
    
    // Use different strategies based on run length
    if (count >= 4) {
      // Long runs: use RLE
      compressed.push({
        type: 'run',
        element: currentElement,
        count: count
      });
      i += count;
    } else if (count >= 2) {
      // Short runs: still use RLE but mark as short
      compressed.push({
        type: 'short_run',
        element: currentElement,
        count: count
      });
      i += count;
    } else {
      // Single elements: collect into sequences
      const sequence = [currentElement];
      i++;
      
      // Collect more single elements (non-repeating)
      while (i < length && sequence.length < 255) {
        const nextElement = isArrayData ? data[i] : data[i];
        let nextCount = 1;
        
        // Check if next element starts a run
        while (i + nextCount < length && 
               (isArrayData ? data[i + nextCount] === nextElement : data[i + nextCount] === nextElement)) {
          nextCount++;
        }
        
        if (nextCount >= 2) {
          // Next element starts a run, stop collecting singles
          break;
        }
        
        sequence.push(nextElement);
        i++;
      }
      
      compressed.push({
        type: 'sequence',
        elements: sequence
      });
    }
  }
  
  return {
    compressed: compressed,
    originalLength: length,
    isArrayData: isArrayData,
    algorithm: 'advanced_rle'
  };
}

function rleDecompressAdvanced(compressedData) {
  if (!compressedData || !compressedData.compressed) {
    throw new Error('Invalid compressed data format');
  }
  
  const { compressed, originalLength, isArrayData } = compressedData;
  const decompressed = [];
  
  for (const item of compressed) {
    switch (item.type) {
      case 'run':
      case 'short_run':
        // Expand the run
        for (let i = 0; i < item.count; i++) {
          decompressed.push(item.element);
        }
        break;
      
      case 'sequence':
        // Add all elements in the sequence
        decompressed.push(...item.elements);
        break;
      
      case 'single':
        // Legacy support for simple RLE
        decompressed.push(item.element);
        break;
      
      default:
        throw new Error(`Invalid compressed item type: ${item.type}`);
    }
  }
  
  // Verify decompressed length matches original
  if (decompressed.length !== originalLength) {
    throw new Error(`Decompression failed: length mismatch (expected ${originalLength}, got ${decompressed.length})`);
  }
  
  // Return in original format
  if (isArrayData) {
    return decompressed;
  } else {
    return decompressed.join('');
  }
}

// Utility function to analyze data for RLE effectiveness
function analyzeRLEEffectiveness(data) {
  const isArrayData = Array.isArray(data);
  const length = isArrayData ? data.length : data.length;
  
  let runs = 0;
  let totalRunLength = 0;
  let maxRunLength = 0;
  let i = 0;
  
  while (i < length) {
    const currentElement = isArrayData ? data[i] : data[i];
    let count = 1;
    
    while (i + count < length && 
           (isArrayData ? data[i + count] === currentElement : data[i + count] === currentElement)) {
      count++;
    }
    
    if (count > 1) {
      runs++;
      totalRunLength += count;
      maxRunLength = Math.max(maxRunLength, count);
    }
    
    i += count;
  }
  
  return {
    totalRuns: runs,
    averageRunLength: runs > 0 ? totalRunLength / runs : 0,
    maxRunLength: maxRunLength,
    compressionPotential: totalRunLength / length,
    recommendRLE: runs > length * 0.1 || maxRunLength > 4
  };
}

module.exports = {
  rleCompress,
  rleDecompress,
  rleCompressAdvanced,
  rleDecompressAdvanced,
  analyzeRLEEffectiveness
};