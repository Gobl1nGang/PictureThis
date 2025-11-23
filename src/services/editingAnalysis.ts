import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

const client = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || 'us-west-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function analyzePhotoForEditing(base64Image: string): Promise<string> {
  const prompt = `You are a professional photo editor and digital retoucher. A user has taken a photo in the mobile app, and you must analyze the image and recommend edits that could improve its visual quality. Do NOT give photography tips or shooting advice — only editing and post-processing changes.

### INPUT:
- The photo provided by the user

### YOUR TASK:
Analyze the image and output:

1. A short description of the image style (e.g. "warm portrait", "dark landscape", "city architecture shot", etc.)

2. Specific editing adjustments (with suggested intensity ranges), such as:
   - Exposure
   - Contrast
   - Highlights
   - Shadows
   - Whites / Blacks
   - Sharpness
   - Vibrance
   - Saturation
   - Temperature (warm/cool)
   - Tint
   - Clarity / Texture
   - Vignette
   - Noise reduction
   - Color grading suggestions

3. Automatically recommend **one preset/filter vibe** if it fits:
   - Film look
   - Moody
   - Vibrant
   - Clean and bright
   - Dramatic shadows
   - Pastel
   - High contrast black & white
   - Cinematic teal/orange
   - Aesthetic lifestyle

Keep recommendations concise and actionable.`;

  const payload = {
    modelId: 'us.meta.llama3-2-11b-instruct-v1:0',
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify({
      prompt,
      images: [base64Image],
      max_gen_len: 1000,
      temperature: 0.3,
      top_p: 0.9,
    }),
  };

  try {
    const command = new InvokeModelCommand(payload);
    const response = await client.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    return responseBody.generation || 'Unable to analyze photo for editing suggestions.';
  } catch (error) {
    console.error('Error analyzing photo for editing:', error);
    return 'Error analyzing photo. Please try again.';
  }
}