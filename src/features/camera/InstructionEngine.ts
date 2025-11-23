import { AIInstruction, AIFeedback } from '../../types';

class InstructionEngine {
    /**
     * Parse raw AI feedback text into structured instructions
     */
    parseInstructions(rawFeedback: string, score: number): AIFeedback {
        const instructions: AIInstruction[] = [];
        let stepCounter = 1;

        // Check if it's a perfect shot
        const isPerfect = score >= 90 || rawFeedback.toUpperCase().includes('PERFECT SHOT');

        if (isPerfect) {
            return {
                score,
                instructions: [{
                    id: `inst_${Date.now()}`,
                    step: 1,
                    totalSteps: 1,
                    text: 'PERFECT SHOT! Take the picture now!',
                    category: 'timing',
                    priority: 'high',
                }],
                perfectShot: true,
                timestamp: Date.now(),
            };
        }

        // Extract individual feedback items
        const feedbackItems = this.extractFeedbackItems(rawFeedback);

        feedbackItems.forEach((item, index) => {
            const instruction = this.createInstructionFromText(item, stepCounter, feedbackItems.length);
            if (instruction) {
                instructions.push(instruction);
                stepCounter++;
            }
        });

        return {
            score,
            instructions: instructions.length > 0 ? instructions : this.getDefaultInstructions(),
            perfectShot: false,
            timestamp: Date.now(),
        };
    }

    /**
     * Extract individual feedback items from raw text
     */
    private extractFeedbackItems(text: string): string[] {
        // Remove "Feedback:" prefix if present
        let cleanText = text.replace(/^Feedback:\s*/i, '');

        // Split by common delimiters
        const items = cleanText
            .split(/[.!]\s+/)
            .map(s => s.trim())
            .filter(s => s.length > 5 && !s.match(/^Score:/i));

        return items.slice(0, 3); // Max 3 instructions at a time
    }

    /**
     * Create a structured instruction from text
     */
    private createInstructionFromText(
        text: string,
        step: number,
        totalSteps: number
    ): AIInstruction | null {
        if (!text) return null;

        const category = this.categorizeInstruction(text);
        const priority = step === 1 ? 'high' : step === 2 ? 'medium' : 'low';

        return {
            id: `inst_${Date.now()}_${step}`,
            step,
            totalSteps,
            text: this.formatInstructionText(text),
            category,
            priority,
            visualAid: this.generateVisualAid(text, category),
        };
    }

    /**
     * Categorize instruction based on keywords
     */
    private categorizeInstruction(text: string): AIInstruction['category'] {
        const lower = text.toLowerCase();

        if (lower.match(/move|step|position|closer|further|left|right|up|down|angle/)) {
            return 'positioning';
        } else if (lower.match(/light|lighting|bright|dark|shadow|exposure|flash/)) {
            return 'lighting';
        } else if (lower.match(/frame|crop|rule of thirds|golden ratio|center|composition/)) {
            return 'composition';
        } else if (lower.match(/focus|zoom|aperture|shutter|iso|settings/)) {
            return 'settings';
        } else if (lower.match(/wait|timing|moment|when|ready/)) {
            return 'timing';
        }

        return 'composition';
    }

    /**
     * Format instruction text to be more actionable
     */
    private formatInstructionText(text: string): string {
        // Capitalize first letter
        let formatted = text.charAt(0).toUpperCase() + text.slice(1);

        // Ensure it ends with proper punctuation
        if (!formatted.match(/[.!?]$/)) {
            formatted += '.';
        }

        return formatted;
    }

    /**
     * Generate visual aid data for instruction
     */
    private generateVisualAid(
        text: string,
        category: AIInstruction['category']
    ): AIInstruction['visualAid'] {
        const lower = text.toLowerCase();

        // Detect directional movements
        if (lower.includes('left')) {
            return { type: 'arrow', data: { direction: 'left' } };
        } else if (lower.includes('right')) {
            return { type: 'arrow', data: { direction: 'right' } };
        } else if (lower.includes('up') || lower.includes('higher')) {
            return { type: 'arrow', data: { direction: 'up' } };
        } else if (lower.includes('down') || lower.includes('lower')) {
            return { type: 'arrow', data: { direction: 'down' } };
        }

        // Grid for composition
        if (category === 'composition' && lower.match(/rule of thirds|golden ratio/)) {
            return { type: 'grid', data: { type: 'thirds' } };
        }

        return undefined;
    }

    /**
     * Get default instructions when parsing fails
     */
    private getDefaultInstructions(): AIInstruction[] {
        return [{
            id: `inst_${Date.now()}`,
            step: 1,
            totalSteps: 1,
            text: 'Hold steady and compose your shot.',
            category: 'composition',
            priority: 'medium',
        }];
    }

    /**
     * Get the next instruction to show
     */
    getNextInstruction(feedback: AIFeedback, currentStep: number): AIInstruction | null {
        if (currentStep >= feedback.instructions.length) {
            return null;
        }
        return feedback.instructions[currentStep];
    }

    /**
     * Get priority instruction (highest priority that hasn't been completed)
     */
    getPriorityInstruction(feedback: AIFeedback): AIInstruction {
        const highPriority = feedback.instructions.find((i: AIInstruction) => i.priority === 'high');
        if (highPriority) return highPriority;

        const mediumPriority = feedback.instructions.find((i: AIInstruction) => i.priority === 'medium');
        if (mediumPriority) return mediumPriority;

        return feedback.instructions[0];
    }
}

export default new InstructionEngine();
