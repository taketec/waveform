import React, { useEffect, useState } from 'react';

const CurrentWordDisplay = ({ audioRef, words, wordPhonemeMap }) => {
  const [currentWord, setCurrentWord] = useState('');
  const [currentPhoneme, setCurrentPhoneme] = useState('')

  useEffect(()=>{console.log(currentPhoneme)},[currentPhoneme])

  console.log(wordPhonemeMap)
  const mergeShortWords = (wordsArray) => {
    const mergedWords = [];
    
    for (let i = 0; i < wordsArray.length; i++) {
      const currentWordObj = wordsArray[i];
      const nextWordObj = wordsArray[i + 1];
      
      // Check if the current word's duration is less than 350ms
      if (currentWordObj.end - currentWordObj.start < 0.35) {
        if (nextWordObj) {
          // Merge current word with next word if the gap is small
          const mergedWord = {
            word: currentWordObj.word + ' ' + nextWordObj.word,
            start: currentWordObj.start,
            end: nextWordObj.end,
          };
          mergedWords.push(mergedWord);
          i++; // Skip the next word as it has been merged
        } else {
          // If no next word, just push the current word (for the last word)
          mergedWords.push(currentWordObj);
        }
      } else {
        mergedWords.push(currentWordObj);
      }
    }
    
    return mergedWords;
  };

  useEffect(() => {
    if (!audioRef.current || words.length === 0) return;

    const handleTimeUpdate = () => {
      const currentTime = audioRef.current.currentTime;

      // Merge words with short durations
      const mergedWords = mergeShortWords(words);

      // Find the current word based on the playback time
      const wordObj = mergedWords.find(
        (w) => currentTime >= w.start && currentTime <= w.end
      );

      // If the word is different from the previous word, update the state
  // If the word is different from the previous word, update the state
  if (wordObj && wordObj.word !== currentWord) {
    setCurrentWord(wordObj.word);

    // Split the wordObj.word (it could be multiple words)
    const wordsInCurrentPhrase = wordObj.word.split(' ');

    // Extract and merge phonemes for each word in the phrase
    const mergedPhonemes = wordsInCurrentPhrase
      .map(word => wordPhonemeMap[word] || []) // Get phonemes for each word
      .flat() // Flatten the array of arrays into a single array
      .join('    '); // Join all phonemes into a single string separated by space

    // Set the current phoneme (merged phonemes as a string)
    setCurrentPhoneme(mergedPhonemes);
  }
    };

    const handleAudioEnd = () => {
      // Reset the current word to an empty string when the audio ends
      setCurrentWord('');
      setCurrentPhoneme("");

    };

    // Attach the event listeners
    audioRef.current.addEventListener('timeupdate', handleTimeUpdate);
    audioRef.current.addEventListener('ended', handleAudioEnd);

    // Clean up the event listeners when the component unmounts or audioRef changes
    return () => {
      audioRef.current.removeEventListener('timeupdate', handleTimeUpdate);
      audioRef.current.removeEventListener('ended', handleAudioEnd);
    };
  }, [audioRef, words, currentWord]); // Depend on audioRef, words, and currentWord

  return (
<div>
  <div style={{ whiteSpace: 'pre-wrap', fontSize: '20px' }}>
    {mergeShortWords(words).map((wordObj, index) => (
      <span
        key={index}
        style={{
          color: wordObj.word === currentWord ? 'red' : 'black',
          transition: 'color 0.3s ease',
          margin: '0 5px',
        }}
      >
        {wordObj.word}
      </span>
    ))}
  </div>

  {/* Display current phoneme below the text */}
  <div style={{ marginTop: '10px', fontSize: '18px', color: 'blue' }}>
    {currentPhoneme}
  </div>
</div>
  );
};

export default CurrentWordDisplay;
