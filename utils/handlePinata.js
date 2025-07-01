const fetch = require('node-fetch');
const FormData = require('form-data');
const { Readable } = require('stream');
require('dotenv').config();

/**
 * Uploads a file (Blob or Buffer) to Pinata using the PinFileToIPFS endpoint.
 * Returns the IPFS hash and full gateway URL if successful.
 */
const uploadToPinata = async (buffer, fileName) => {
  // Mock version for testing
  if (process.env.NODE_ENV === 'test' || !process.env.PINATA_API_KEY) {
    return {
      success: true,
      url: `https://gateway.pinata.cloud/ipfs/mock-hash-${Date.now()}`,
      ipfsHash: `mock-hash-${Date.now()}`
    };
  }

  const url = `https://api.pinata.cloud/pinning/pinFileToIPFS`;

  const data = new FormData();
  
  // Create a readable stream from the buffer
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);
  
  data.append('file', stream, {
    filename: fileName,
    contentType: 'application/pdf'
  });

  const metadata = JSON.stringify({ name: fileName });
  const options = JSON.stringify({ cidVersion: 0 });

  data.append('pinataMetadata', metadata);
  data.append('pinataOptions', options);

  try {
    const response = await fetch(url, {
      method: 'POST',
      body: data,
      headers: {
        'pinata_api_key': process.env.PINATA_API_KEY,
        'pinata_secret_api_key': process.env.PINATA_SECRET_KEY
      }
    });

    if (!response.ok) {
      throw new Error(`Error al subir el archivo: ${response.statusText}`);
    }

    const result = await response.json();
    return {
      success: true,
      url: `${process.env.PINATA_GATEWAY}${result.IpfsHash}`,
      ipfsHash: result.IpfsHash
    };
  } catch (error) {
    console.error('Error al subir el archivo a Pinata:', error);
    throw error;
  }
};

/**
 * Retrieves a file from Pinata by its metadata name (if it was uploaded with a name).
 * Returns the IPFS hash and URL if found.
 */
const getFilePinata = async (fileName) => {
  // Mock version for testing
  if (process.env.NODE_ENV === 'test' || !process.env.PINATA_API_KEY) {
    return {
      success: true,
      url: `https://gateway.pinata.cloud/ipfs/mock-hash-${Date.now()}`,
      ipfsHash: `mock-hash-${Date.now()}`
    };
  }

  const url = `https://api.pinata.cloud/data/pinList?metadata[name]=${fileName}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'pinata_api_key': process.env.PINATA_API_KEY,
        'pinata_secret_api_key': process.env.PINATA_SECRET_KEY
      }
    });

    if (!response.ok) {
      throw new Error(`Error fetching file from Pinata: ${response.statusText}`);
    }

    const data = await response.json();
    if (data.rows.length === 0) {
      return { success: false, error: 'Archivo no encontrado en Pinata' };
    }

    const ipfsHash = data.rows[0].ipfs_pin_hash;
    return {
      success: true,
      url: `${process.env.PINATA_GATEWAY}${ipfsHash}`,
      ipfsHash
    };
  } catch (error) {
    console.error('Error al obtener archivo de Pinata:', error);
    throw error;
  }
};

module.exports = {
  uploadFile: uploadToPinata,
  getFile: getFilePinata
};
