// @ts-ignore
import { GOOGLE_SPEECH_API_KEY } from "@env";

export const transcribeAudio = async (audioUri: string): Promise<string> => {
    try {
        console.log('🎤 Attempting speech transcription...');
        
        // Read the audio file as array buffer directly
        const response = await fetch(audioUri);
        const audioBuffer = await response.arrayBuffer();
        
        // Convert to base64
        const uint8Array = new Uint8Array(audioBuffer);
        let binaryString = '';
        const chunkSize = 8192;
        
        for (let i = 0; i < uint8Array.length; i += chunkSize) {
            const chunk = uint8Array.slice(i, i + chunkSize);
            binaryString += String.fromCharCode(...chunk);
        }
        
        const audioBase64 = btoa(binaryString);

        // Try Google Speech API
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
                },
                audio: {
                    content: audioBase64,
                },
            }),
        });

        if (speechResponse.ok) {
            const result = await speechResponse.json();
            const transcript = result.results?.[0]?.alternatives?.[0]?.transcript;
            
            if (transcript && transcript.trim()) {
                console.log('✅ Speech transcribed:', transcript);
                return transcript;
            }
        }

        // If Google API fails, silently fall back to default
        console.log('🔄 Speech transcription unavailable, using default question');
        return "What can I improve about this photo?";
        
    } catch (error) {
        // Silent fallback - don't log errors to avoid console spam
        console.log('🔄 Using default photography question');
        return "What can I improve about this photo?";
    }
};