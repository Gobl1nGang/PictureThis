import * as FileSystem from 'expo-file-system';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { Share, Alert } from 'react-native';

export interface SocialPlatform {
    id: string;
    name: string;
    icon: string;
    aspectRatio?: number;
    maxSize?: { width: number; height: number };
    recommendedHashtags?: string[];
}

export const SOCIAL_PLATFORMS: SocialPlatform[] = [
    {
        id: 'instagram',
        name: 'Instagram',
        icon: 'logo-instagram',
        aspectRatio: 1, // Square
        maxSize: { width: 1080, height: 1080 },
        recommendedHashtags: ['#photography', '#photooftheday', '#picturethis', '#mobilephotography'],
    },
    {
        id: 'instagram-story',
        name: 'Instagram Story',
        icon: 'logo-instagram',
        aspectRatio: 9/16, // Vertical
        maxSize: { width: 1080, height: 1920 },
        recommendedHashtags: ['#instastory', '#photography'],
    },
    {
        id: 'twitter',
        name: 'Twitter',
        icon: 'logo-twitter',
        maxSize: { width: 1200, height: 675 },
        recommendedHashtags: ['#photography', '#picturethis'],
    },
    {
        id: 'facebook',
        name: 'Facebook',
        icon: 'logo-facebook',
        maxSize: { width: 1200, height: 630 },
        recommendedHashtags: ['#photography', '#mobilephotography'],
    },
    {
        id: 'tiktok',
        name: 'TikTok',
        icon: 'logo-tiktok',
        aspectRatio: 9/16,
        maxSize: { width: 1080, height: 1920 },
        recommendedHashtags: ['#photography', '#phototips', '#picturethis'],
    },
];

export interface ShareOptions {
    platform: string;
    caption?: string;
    hashtags?: string[];
    includeWatermark?: boolean;
    customAspectRatio?: number;
}

export class SocialSharingService {
    
    /**
     * Prepare image for specific social platform
     */
    static async prepareForPlatform(
        imageUri: string, 
        platformId: string,
        options: ShareOptions = {}
    ): Promise<string> {
        const platform = SOCIAL_PLATFORMS.find(p => p.id === platformId);
        if (!platform) {
            throw new Error(`Platform ${platformId} not supported`);
        }

        const operations: any[] = [];

        // Apply aspect ratio if specified
        const targetAspectRatio = options.customAspectRatio || platform.aspectRatio;
        if (targetAspectRatio) {
            // Calculate crop dimensions based on aspect ratio
            operations.push({
                crop: {
                    originX: 0,
                    originY: 0,
                    width: 1000, // Will be adjusted based on actual image
                    height: Math.round(1000 / targetAspectRatio),
                }
            });
        }

        // Resize to platform's maximum size
        if (platform.maxSize) {
            operations.push({
                resize: platform.maxSize
            });
        }

        // Add watermark if requested
        if (options.includeWatermark) {
            // Note: Watermark would require additional implementation
            // For now, we'll just add a comment
            console.log('Watermark requested - would add PictureThis branding');
        }

        if (operations.length === 0) {
            return imageUri;
        }

        const result = await manipulateAsync(
            imageUri,
            operations,
            { compress: 0.9, format: SaveFormat.JPEG }
        );

        return result.uri;
    }

    /**
     * Share image to platform
     */
    static async shareToSocial(
        imageUri: string,
        options: ShareOptions
    ): Promise<boolean> {
        try {
            // Prepare image for the platform
            const preparedImageUri = await this.prepareForPlatform(
                imageUri, 
                options.platform, 
                options
            );

            // Generate caption with hashtags
            const caption = this.generateCaption(options);

            // Share the image using React Native Share
            await Share.share({
                url: preparedImageUri,
                message: caption,
                title: `Share to ${options.platform}`,
            });

            return true;
        } catch (error) {
            console.error('Sharing error:', error);
            Alert.alert('Error', 'Failed to share image');
            return false;
        }
    }

    /**
     * Generate caption with hashtags
     */
    private static generateCaption(options: ShareOptions): string {
        let caption = options.caption || '';
        
        if (options.hashtags && options.hashtags.length > 0) {
            const hashtagString = options.hashtags.map(tag => 
                tag.startsWith('#') ? tag : `#${tag}`
            ).join(' ');
            
            caption = caption ? `${caption}\n\n${hashtagString}` : hashtagString;
        }

        return caption;
    }

    /**
     * Get recommended hashtags for a platform
     */
    static getRecommendedHashtags(platformId: string): string[] {
        const platform = SOCIAL_PLATFORMS.find(p => p.id === platformId);
        return platform?.recommendedHashtags || [];
    }

    /**
     * Create multiple versions for different platforms
     */
    static async createMultiPlatformVersions(
        imageUri: string,
        platforms: string[] = ['instagram', 'twitter', 'instagram-story']
    ): Promise<{ [platformId: string]: string }> {
        const versions: { [platformId: string]: string } = {};

        for (const platformId of platforms) {
            try {
                const preparedUri = await this.prepareForPlatform(imageUri, platformId);
                versions[platformId] = preparedUri;
            } catch (error) {
                console.error(`Failed to prepare for ${platformId}:`, error);
                versions[platformId] = imageUri; // Fallback to original
            }
        }

        return versions;
    }

    /**
     * Save image with social media optimizations
     */
    static async saveOptimizedVersion(
        imageUri: string,
        platformId: string,
        filename?: string
    ): Promise<string> {
        const preparedUri = await this.prepareForPlatform(imageUri, platformId);
        
        const finalFilename = filename || `picturethis_${platformId}_${Date.now()}.jpg`;
        const documentDirectory = FileSystem.documentDirectory;
        const finalUri = `${documentDirectory}${finalFilename}`;

        await FileSystem.copyAsync({
            from: preparedUri,
            to: finalUri,
        });

        return finalUri;
    }

    /**
     * Generate sharing analytics data
     */
    static generateSharingMetadata(options: ShareOptions) {
        return {
            platform: options.platform,
            timestamp: Date.now(),
            hasCaption: !!options.caption,
            hashtagCount: options.hashtags?.length || 0,
            includesWatermark: options.includeWatermark || false,
        };
    }
}