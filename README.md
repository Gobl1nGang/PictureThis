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

### Prerequisites
*   **Node.js** (v18+)
*   **npm** or **yarn**
*   **CocoaPods** (for iOS native modules)
*   **Xcode** (for iOS build)
*   **Expo CLI**: `npm install -g expo-cli`

### Installation

1.  **Clone the repository**:
    ```bash
    git clone <repository-url>
    cd PictureThis
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Install iOS Pods** (Required for native modules like Skia):
    ```bash
    cd ios
    pod install
    cd ..
    ```

### Configuration

1.  Create a `.env` file in the root directory with your API keys:
    ```bash
    AWS_ACCESS_KEY_ID=your_aws_key
    AWS_SECRET_ACCESS_KEY=your_aws_secret
    AWS_REGION=us-west-2
    PEXELS_API_KEY=your_pexels_key
    ```
    *   **AWS Bedrock**: Ensure your AWS user has access to the `us.amazon.nova-lite-v1:0` model.
    *   **Pexels**: Get your API key from [Pexels API](https://www.pexels.com/api/).

### Running the App

This app uses **Development Builds** (not Expo Go) due to native dependencies like `@shopify/react-native-skia`.

#### iOS (Physical Device)
1.  Connect your iPhone to your Mac.
2.  Open `ios/PictureThis.xcworkspace` in Xcode.
3.  Select your **Team** in the "Signing & Capabilities" tab for the `PictureThis` target.
4.  Run the build command:
    ```bash
    npx expo run:ios --device

    choose the device you want to run the app on from the list using the up and down arrows and press enter

    ````bash
    if you do not wish to open developer options on your phone, you can use the following command:

    npx expo run:ios

    choose the device type/version you want to run the app on from the list using the up and down arrows and press enter

    ```

    ```
5.  Once installed, if you see "Untrusted Developer", go to **Settings > General > VPN & Device Management** on your iPhone and trust your certificate.

#### iOS (Simulator)
```bash
npx expo run:ios
```

#### Android
```bash
npx expo run:android
``` 

### Troubleshooting

*   **"No development servers found"**:
    *   Ensure your phone and computer are on the same Wi-Fi.
    *   Try connecting via tunnel: `npx expo start --dev-client --tunnel`
*   **Build Errors**:
    *   Try cleaning the build: `cd ios && rm -rf build Pods Podfile.lock && pod install && cd ..`