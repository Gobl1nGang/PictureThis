# PictureThis 📸

An AI-powered camera coach that helps you take better photos in real-time.

## Features

*   **Real-time AI Feedback**: Gets instant advice on composition, lighting, and framing.
*   **Pro Score**: Live 0-100 rating of your current shot.
*   **Smart Guidance**: Specific, directional instructions (e.g., "Light face from top-left", "Step back").
*   **Style Matching**: Input a style (e.g., "Cinematic", "Minimalist") to get tailored advice.
*   **Privacy Focused**: Analyzes technical aspects only; treats all subjects as models.

## Tech Stack

*   **Frontend**: React Native (Expo)
*   **AI**: AWS Bedrock (Llama 3.2 11B Vision)
*   **Language**: TypeScript

## Setup

1.  Clone the repo.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Create a `.env` file with your credentials:
    ```
    AWS_ACCESS_KEY_ID=your_aws_key
    AWS_SECRET_ACCESS_KEY=your_aws_secret
    AWS_REGION=us-west-2
    PEXELS_API_KEY=your_pexels_key
    GOOGLE_MAPS_API_KEY=your_google_maps_key
    ```
    Get your Pexels API key from: https://www.pexels.com/api/
4.  Run the app:
    ```bash
    npx expo start
    ```