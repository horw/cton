document.addEventListener('DOMContentLoaded', function() {
    // Check for microphone support
    const hasMicrophoneSupport = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    
    // Set a global flag for microphone support
    window.microphoneSupported = hasMicrophoneSupport;
    
    if (!hasMicrophoneSupport) {
        console.log('Microphone access not supported in this browser. Voice recording features will be disabled.');
        
        // Show microphone support message
        const micSupportMessage = document.getElementById('mic-support-message');
        if (micSupportMessage) {
            micSupportMessage.classList.remove('hidden');
        }
        
        // Update recording button appearance
        const startRecordingButton = document.getElementById('start-recording');
        if (startRecordingButton) {
            startRecordingButton.querySelector('.mic-text').textContent = 'Show Tone Pattern';
        }
        
        // Update recording status
        const recordingStatus = document.getElementById('recording-status');
        if (recordingStatus) {
            recordingStatus.textContent = 'Microphone access not available';
        }
    }
    // Character data for practice
    const characters = {
        tone1: [
            { character: '妈', pinyin: 'mā', meaning: 'mother' },
            { character: '高', pinyin: 'gāo', meaning: 'tall' },
            { character: '天', pinyin: 'tiān', meaning: 'sky' },
            { character: '飞', pinyin: 'fēi', meaning: 'to fly' },
            { character: '书', pinyin: 'shū', meaning: 'book' }
        ],
        tone2: [
            { character: '忙', pinyin: 'máng', meaning: 'busy' },
            { character: '学', pinyin: 'xué', meaning: 'to study' },
            { character: '来', pinyin: 'lái', meaning: 'to come' },
            { character: '时', pinyin: 'shí', meaning: 'time' },
            { character: '钱', pinyin: 'qián', meaning: 'money' }
        ],
        tone3: [
            { character: '马', pinyin: 'mǎ', meaning: 'horse' },
            { character: '好', pinyin: 'hǎo', meaning: 'good' },
            { character: '小', pinyin: 'xiǎo', meaning: 'small' },
            { character: '可', pinyin: 'kě', meaning: 'can' },
            { character: '水', pinyin: 'shuǐ', meaning: 'water' }
        ],
        tone4: [
            { character: '是', pinyin: 'shì', meaning: 'to be' },
            { character: '大', pinyin: 'dà', meaning: 'big' },
            { character: '去', pinyin: 'qù', meaning: 'to go' },
            { character: '不', pinyin: 'bù', meaning: 'no/not' },
            { character: '四', pinyin: 'sì', meaning: 'four' }
        ],
        tone0: [
            { character: '吗', pinyin: 'ma', meaning: 'question particle' },
            { character: '的', pinyin: 'de', meaning: 'possessive particle' },
            { character: '了', pinyin: 'le', meaning: 'completed action particle' },
            { character: '们', pinyin: 'men', meaning: 'plural marker' },
            { character: '呢', pinyin: 'ne', meaning: 'question particle' }
        ]
    };

    // Tone pairs data
    const tonePairs = {
        '1-3': [
            { character: '你好', pinyin: 'nī hǎo', meaning: 'hello' },
            { character: '飞马', pinyin: 'fēi mǎ', meaning: 'flying horse' },
            { character: '天水', pinyin: 'tiān shuǐ', meaning: 'heavenly water' }
        ],
        '2-4': [
            { character: '学习', pinyin: 'xué xí', meaning: 'to study' },
            { character: '时间', pinyin: 'shí jiàn', meaning: 'time' },
            { character: '忙碌', pinyin: 'máng lù', meaning: 'busy' }
        ],
        '3-3': [
            { character: '小马', pinyin: 'xiǎo mǎ', meaning: 'little horse' },
            { character: '可以', pinyin: 'kě yǐ', meaning: 'can' },
            { character: '好好', pinyin: 'hǎo hǎo', meaning: 'well/properly' }
        ],
        '4-1': [
            { character: '大天', pinyin: 'dà tiān', meaning: 'big sky' },
            { character: '是非', pinyin: 'shì fēi', meaning: 'right and wrong' },
            { character: '四川', pinyin: 'sì chuān', meaning: 'Sichuan' }
        ]
    };

    // Current state
    let currentTone = '1';
    let currentPair = '1-3';
    let currentCharacterIndex = 0;
    let currentPairIndex = 0;
    let quizCharacter = null;
    let currentVoiceCharacter = characters.tone1[0];
    
    // Voice recording state
    let mediaRecorder = null;
    let audioChunks = [];
    let isRecording = false;
    let audioContext = null;
    let analyser = null;
    let microphoneStream = null;
    let recordingTimeout = null;
    
    // DOM elements
    const characterDisplay = document.getElementById('character-display');
    const toneButtons = document.querySelectorAll('.tone-btn');
    const playButton = document.getElementById('play-sound');
    const nextButton = document.getElementById('next-character');
    
    const tonePairDisplay = document.getElementById('tone-pair-display');
    const pairButtons = document.querySelectorAll('.pair-btn');
    const playPairButton = document.getElementById('play-pair');
    const nextPairButton = document.getElementById('next-pair');
    
    const quizCharacterElement = document.getElementById('quiz-character');
    const quizButtons = document.querySelectorAll('.quiz-btn');
    const quizResult = document.getElementById('quiz-result');
    const nextQuizButton = document.getElementById('next-quiz');
    
    // Voice practice elements
    const voiceCharacterDisplay = document.getElementById('voice-character-display');
    const playExampleButton = document.getElementById('play-example');
    const nextVoiceCharacterButton = document.getElementById('next-voice-character');
    const startRecordingButton = document.getElementById('start-recording');
    const recordingStatus = document.getElementById('recording-status');
    const toneFeedback = document.getElementById('tone-feedback');
    const toneAccuracy = document.getElementById('tone-accuracy');
    const toneTips = document.getElementById('tone-tips');
    const toneCanvas = document.getElementById('tone-canvas');

    // Initialize
    updateCharacterDisplay();
    updateTonePairDisplay();
    setupQuiz();
    updateVoiceCharacterDisplay();

    // Event listeners for tone selection
    toneButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            toneButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Update current tone
            currentTone = this.getAttribute('data-tone');
            currentCharacterIndex = 0;
            updateCharacterDisplay();
        });
    });

    // Event listeners for tone pair selection
    pairButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            pairButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Update current pair
            currentPair = this.getAttribute('data-pair');
            currentPairIndex = 0;
            updateTonePairDisplay();
        });
    });

    // Event listener for play sound button
    playButton.addEventListener('click', function() {
        playToneSound(currentTone, characters[`tone${currentTone}`][currentCharacterIndex].pinyin);
    });

    // Event listener for next character button
    nextButton.addEventListener('click', function() {
        const toneArray = currentTone === 'all' 
            ? [...characters.tone1, ...characters.tone2, ...characters.tone3, ...characters.tone4, ...characters.tone0]
            : characters[`tone${currentTone}`];
            
        currentCharacterIndex = (currentCharacterIndex + 1) % toneArray.length;
        updateCharacterDisplay();
    });

    // Event listener for play pair button
    playPairButton.addEventListener('click', function() {
        if (currentPair === 'random') {
            const randomPair = tonePairDisplay.querySelector('.tone-pair-pinyin').textContent;
            playTonePairSound(randomPair);
        } else {
            playTonePairSound(tonePairs[currentPair][currentPairIndex].pinyin);
        }
    });

    // Event listener for next pair button
    nextPairButton.addEventListener('click', function() {
        if (currentPair === 'random') {
            // Get a random pair from all available pairs
            const allPairs = [].concat(...Object.values(tonePairs));
            currentPairIndex = Math.floor(Math.random() * allPairs.length);
            const randomPair = allPairs[currentPairIndex];
            
            tonePairDisplay.querySelector('.tone-pair-character').textContent = randomPair.character;
            tonePairDisplay.querySelector('.tone-pair-pinyin').textContent = randomPair.pinyin;
            tonePairDisplay.querySelector('.tone-pair-meaning').textContent = randomPair.meaning;
        } else {
            currentPairIndex = (currentPairIndex + 1) % tonePairs[currentPair].length;
            updateTonePairDisplay();
        }
    });

    // Quiz event listeners
    quizButtons.forEach(button => {
        button.addEventListener('click', function() {
            const selectedTone = this.getAttribute('data-tone');
            const correctTone = quizCharacter.pinyin.match(/[āáǎàa]/) ? '1' :
                               quizCharacter.pinyin.match(/[ēéěèe]/) ? '2' :
                               quizCharacter.pinyin.match(/[īíǐìi]/) ? '3' :
                               quizCharacter.pinyin.match(/[ōóǒòo]/) ? '4' :
                               quizCharacter.pinyin.match(/[ūúǔùu]/) ? '5' : '0';
            
            if (selectedTone === correctTone) {
                quizResult.textContent = 'Correct!';
                quizResult.className = 'correct';
            } else {
                quizResult.textContent = `Incorrect. The correct tone is ${correctTone}.`;
                quizResult.className = 'incorrect';
            }
        });
    });

    nextQuizButton.addEventListener('click', setupQuiz);

    // Functions to update displays
    function updateCharacterDisplay() {
        let characterToDisplay;
        
        if (currentTone === 'all') {
            // Combine all tones and pick a random character
            const allCharacters = [].concat(
                characters.tone1,
                characters.tone2,
                characters.tone3,
                characters.tone4,
                characters.tone0
            );
            characterToDisplay = allCharacters[Math.floor(Math.random() * allCharacters.length)];
        } else {
            // Display character from the selected tone
            characterToDisplay = characters[`tone${currentTone}`][currentCharacterIndex];
        }
        
        characterDisplay.querySelector('.chinese-character').textContent = characterToDisplay.character;
        characterDisplay.querySelector('.pinyin').textContent = characterToDisplay.pinyin;
        characterDisplay.querySelector('.meaning').textContent = characterToDisplay.meaning;
    }

    function updateTonePairDisplay() {
        let pairToDisplay;
        
        if (currentPair === 'random') {
            // Get a random pair from all available pairs
            const allPairs = [].concat(...Object.values(tonePairs));
            pairToDisplay = allPairs[Math.floor(Math.random() * allPairs.length)];
        } else {
            // Display pair from the selected pair type
            pairToDisplay = tonePairs[currentPair][currentPairIndex];
        }
        
        tonePairDisplay.querySelector('.tone-pair-character').textContent = pairToDisplay.character;
        tonePairDisplay.querySelector('.tone-pair-pinyin').textContent = pairToDisplay.pinyin;
        tonePairDisplay.querySelector('.tone-pair-meaning').textContent = pairToDisplay.meaning;
    }

    function setupQuiz() {
        // Reset quiz result
        quizResult.textContent = '';
        
        // Get all characters from all tones
        const allCharacters = [].concat(
            characters.tone1,
            characters.tone2,
            characters.tone3,
            characters.tone4,
            characters.tone0
        );
        
        // Pick a random character
        quizCharacter = allCharacters[Math.floor(Math.random() * allCharacters.length)];
        
        // Update quiz display
        quizCharacterElement.querySelector('.quiz-chinese').textContent = quizCharacter.character;
    }

    // Enhanced function to play tone sounds with better audio quality
    function playToneSound(tone, pinyin) {
        console.log(`Playing sound for tone ${tone}: ${pinyin}`);
        
        // For demonstration, we'll use the Web Speech API with enhanced parameters
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(pinyin);
            utterance.lang = 'zh-CN';
            
            // Adjust speech parameters based on the tone for more accurate pronunciation
            switch(tone) {
                case '1': // High level tone
                    utterance.pitch = 1.5;
                    utterance.rate = 0.8;
                    break;
                case '2': // Rising tone
                    utterance.pitch = 1.2;
                    utterance.rate = 0.9;
                    break;
                case '3': // Falling-rising tone
                    utterance.pitch = 1.0;
                    utterance.rate = 0.7;
                    break;
                case '4': // Falling tone
                    utterance.pitch = 1.3;
                    utterance.rate = 1.0;
                    break;
                default: // Neutral tone
                    utterance.pitch = 1.0;
                    utterance.rate = 1.1;
            }
            
            speechSynthesis.speak(utterance);
        } else {
            alert('Sorry, your browser does not support text-to-speech!');
        }
    }

    function playTonePairSound(pinyin) {
        // In a real implementation, this would play an audio file
        console.log(`Playing sound for tone pair: ${pinyin}`);
        
        // For demonstration, we'll use the Web Speech API
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(pinyin);
            utterance.lang = 'zh-CN';
            speechSynthesis.speak(utterance);
        } else {
            alert('Sorry, your browser does not support text-to-speech!');
        }
    }

    // Voice practice event listeners
    playExampleButton.addEventListener('click', function() {
        playToneSound(getToneNumber(currentVoiceCharacter.pinyin), currentVoiceCharacter.pinyin);
    });
    
    nextVoiceCharacterButton.addEventListener('click', function() {
        // Cycle through all characters
        const allCharacters = [].concat(
            characters.tone1,
            characters.tone2,
            characters.tone3,
            characters.tone4,
            characters.tone0
        );
        
        const currentIndex = allCharacters.findIndex(char => 
            char.character === currentVoiceCharacter.character);
        const nextIndex = (currentIndex + 1) % allCharacters.length;
        
        currentVoiceCharacter = allCharacters[nextIndex];
        updateVoiceCharacterDisplay();
    });
    
    startRecordingButton.addEventListener('click', function() {
        if (!window.microphoneSupported) {
            // Show a helpful message if microphone is not supported
            toneFeedback.textContent = 'Microphone access is not available in your browser.';
            toneAccuracy.textContent = '';
            toneTips.innerHTML = 'You can still practice by:<br>1. Listening to the example<br>2. Speaking aloud<br>3. Comparing your pronunciation with the example';
            
            // Show the expected tone pattern anyway to help with practice
            drawTonePattern(getToneNumber(currentVoiceCharacter.pinyin));
            return;
        }
        
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    });
    
    // Function to update voice character display
    function updateVoiceCharacterDisplay() {
        voiceCharacterDisplay.querySelector('.voice-chinese-character').textContent = currentVoiceCharacter.character;
        voiceCharacterDisplay.querySelector('.voice-pinyin').textContent = currentVoiceCharacter.pinyin;
        voiceCharacterDisplay.querySelector('.voice-meaning').textContent = currentVoiceCharacter.meaning;
        
        const toneNumber = getToneNumber(currentVoiceCharacter.pinyin);
        let toneDescription = '';
        
        switch(toneNumber) {
            case '1': toneDescription = '1st (High and level)'; break;
            case '2': toneDescription = '2nd (Rising)'; break;
            case '3': toneDescription = '3rd (Falling then rising)'; break;
            case '4': toneDescription = '4th (Falling)'; break;
            default: toneDescription = 'Neutral (Light and short)';
        }
        
        voiceCharacterDisplay.querySelector('.voice-tone-number').textContent = `Tone: ${toneDescription}`;
        
        // Reset feedback
        if (!window.microphoneSupported) {
            toneFeedback.textContent = 'Microphone access is not available in your browser.';
            toneTips.innerHTML = 'You can still practice by:<br>1. Listening to the example<br>2. Speaking aloud<br>3. Comparing your pronunciation with the example';
            
            // Show the tone pattern to help with practice
            drawTonePattern(toneNumber);
        } else {
            toneFeedback.textContent = 'Waiting for your pronunciation...';
            toneAccuracy.textContent = '';
            toneTips.textContent = '';
            
            // Clear canvas
            const ctx = toneCanvas.getContext('2d');
            ctx.clearRect(0, 0, toneCanvas.width, toneCanvas.height);
        }
    }
    
    // Function to get tone number from pinyin - improved to be more accurate
    function getToneNumber(pinyin) {
        // First tone (macron): ā ē ī ō ū ǖ
        if (pinyin.match(/[āēīōūǖ]/)) return '1';
        
        // Second tone (acute accent): á é í ó ú ǘ
        if (pinyin.match(/[áéíóúǘ]/)) return '2';
        
        // Third tone (caron): ǎ ě ǐ ǒ ǔ ǚ
        if (pinyin.match(/[ǎěǐǒǔǚ]/)) return '3';
        
        // Fourth tone (grave accent): à è ì ò ù ǜ
        if (pinyin.match(/[àèìòùǜ]/)) return '4';
        
        // Check for unmarked vowels (neutral tone)
        if (pinyin.match(/[aeiouü]/) && !pinyin.match(/[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/)) {
            return '0'; // neutral tone
        }
        
        // Default to neutral if no match found
        return '0';
    }
    
    // Function to start recording
    function startRecording() {
        if (isRecording) return;
        
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(function(stream) {
                microphoneStream = stream;
                
                // Set up audio context and analyzer
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
                analyser = audioContext.createAnalyser();
                const microphone = audioContext.createMediaStreamSource(stream);
                microphone.connect(analyser);
                
                // Configure analyzer
                analyser.fftSize = 2048;
                analyser.smoothingTimeConstant = 0.8;
                
                // Set up media recorder
                mediaRecorder = new MediaRecorder(stream);
                audioChunks = [];
                
                mediaRecorder.addEventListener('dataavailable', function(event) {
                    audioChunks.push(event.data);
                });
                
                mediaRecorder.addEventListener('stop', function() {
                    const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                    analyzeTone(audioBlob);
                });
                
                // Start recording
                mediaRecorder.start();
                isRecording = true;
                
                // Update UI
                startRecordingButton.classList.add('recording');
                startRecordingButton.querySelector('.mic-text').textContent = 'Stop Recording';
                recordingStatus.textContent = 'Recording... (speak the character)';
                
                // Start visualizing
                visualizeTone();
                
                // Auto-stop after 3 seconds
                recordingTimeout = setTimeout(function() {
                    if (isRecording) {
                        stopRecording();
                    }
                }, 3000);
            })
            .catch(function(error) {
                console.error('Error accessing microphone:', error);
                alert('Could not access microphone. Please check permissions.');
            });
    }
    
    // Function to stop recording
    function stopRecording() {
        if (!isRecording) return;
        
        // Clear timeout if it exists
        if (recordingTimeout) {
            clearTimeout(recordingTimeout);
            recordingTimeout = null;
        }
        
        // Stop recording
        mediaRecorder.stop();
        isRecording = false;
        
        // Stop all tracks in the stream
        if (microphoneStream) {
            microphoneStream.getTracks().forEach(track => track.stop());
            microphoneStream = null;
        }
        
        // Update UI
        startRecordingButton.classList.remove('recording');
        startRecordingButton.querySelector('.mic-text').textContent = 'Start Recording';
        recordingStatus.textContent = 'Processing your pronunciation...';
    }
    
    // Function to visualize tone
    function visualizeTone() {
        if (!isRecording || !analyser) return;
        
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteTimeDomainData(dataArray);
        
        const canvasCtx = toneCanvas.getContext('2d');
        canvasCtx.clearRect(0, 0, toneCanvas.width, toneCanvas.height);
        
        canvasCtx.lineWidth = 2;
        canvasCtx.strokeStyle = 'rgb(229, 57, 53)';
        canvasCtx.beginPath();
        
        const sliceWidth = toneCanvas.width / bufferLength;
        let x = 0;
        
        for (let i = 0; i < bufferLength; i++) {
            const v = dataArray[i] / 128.0;
            const y = v * toneCanvas.height / 2;
            
            if (i === 0) {
                canvasCtx.moveTo(x, y);
            } else {
                canvasCtx.lineTo(x, y);
            }
            
            x += sliceWidth;
        }
        
        canvasCtx.lineTo(toneCanvas.width, toneCanvas.height / 2);
        canvasCtx.stroke();
        
        if (isRecording) {
            requestAnimationFrame(visualizeTone);
        }
    }
    
    // Function to analyze tone (simplified simulation)
    function analyzeTone(audioBlob) {
        // In a real implementation, this would use pitch detection algorithms
        // or machine learning models to analyze the tone pattern
        // For this demo, we'll simulate analysis with random accuracy
        
        recordingStatus.textContent = 'Analysis complete';
        
        // Get the expected tone
        const expectedTone = getToneNumber(currentVoiceCharacter.pinyin);
        let toneName = '';
        
        switch(expectedTone) {
            case '1': toneName = '1st tone (high and level)'; break;
            case '2': toneName = '2nd tone (rising)'; break;
            case '3': toneName = '3rd tone (falling then rising)'; break;
            case '4': toneName = '4th tone (falling)'; break;
            default: toneName = 'neutral tone';
        }
        
        // Simulate analysis (in a real app, this would be actual tone analysis)
        const accuracy = Math.floor(Math.random() * 41) + 60; // Random accuracy between 60-100%
        
        // Display feedback
        toneFeedback.textContent = `You were attempting the ${toneName}`;
        toneAccuracy.textContent = `Accuracy: ${accuracy}%`;
        
        // Draw the expected tone pattern
        drawTonePattern(expectedTone);
        
        // Provide tips based on the tone
        if (accuracy < 80) {
            switch(expectedTone) {
                case '1':
                    toneTips.textContent = 'Tip: Keep your pitch high and level throughout the syllable. Don\'t let it drop at the end.';
                    break;
                case '2':
                    toneTips.textContent = 'Tip: Start with a medium pitch and raise it smoothly to the end, like asking a question in English.';
                    break;
                case '3':
                    toneTips.textContent = 'Tip: Start medium, dip down low, then rise again. This tone has a distinctive dipping shape.';
                    break;
                case '4':
                    toneTips.textContent = 'Tip: Start high and drop your pitch sharply, like giving a command or expressing anger in English.';
                    break;
                default:
                    toneTips.textContent = 'Tip: Keep this tone short and light, with a neutral pitch. It should sound unstressed.';
            }
        } else {
            toneTips.textContent = 'Good job! Your pronunciation is on the right track.';
        }
    }
    
    // Enhanced function to draw the expected tone pattern with more accurate visualization
    function drawTonePattern(toneNumber, canvas = toneCanvas) {
        const canvasCtx = canvas.getContext('2d');
        canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
        
        const width = canvas.width;
        const height = canvas.height;
        const midY = height / 2;
        
        // Draw grid lines for better visualization
        canvasCtx.lineWidth = 1;
        canvasCtx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
        
        // Horizontal grid lines
        for (let y = height/4; y < height; y += height/4) {
            canvasCtx.beginPath();
            canvasCtx.moveTo(0, y);
            canvasCtx.lineTo(width, y);
            canvasCtx.stroke();
        }
        
        // Vertical grid lines
        for (let x = width/4; x < width; x += width/4) {
            canvasCtx.beginPath();
            canvasCtx.moveTo(x, 0);
            canvasCtx.lineTo(x, height);
            canvasCtx.stroke();
        }
        
        // Draw tone pattern
        canvasCtx.lineWidth = 3;
        canvasCtx.strokeStyle = 'rgb(229, 57, 53)';
        canvasCtx.beginPath();
        
        switch(toneNumber) {
            case '1': // 1st tone - high and level
                // Draw a high, level line
                canvasCtx.moveTo(0, height/4);
                canvasCtx.lineTo(width, height/4);
                break;
                
            case '2': // 2nd tone - rising
                // Draw a line that starts at mid-level and rises to high
                canvasCtx.moveTo(0, midY);
                canvasCtx.lineTo(width, height/4);
                break;
                
            case '3': // 3rd tone - falling then rising
                // Draw a curve that starts at mid-level, dips down, then rises
                canvasCtx.moveTo(0, midY);
                canvasCtx.bezierCurveTo(
                    width/3, height*0.75, // control point 1
                    width/2, height*0.75, // control point 2
                    width, height/3       // end point
                );
                break;
                
            case '4': // 4th tone - falling
                // Draw a line that starts high and falls sharply
                canvasCtx.moveTo(0, height/4);
                canvasCtx.lineTo(width, height*0.75);
                break;
                
            default: // neutral tone - light and short
                // Draw a short, mid-level line
                canvasCtx.moveTo(width*0.25, midY);
                canvasCtx.lineTo(width*0.75, midY);
        }
        
        canvasCtx.stroke();
        
        // Add pitch labels
        canvasCtx.font = '12px Arial';
        canvasCtx.fillStyle = '#333';
        canvasCtx.fillText('High', 5, height/4 + 15);
        canvasCtx.fillText('Mid', 5, midY + 15);
        canvasCtx.fillText('Low', 5, height*0.75 + 15);
        
        // Add time labels
        canvasCtx.fillText('Start', width*0.1, height - 5);
        canvasCtx.fillText('End', width*0.9, height - 5);
        
        // Add tone number and description
        canvasCtx.font = 'bold 14px Arial';
        let toneDesc = '';
        switch(toneNumber) {
            case '1': toneDesc = 'High and level'; break;
            case '2': toneDesc = 'Rising'; break;
            case '3': toneDesc = 'Falling then rising'; break;
            case '4': toneDesc = 'Falling'; break;
            default: toneDesc = 'Neutral (light and short)';
        }
        canvasCtx.fillText(`Tone ${toneNumber === '0' ? 'Neutral' : toneNumber}: ${toneDesc}`, width/2 - 100, 20);
    }
    
    // Set first buttons as active by default
    document.querySelector('.tone-btn[data-tone="1"]').classList.add('active');
    document.querySelector('.pair-btn[data-pair="1-3"]').classList.add('active');
    
    // Initialize quiz score
    let quizScore = 0;
    let quizStreak = 0;
    
    // Enhanced quiz functionality with scoring
    function checkQuizAnswer(selectedTone) {
        const correctTone = getToneNumber(quizCharacter.pinyin);
        const resultElement = document.getElementById('quiz-result');
        const scoreElement = document.getElementById('quiz-score');
        
        if (selectedTone === correctTone) {
            resultElement.textContent = 'Correct! 🎉';
            resultElement.className = 'correct';
            quizScore += 10;
            quizStreak++;
            
            // Bonus points for streaks
            if (quizStreak >= 3) {
                quizScore += 5;
                resultElement.textContent = `Correct! 🔥 Streak bonus! +${5 + 10} points`;
            }
        } else {
            resultElement.textContent = `Incorrect. The correct tone is ${correctTone === '0' ? 'Neutral' : correctTone}.`;
            resultElement.className = 'incorrect';
            quizStreak = 0;
        }
        
        // Update score display
        scoreElement.textContent = `Score: ${quizScore}`;
        
        // Play the correct pronunciation
        playToneSound(correctTone, quizCharacter.pinyin);
    }
    
    // Set up tone matching game
    const startGameButton = document.getElementById('start-game');
    if (startGameButton) {
        startGameButton.addEventListener('click', startToneMatchingGame);
    }
    
    // Variables for the tone matching game
    let gameCards = [];
    let flippedCards = [];
    let matchedPairs = 0;
    let gameTimer = null;
    let gameStartTime = 0;
    
    // Function to start the tone matching game
    function startToneMatchingGame() {
        // Reset game state
        flippedCards = [];
        matchedPairs = 0;
        
        // Clear the game board
        const gameBoard = document.querySelector('.game-board');
        gameBoard.innerHTML = '';
        
        // Reset timer display
        document.getElementById('game-timer').textContent = 'Time: 0s';
        document.getElementById('game-score').textContent = 'Matches: 0/8';
        
        // Create game cards
        gameCards = createGameCards();
        
        // Shuffle the cards
        shuffleArray(gameCards);
        
        // Add cards to the game board
        gameCards.forEach(card => {
            const cardElement = createCardElement(card);
            gameBoard.appendChild(cardElement);
        });
        
        // Start the timer
        gameStartTime = Date.now();
        if (gameTimer) clearInterval(gameTimer);
        gameTimer = setInterval(updateGameTimer, 1000);
    }
    
    // Function to create the game cards
    function createGameCards() {
        const cards = [];
        const tones = ['1', '2', '3', '4'];
        
        // Create two cards for each tone (8 cards total)
        tones.forEach(tone => {
            // Get characters with this tone
            let toneCharacters = [];
            
            // Collect all characters with this tone
            if (tone === '1') toneCharacters = characters.tone1;
            else if (tone === '2') toneCharacters = characters.tone2;
            else if (tone === '3') toneCharacters = characters.tone3;
            else if (tone === '4') toneCharacters = characters.tone4;
            else toneCharacters = characters.tone0;
            
            // If we have at least 2 characters with this tone, use them
            if (toneCharacters.length >= 2) {
                const char1 = toneCharacters[Math.floor(Math.random() * toneCharacters.length)];
                
                // Find a different character with the same tone
                let char2;
                do {
                    char2 = toneCharacters[Math.floor(Math.random() * toneCharacters.length)];
                } while (char2.character === char1.character);
                
                cards.push({
                    id: `card-${tone}-1`,
                    tone: tone,
                    character: char1.character,
                    pinyin: char1.pinyin
                });
                
                cards.push({
                    id: `card-${tone}-2`,
                    tone: tone,
                    character: char2.character,
                    pinyin: char2.pinyin
                });
            }
        });
        
        return cards;
    }
    
    // Function to create a card element
    function createCardElement(card) {
        const cardElement = document.createElement('div');
        cardElement.className = 'memory-card';
        cardElement.dataset.id = card.id;
        cardElement.dataset.tone = card.tone;
        
        // Create front of card (character)
        const cardFront = document.createElement('div');
        cardFront.className = 'card-front';
        
        const cardCharacter = document.createElement('div');
        cardCharacter.className = 'card-character';
        cardCharacter.textContent = card.character;
        
        const cardPinyin = document.createElement('div');
        cardPinyin.className = 'card-pinyin';
        cardPinyin.textContent = card.pinyin;
        
        cardFront.appendChild(cardCharacter);
        cardFront.appendChild(cardPinyin);
        
        // Create back of card
        const cardBack = document.createElement('div');
        cardBack.className = 'card-back';
        cardBack.textContent = '?';
        
        // Add front and back to card
        cardElement.appendChild(cardFront);
        cardElement.appendChild(cardBack);
        
        // Add click event
        cardElement.addEventListener('click', () => flipCard(cardElement));
        
        return cardElement;
    }
    
    // Function to flip a card
    function flipCard(cardElement) {
        // Don't allow flipping if already flipped or matched
        if (cardElement.classList.contains('flipped') || 
            cardElement.classList.contains('matched') ||
            flippedCards.length >= 2) {
            return;
        }
        
        // Flip the card
        cardElement.classList.add('flipped');
        flippedCards.push(cardElement);
        
        // Check for a match if we have two flipped cards
        if (flippedCards.length === 2) {
            setTimeout(checkForMatch, 1000);
        }
    }
    
    // Function to check for a match
    function checkForMatch() {
        const card1 = flippedCards[0];
        const card2 = flippedCards[1];
        
        if (card1.dataset.tone === card2.dataset.tone) {
            // We have a match!
            card1.classList.add('matched');
            card2.classList.add('matched');
            matchedPairs++;
            
            // Update score
            document.getElementById('game-score').textContent = `Matches: ${matchedPairs}/8`;
            
            // Play the tone sound
            const tone = card1.dataset.tone;
            const pinyin = card1.querySelector('.card-pinyin').textContent;
            playToneSound(tone, pinyin);
            
            // Check if game is complete
            if (matchedPairs === 8) {
                endGame();
            }
        } else {
            // No match, flip cards back
            card1.classList.remove('flipped');
            card2.classList.remove('flipped');
        }
        
        // Reset flipped cards
        flippedCards = [];
    }
    
    // Function to end the game
    function endGame() {
        clearInterval(gameTimer);
        const timeElapsed = Math.floor((Date.now() - gameStartTime) / 1000);
        
        setTimeout(() => {
            alert(`Congratulations! You matched all pairs in ${timeElapsed} seconds!`);
        }, 500);
    }
    
    // Function to update the game timer
    function updateGameTimer() {
        const timeElapsed = Math.floor((Date.now() - gameStartTime) / 1000);
        document.getElementById('game-timer').textContent = `Time: ${timeElapsed}s`;
    }
    
    // Function to shuffle an array (Fisher-Yates algorithm)
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
    
    // Set up interactive visualizer
    const interactiveCanvas = document.getElementById('interactive-canvas');
    if (interactiveCanvas) {
        // Set up tone buttons
        document.querySelectorAll('.visualizer-tone-btn').forEach(button => {
            button.addEventListener('click', function() {
                // Remove active class from all buttons
                document.querySelectorAll('.visualizer-tone-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
                
                // Add active class to clicked button
                this.classList.add('active');
                
                // Draw the selected tone pattern
                const tone = this.getAttribute('data-tone');
                drawTonePattern(tone, interactiveCanvas);
                
                // Store the current tone
                interactiveCanvas.dataset.currentTone = tone;
            });
        });
        
        // Set up play visualizer button
        const playVisualizer = document.getElementById('play-visualizer');
        if (playVisualizer) {
            playVisualizer.addEventListener('click', function() {
                const tone = interactiveCanvas.dataset.currentTone || '1';
                const examplePinyin = tone === '0' ? 'ma' : 
                                    tone === '1' ? 'mā' : 
                                    tone === '2' ? 'má' : 
                                    tone === '3' ? 'mǎ' : 'mà';
                playToneSound(tone, examplePinyin);
            });
        }
        
        // Set up draw visualizer button
        const drawVisualizer = document.getElementById('draw-visualizer');
        if (drawVisualizer) {
            drawVisualizer.addEventListener('click', function() {
                enableDrawMode(interactiveCanvas);
            });
        }
        
        // Set up reset visualizer button
        const resetVisualizer = document.getElementById('reset-visualizer');
        if (resetVisualizer) {
            resetVisualizer.addEventListener('click', function() {
                const tone = interactiveCanvas.dataset.currentTone || '1';
                drawTonePattern(tone, interactiveCanvas);
                disableDrawMode(interactiveCanvas);
            });
        }
        
        // Initialize with first tone
        drawTonePattern('1', interactiveCanvas);
        interactiveCanvas.dataset.currentTone = '1';
    }
    
    // Variables for the interactive visualizer
    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;
    
    // Function to enable draw mode on the canvas
    function enableDrawMode(canvas) {
        const ctx = canvas.getContext('2d');
        
        // Clear the canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw grid lines
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
        
        // Horizontal grid lines
        for (let y = canvas.height/4; y < canvas.height; y += canvas.height/4) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }
        
        // Vertical grid lines
        for (let x = canvas.width/4; x < canvas.width; x += canvas.width/4) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }
        
        // Add instructions
        ctx.font = 'bold 14px Arial';
        ctx.fillStyle = '#333';
        ctx.fillText('Draw your own tone pattern!', canvas.width/2 - 100, 20);
        
        // Add event listeners for drawing
        canvas.addEventListener('mousedown', startDrawing);
        canvas.addEventListener('mousemove', draw);
        canvas.addEventListener('mouseup', stopDrawing);
        canvas.addEventListener('mouseout', stopDrawing);
        
        // Add touch support
        canvas.addEventListener('touchstart', handleTouch);
        canvas.addEventListener('touchmove', handleTouch);
        canvas.addEventListener('touchend', stopDrawing);
        
        // Set canvas as in drawing mode
        canvas.dataset.drawMode = 'true';
    }
    
    // Function to disable draw mode
    function disableDrawMode(canvas) {
        // Remove event listeners
        canvas.removeEventListener('mousedown', startDrawing);
        canvas.removeEventListener('mousemove', draw);
        canvas.removeEventListener('mouseup', stopDrawing);
        canvas.removeEventListener('mouseout', stopDrawing);
        
        // Remove touch listeners
        canvas.removeEventListener('touchstart', handleTouch);
        canvas.removeEventListener('touchmove', handleTouch);
        canvas.removeEventListener('touchend', stopDrawing);
        
        // Set canvas as not in drawing mode
        canvas.dataset.drawMode = 'false';
    }
    
    // Function to start drawing
    function startDrawing(e) {
        isDrawing = true;
        
        const canvas = e.target;
        const rect = canvas.getBoundingClientRect();
        lastX = e.clientX - rect.left;
        lastY = e.clientY - rect.top;
    }
    
    // Function to handle touch events
    function handleTouch(e) {
        e.preventDefault();
        
        if (e.type === 'touchstart') {
            isDrawing = true;
            
            const canvas = e.target;
            const rect = canvas.getBoundingClientRect();
            lastX = e.touches[0].clientX - rect.left;
            lastY = e.touches[0].clientY - rect.top;
        } else if (e.type === 'touchmove' && isDrawing) {
            const canvas = e.target;
            const rect = canvas.getBoundingClientRect();
            const x = e.touches[0].clientX - rect.left;
            const y = e.touches[0].clientY - rect.top;
            
            const ctx = canvas.getContext('2d');
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.strokeStyle = 'rgb(229, 57, 53)';
            
            ctx.beginPath();
            ctx.moveTo(lastX, lastY);
            ctx.lineTo(x, y);
            ctx.stroke();
            
            lastX = x;
            lastY = y;
        }
    }
    
    // Function to draw
    function draw(e) {
        if (!isDrawing) return;
        
        const canvas = e.target;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const ctx = canvas.getContext('2d');
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.strokeStyle = 'rgb(229, 57, 53)';
        
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(x, y);
        ctx.stroke();
        
        lastX = x;
        lastY = y;
    }
    
    // Function to stop drawing
    function stopDrawing() {
        isDrawing = false;
    }
});
