const express = require('express');
const axios = require('axios');
const multer = require('multer');
const FormData = require('form-data');
const fs = require('fs');

const app = express();
const port = 5000; // Proxy server port

// Multer setup for handling multipart/form-data
const upload = multer();

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204); // Respond OK to preflight requests
  }
  next();
});

// Proxy endpoint
app.post('/proxy', upload.fields([{ name: 'audio' }, { name: 'transcript' }]), async (req, res) => {
  try {
    // Prepare the FormData to forward to the Docker container server
    const formData = new FormData();

    // Append the audio file
    if (req.files['audio']) {
      const audioFile = req.files['audio'][0];
      formData.append('audio', audioFile.buffer, audioFile.originalname);
    }

    // Append the transcript
    if (req.body.transcript) {
      formData.append('transcript', req.body.transcript);
    }

    // Forward the request to the actual server (running in Docker container)
    const response = await axios.post('http://localhost:8765/transcriptions?async=false', formData, {
      headers: formData.getHeaders(),
    });

    // Send the response back to the client
    res.status(response.status).send(response.data);
  } catch (error) {
    console.error('Error in proxy:', error.message);
    res.status(500).send({ error: 'Failed to process the request' });
  }
});



// Start the proxy server
app.listen(port, () => {
  console.log(`Proxy server running on http://localhost:${port}`);
});
