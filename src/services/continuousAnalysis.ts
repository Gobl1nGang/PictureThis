import { analyzeImage, AnalyzeImageOptions, CameraAdjustments } from './bedrock';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { parseAIResponse } from './aiCameraControl';

export class ContinuousAnalysisService {
    private isRunning = false;
    private intervalId: NodeJS.Timeout | null = null;
    private lastAnalysisTime = 0;
    private readonly ANALYSIS_INTERVAL = 3000; // 3 seconds
    private readonly MIN_INTERVAL = 2000; // Minimum 2 seconds between analyses

    constructor(
        private cameraRef: React.RefObject<any>,
        private onFeedback: (feedback: string, score: number, cameraAdjustments?: CameraAdjustments) => void,
        private options: AnalyzeImageOptions = {}
    ) { }

    start() {
        if (this.isRunning) return;

        this.isRunning = true;
        this.scheduleNextAnalysis();
    }

    stop() {
        this.isRunning = false;
        if (this.intervalId) {
            clearTimeout(this.intervalId);
            this.intervalId = null;
        }
    }

    updateOptions(newOptions: AnalyzeImageOptions) {
        this.options = { ...this.options, ...newOptions };
    }

    private scheduleNextAnalysis() {
        if (!this.isRunning) return;

        const now = Date.now();
        const timeSinceLastAnalysis = now - this.lastAnalysisTime;
        const delay = Math.max(0, this.MIN_INTERVAL - timeSinceLastAnalysis);

        this.intervalId = setTimeout(() => {
            this.performAnalysis();
        }, delay);
    }

    private async performAnalysis() {
        if (!this.isRunning || !this.cameraRef.current) {
            this.scheduleNextAnalysis();
            return;
        }

        try {
            this.lastAnalysisTime = Date.now();

            const photo = await this.cameraRef.current.takePictureAsync({
                quality: 0.3,
                skipProcessing: true,
            });

            if (photo?.uri) {
                const manipResult = await manipulateAsync(
                    photo.uri,
                    [{ resize: { width: 480 } }],
                    { compress: 0.5, format: SaveFormat.JPEG, base64: true }
                );

                if (manipResult.base64) {
                    const rawAdvice = await analyzeImage(manipResult.base64, this.options);

                    const { feedback, score, cameraAdjustments } = parseAIResponse(rawAdvice);
                    this.onFeedback(feedback, score, cameraAdjustments);
                }
            }
        } catch (error) {
            console.log('Continuous analysis error:', error);
        }

        this.scheduleNextAnalysis();
    }
}