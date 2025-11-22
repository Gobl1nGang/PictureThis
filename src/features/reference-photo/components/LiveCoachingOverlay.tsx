import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ReferenceAnalysis, CoachingTip, MatchScore } from '../types';
import { calculateMatchScore, generateCoachingTips } from '../services/analysisService';

interface Props {
  referenceAnalysis: ReferenceAnalysis;
  currentFrame?: any; // Camera frame data
}

export const LiveCoachingOverlay: React.FC<Props> = ({ referenceAnalysis, currentFrame }) => {
  const [matchScore, setMatchScore] = useState<MatchScore>({ overall: 0, composition: 0, lighting: 0, style: 0 });
  const [coachingTips, setCoachingTips] = useState<CoachingTip[]>([]);

  useEffect(() => {
    // Simulate real-time analysis
    const interval = setInterval(() => {
      const newScore = calculateMatchScore(currentFrame, referenceAnalysis);
      const newTips = generateCoachingTips(currentFrame, referenceAnalysis);
      
      setMatchScore(newScore);
      setCoachingTips(newTips);
    }, 2000);

    return () => clearInterval(interval);
  }, [currentFrame, referenceAnalysis]);

  const getScoreColor = (score: number) => {
    if (score > 80) return '#4CD964';
    if (score > 50) return '#FFCC00';
    return '#FF3B30';
  };

  return (
    <View style={styles.overlay}>
      {/* Match Score */}
      <View style={styles.scoreContainer}>
        <Text style={styles.scoreLabel}>MATCH SCORE</Text>
        <Text style={[styles.scoreValue, { color: getScoreColor(matchScore.overall) }]}>
          {matchScore.overall}
        </Text>
      </View>

      {/* Coaching Tips */}
      <View style={styles.tipsContainer}>
        {coachingTips.map((tip, index) => (
          <View key={index} style={[styles.tipBubble, getTipStyle(tip.priority)]}>
            <Text style={styles.tipText}>{tip.message}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const getTipStyle = (priority: 'high' | 'medium' | 'low') => {
  switch (priority) {
    case 'high':
      return { backgroundColor: 'rgba(255, 59, 48, 0.8)' };
    case 'medium':
      return { backgroundColor: 'rgba(255, 204, 0, 0.8)' };
    case 'low':
      return { backgroundColor: 'rgba(0, 0, 0, 0.6)' };
  }
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  scoreContainer: {
    position: 'absolute',
    top: 60,
    right: 20,
    alignItems: 'flex-end',
  },
  scoreLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
    fontWeight: 'bold',
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: '900',
  },
  tipsContainer: {
    position: 'absolute',
    top: 120,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  tipBubble: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  tipText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});