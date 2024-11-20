import React, { useState, useRef } from 'react';
import axios from 'axios';
import { createClient, srt } from '@deepgram/sdk'; // Import SDK
import CurrentWordDisplay from './CurrentWordDisplay'; // Import the child component
import './App.css';

const App = () => {
  const [file, setFile] = useState(null);
  const [words, setWords] = useState([]);
  const [wordPhonemeMap, setWordPhonemeMap] = useState({});
  const [loading, setLoading] = useState(false);
  const audioRef = useRef(null);

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      console.error('No file selected');
      return;
    }

      const response = await axios.post(
        'https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true',
        file,
        {
          headers: {
            Authorization: `Token 750aec4dbd7f76ba3ec8baed391a270b89121896`, // Replace with your API key
            'Content-Type': 'audio/wav',
          },
        }
      );

      const wordsArray =
        response.data.results.channels[0].alternatives[0].words;
      setWords(wordsArray);
      function getTranscript(words) {
        return words.map(obj => obj.word).join(' ');
      }
      let transcript =  getTranscript(wordsArray)
            // Send the audio and transcript to the local API
            const formData = new FormData();
            formData.append('audio', file); // Attach the audio file
            formData.append('transcript', transcript); // Attach the transcript string
      
            // Send a POST request to the local API
            const localhostResponse = await axios.post(
              'http://localhost:8765/transcriptions?async=false',
              formData,
              {
                headers: {
                  'Content-Type': 'multipart/form-data', // Required for FormData
                },
              }
            );
            function transformWords(response) {
              const wordsArray = response.words;
              return wordsArray.reduce((acc, word) => {
                acc[word.alignedWord] = word.phones.map(phone => phone.phone);
                return acc;
              }, {});
            }

        let word_phoneme_map = transformWords(localhostResponse.data)
        setWordPhonemeMap(word_phoneme_map)
        console.log('Words:', wordsArray);
  
  
    };

    const handleTranscription = async () => {
      if (!file) {
        alert('Please upload a file!');
        return;
      }
  
      setLoading(true);
      
      // Initialize Deepgram client with your API key
      const deepgram = createClient('750aec4dbd7f76ba3ec8baed391a270b89121896'); // Replace with your actual API key
      
      try {
        // 1. Create a readable stream for the uploaded file
        const fileStream = file;
  
        // 2. Upload and transcribe the file
        const { result, error } = await deepgram.listen.prerecorded.transcribeFile(fileStream, {
          smart_format: true,
          utterances: true,
        });
  
        if (error) {
          console.error('Error with transcription:', error);
          setLoading(false);
          return;
        }
  
        // 3. Generate the SRT output from the result
        const srtContent = srt(result);
  
        // 4. Save the result as an SRT file
        const stream = fs.createWriteStream('output.srt', { flags: 'a' });
        stream.write(srtContent);
  
        console.log('SRT file saved as output.srt');
        alert('Transcription completed and saved as output.srt');
      } catch (err) {
        console.error('Error:', err);
        alert('An error occurred during transcription');
      }
  
      setLoading(false);
    };

  return (
    <div>
      <h1>Upload and Play Audio</h1>
      <input type="file" accept="audio/*" onChange={handleFileChange} />
      <button onClick={handleUpload}>Upload</button>
      {file && (
        <div>
          <audio ref={audioRef} src={URL.createObjectURL(file)} controls />
        </div>
      )}
      {/* Pass audioRef and words to the child component */}
      <CurrentWordDisplay audioRef={audioRef} words={words} wordPhonemeMap={wordPhonemeMap} />
    </div>
  );
};

export default App;
