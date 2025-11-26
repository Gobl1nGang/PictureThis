import { CameraAdjustments } from './bedrock';

export const parseAIResponse = (response: string): { feedback: string; score: number; cameraAdjustments?: CameraAdjustments } => {
    console.log('🔍 Raw AI Response:', response);

    const scoreMatch = response.match(/Score:\s*(\d+)/i);
    const score = scoreMatch ? parseInt(scoreMatch[1], 10) : 0;

    const feedbackMatch = response.match(/Feedback:\s*([\s\S]*?)(?=CAMERA_ADJUST:|$)/i);
    const feedback = feedbackMatch ? feedbackMatch[1].trim() : response;

    // Use a greedy match to capture the full JSON object, including nested braces
    const cameraMatch = response.match(/CAMERA_ADJUST:\s*(\{[\s\S]*\})/i);
    let cameraAdjustments: CameraAdjustments | undefined;

    if (cameraMatch) {
        console.log('📱 Found camera adjustments:', cameraMatch[1]);
        try {
            cameraAdjustments = JSON.parse(cameraMatch[1]);
            console.log('✅ Parsed camera adjustments:', cameraAdjustments);
        } catch (error) {
            console.log('❌ Failed to parse JSON:', cameraMatch[1]);
            console.log('Error details:', error);
            cameraAdjustments = undefined; // Don't apply random adjustments on error
        }
    } else {
        console.log('❌ No camera adjustments found');
        cameraAdjustments = generateDefault();
    }

    return { feedback, score, cameraAdjustments };
};

function generateDefault(): CameraAdjustments {
    const adj: CameraAdjustments = {
        zoom: 0,
        focusPoint: { x: 0.5, y: 0.5 },
        flash: 'off',
        exposureCompensation: 0
    };
    console.log('⚠️ Using neutral default adjustments');
    return adj;
}