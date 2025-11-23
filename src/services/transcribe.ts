// @ts-ignore
import { GOOGLE_SPEECH_API_KEY } from "@env";

export const transcribeAudio = async (audioUri: string): Promise<string> => {
    try {
        console.log('🎤 Attempting speech transcription...');
        
        // Read the audio file as array buffer directly
        const response = await fetch(audioUri);
        const audioBuffer = await response.arrayBuffer();
        
        // Optimize base64 conversion
        const uint8Array = new Uint8Array(audioBuffer);
        const audioBase64 = btoa(String.fromCharCode(...uint8Array));

        // Add 2-second timeout to Google API call
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);

        try {
            const speechResponse = await fetch(`https://speech.googleapis.com/v1/speech:recognize?key=${GOOGLE_SPEECH_API_KEY}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    config: {
                        encoding: 'WEBM_OPUS',
                        sampleRateHertz: 48000,
                        languageCode: 'en-US',
                        model: 'latest_short',
                        useEnhanced: true
                    },
                    audio: {
                        content: audioBase64,
                    },
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (speechResponse.ok) {
                const result = await speechResponse.json();
                const transcript = result.results?.[0]?.alternatives?.[0]?.transcript;
                
                if (transcript && transcript.trim()) {
                    console.log('✅ Speech transcribed:', transcript);
                    return transcript;
                }
            }
        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                console.log('⏱️ Speech API timeout - using default');
            }
        }

        console.log('🔄 Using default photography question');
        return "What can I improve about this photo?";
        
    } catch (error) {
        console.log('🔄 Using default photography question');
        return "What can I improve about this photo?";
    }
};