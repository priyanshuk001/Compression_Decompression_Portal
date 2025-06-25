// Huffman Coding Implementation

class HuffmanNode {
  constructor(char, freq, left = null, right = null) {
    this.char = char;
    this.freq = freq;
    this.left = left;
    this.right = right;
  }

  isLeaf() {
    return this.left === null && this.right === null;
  }
}

class MinHeap {
  constructor() {
    this.heap = [];
  }

  getParentIndex(index) {
    return Math.floor((index - 1) / 2);
  }

  getLeftChildIndex(index) {
    return 2 * index + 1;
  }

  getRightChildIndex(index) {
    return 2 * index + 2;
  }

  swap(index1, index2) {
    [this.heap[index1], this.heap[index2]] = [this.heap[index2], this.heap[index1]];
  }

  insert(node) {
    this.heap.push(node);
    this.heapifyUp(this.heap.length - 1);
  }

  heapifyUp(index) {
    while (index > 0) {
      const parentIndex = this.getParentIndex(index);
      if (this.heap[parentIndex].freq <= this.heap[index].freq) {
        break;
      }
      this.swap(parentIndex, index);
      index = parentIndex;
    }
  }

  extractMin() {
    if (this.heap.length === 0) return null;
    if (this.heap.length === 1) return this.heap.pop();

    const min = this.heap[0];
    this.heap[0] = this.heap.pop();
    this.heapifyDown(0);
    return min;
  }

  heapifyDown(index) {
    while (this.getLeftChildIndex(index) < this.heap.length) {
      const leftChildIndex = this.getLeftChildIndex(index);
      const rightChildIndex = this.getRightChildIndex(index);
      
      let smallestIndex = leftChildIndex;
      if (rightChildIndex < this.heap.length && 
          this.heap[rightChildIndex].freq < this.heap[leftChildIndex].freq) {
        smallestIndex = rightChildIndex;
      }

      if (this.heap[index].freq <= this.heap[smallestIndex].freq) {
        break;
      }

      this.swap(index, smallestIndex);
      index = smallestIndex;
    }
  }

  size() {
    return this.heap.length;
  }
}

function buildFrequencyTable(data) {
  const freqTable = {};
  
  if (Array.isArray(data)) {
    // Binary data (array of bytes)
    for (const byte of data) {
      freqTable[byte] = (freqTable[byte] || 0) + 1;
    }
  } else {
    // Text data (string)
    for (const char of data) {
      freqTable[char] = (freqTable[char] || 0) + 1;
    }
  }
  
  return freqTable;
}

function buildHuffmanTree(freqTable) {
  const heap = new MinHeap();
  
  // Create leaf nodes for each character
  for (const [char, freq] of Object.entries(freqTable)) {
    heap.insert(new HuffmanNode(char, freq));
  }
  
  // Handle edge case: single character
  if (heap.size() === 1) {
    const node = heap.extractMin();
    return new HuffmanNode(null, node.freq, node, null);
  }
  
  // Build the tree
  while (heap.size() > 1) {
    const left = heap.extractMin();
    const right = heap.extractMin();
    const merged = new HuffmanNode(null, left.freq + right.freq, left, right);
    heap.insert(merged);
  }
  
  return heap.extractMin();
}

function buildCodes(root) {
  const codes = {};
  
  if (root.isLeaf()) {
    // Edge case: single character gets code '0'
    codes[root.char] = '0';
    return codes;
  }
  
  function traverse(node, code) {
    if (node.isLeaf()) {
      codes[node.char] = code;
      return;
    }
    
    if (node.left) traverse(node.left, code + '0');
    if (node.right) traverse(node.right, code + '1');
  }
  
  traverse(root, '');
  return codes;
}

function huffmanCompress(data) {
  if (!data || (typeof data === 'string' && data.length === 0) || 
      (Array.isArray(data) && data.length === 0)) {
    throw new Error('Input data is empty');
  }
  
  // Build frequency table
  const freqTable = buildFrequencyTable(data);
  
  // Build Huffman tree
  const root = buildHuffmanTree(freqTable);
  
  // Generate codes
  const codes = buildCodes(root);
  
  // Encode the data
  let encodedBits = '';
  if (Array.isArray(data)) {
    for (const byte of data) {
      encodedBits += codes[byte];
    }
  } else {
    for (const char of data) {
      encodedBits += codes[char];
    }
  }
  
  // Convert bits to bytes for storage efficiency
  const encodedBytes = [];
  for (let i = 0; i < encodedBits.length; i += 8) {
    const byte = encodedBits.slice(i, i + 8).padEnd(8, '0');
    encodedBytes.push(parseInt(byte, 2));
  }
  
  return {
    encodedData: encodedBytes,
    tree: serializeTree(root),
    originalLength: Array.isArray(data) ? data.length : data.length,
    paddingBits: (8 - (encodedBits.length % 8)) % 8,
    isArrayData: Array.isArray(data)
  };
}

function huffmanDecompress(compressedData) {
  if (!compressedData || !compressedData.encodedData || !compressedData.tree) {
    throw new Error('Invalid compressed data format');
  }
  
  const { encodedData, tree, originalLength, paddingBits, isArrayData } = compressedData;
  
  // Deserialize the tree
  const root = deserializeTree(tree);
  
  // Convert bytes back to bits
  let bitString = '';
  for (const byte of encodedData) {
    bitString += byte.toString(2).padStart(8, '0');
  }
  
  // Remove padding bits
  if (paddingBits > 0) {
    bitString = bitString.slice(0, -paddingBits);
  }
  
  // Decode the data
  const decoded = [];
  let current = root;
  
  for (const bit of bitString) {
    if (root.isLeaf()) {
      // Single character case
      decoded.push(root.char);
      continue;
    }
    
    current = bit === '0' ? current.left : current.right;
    
    if (current.isLeaf()) {
      decoded.push(current.char);
      current = root;
    }
  }
  
  // Convert back to original format
  if (isArrayData) {
    return decoded.map(char => parseInt(char));
  } else {
    return decoded.join('');
  }
}

function serializeTree(node) {
  if (!node) return null;
  
  if (node.isLeaf()) {
    return {
      type: 'leaf',
      char: node.char,
      freq: node.freq
    };
  }
  
  return {
    type: 'internal',
    freq: node.freq,
    left: serializeTree(node.left),
    right: serializeTree(node.right)
  };
}

function deserializeTree(serialized) {
  if (!serialized) return null;
  
  if (serialized.type === 'leaf') {
    return new HuffmanNode(serialized.char, serialized.freq);
  }
  
  const left = deserializeTree(serialized.left);
  const right = deserializeTree(serialized.right);
  return new HuffmanNode(null, serialized.freq, left, right);
}

module.exports = {
  huffmanCompress,
  huffmanDecompress
};