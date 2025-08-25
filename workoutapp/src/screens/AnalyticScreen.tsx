import React, { useMemo, useState, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  useWindowDimensions,
  TouchableOpacity,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';
import { colors, typography } from '../theme';
import WideButton from '../components/WideButton';
import { useAnalytics } from '../context/AnalyticsContext';
import { AnalyticsPeriod } from '../api/analytics';
import { LineChart } from 'react-native-gifted-charts';
import Feather from '@expo/vector-icons/build/Feather';

type Props = NativeStackScreenProps<RootStackParamList, 'Analytics'>;

export default function AnalyticScreen({}: Props) {
  const navigation = useNavigation();
  const { width: screenWidth } = useWindowDimensions();
  const [period, setPeriod] = useState<AnalyticsPeriod>('7d');
  const { getCachedData, ensureDataLoaded } = useAnalytics();

  const analyticsData = getCachedData(period);
  
  useEffect(() => {
    const t = setTimeout(() => {
      ensureDataLoaded(period);
    }, 50);
    return () => clearTimeout(t);
  }, [period, ensureDataLoaded]);

  // Fallback values for loading/error states
  const metrics = useMemo(() => {
    if (analyticsData.data) {
      return analyticsData.data;
    }
    return {
      totalSessionTime: '—',
      averageSessionLength: '—',
      current: {
        maxHang: '—',
        maxPullup: '—',
        maxWeight: '—',
      },
    };
  }, [analyticsData.data]);

  const chartData = useMemo(() => {
    if (analyticsData.data?.chartData) {
      const { hangData, pullupData, weightData } = analyticsData.data.chartData;
      
      const normalizeData = (data: Array<{ value: number }>) => {
        if (!data || data.length === 0) {
          return [{ value: 0 }];
        }
        
        return data.map(item => ({
          value: Number(item.value) || 0
        }));
      };
      
      return {
        hangData: normalizeData(hangData),
        pullupData: normalizeData(pullupData),
        weightData: normalizeData(weightData)
      };
    }
    
    return {
      hangData: [{ value: 0 }],
      pullupData: [{ value: 0 }],
      weightData: [{ value: 0 }]
    };
  }, [analyticsData.data?.chartData]);

  // Compute responsive chart width and spacing so N points fit without overflow
  // Inner width = screenWidth - (content 32) - (card 32) - (graph paddingRight 8)
  const chartWidth = useMemo(() => Math.max(240, screenWidth - 72), [screenWidth]);
  const INITIAL_SPACING = period === '30d' ? 20 : 10;
  const END_SPACING = 4;
  // Reserve space for y-axis labels used by the chart so points fit exactly
  const Y_AXIS_LABEL_W = 36;
  const pointCount = Math.max(
    chartData.hangData.length,
    chartData.pullupData.length,
    chartData.weightData.length
  );
  // Compute spacing per-segment so plotted points fill the available plot area nicely
  const spacing = useMemo(() => {
    if (pointCount <= 1) return 0;
    const segments = Math.max(1, pointCount - 1);
    // Subtract y-axis label width so we fit within the actual plot area
    const plotWidth = Math.max(80, chartWidth - Y_AXIS_LABEL_W);

    // Raw spacing if we divide the usable plot width evenly across segments
    const usable = Math.max(24, plotWidth - (INITIAL_SPACING + END_SPACING));
    const raw = Math.floor(usable / segments);

    const minSpacing = 4;
    const maxSpacing = Math.max(24, Math.floor(plotWidth / Math.min(3, segments)));

    const s = Math.max(minSpacing, Math.min(raw, maxSpacing));
    return s;
  }, [chartWidth, pointCount, INITIAL_SPACING, END_SPACING]);

  // Compute an initial spacing (left offset) that centers the plotted points within the plot area
  const dynamicInitialSpacing = useMemo(() => {
    if (pointCount <= 1) return INITIAL_SPACING;
    const segments = Math.max(1, pointCount - 1);
    const plotWidth = Math.max(80, chartWidth - Y_AXIS_LABEL_W);
    const usedBySegments = segments * spacing;
    // Remaining horizontal space after placing segments and end spacing
    const leftover = Math.max(0, plotWidth - (usedBySegments + END_SPACING));
    // Place half of leftover as initial spacing to roughly center points
    return Math.max(4, Math.floor(leftover / 2));
  }, [chartWidth, pointCount, spacing, END_SPACING, INITIAL_SPACING]);

  // Add headroom so the plotted lines sit a bit lower inside the chart area
  const maxChartValue = useMemo(() => {
    const allValues = [
      ...chartData.hangData.map(d => d.value),
      ...chartData.pullupData.map(d => d.value),
      ...chartData.weightData.map(d => d.value),
    ];
    const currentMax = Math.max(...allValues, 0);
    // 5% headroom; ensure positive max to avoid rendering issues when all zero
    return currentMax > 0 ? Math.ceil(currentMax * 1.05) : 1;
  }, [chartData]);

  // chart re-mount
  const chartKey = useMemo(() => {
    const lastHang = chartData.hangData?.[chartData.hangData.length - 1]?.value ?? 0;
    const lastPull = chartData.pullupData?.[chartData.pullupData.length - 1]?.value ?? 0;
    const lastWeight = chartData.weightData?.[chartData.weightData.length - 1]?.value ?? 0;
    return `${period}-${chartData.hangData.length}-${chartData.pullupData.length}-${chartData.weightData.length}-${lastHang}-${lastPull}-${lastWeight}-${maxChartValue}`;
  }, [period, chartData, maxChartValue]);

  return (
    <SafeAreaView style={styles.safe}>
			<View style={styles.header}> 
				<TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
				  <Feather name="x" size={20} color={colors.text.primary} />
				</TouchableOpacity>
				<Text style={styles.title}>Analytics</Text>
				<View style={styles.spacer} />
			</View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.segmentRow}>
            <View style={styles.segmentCol}>
              <WideButton
                title="7 days"
                onPress={() => setPeriod('7d')}
                backgroundColor={period === '7d' ? colors.button.dark : colors.input.background}
                textColor={colors.text.primary}
              />
            </View>
            <View style={styles.segmentCol}>
              <WideButton
                title="30 days"
                onPress={() => setPeriod('30d')}
                backgroundColor={period === '30d' ? colors.button.dark : colors.input.background}
                textColor={colors.text.primary}
              />
            </View>
            <View style={styles.segmentCol}>
              <WideButton
                title="All time"
                onPress={() => setPeriod('all')}
                backgroundColor={period === 'all' ? colors.button.dark : colors.input.background}
                textColor={colors.text.primary}
              />
            </View>
          </View>
          <View style={styles.metricsRow}>
            <View style={styles.metricBlock}>
              {analyticsData.loading ? (
                <ActivityIndicator size="small" color={colors.text.primary} />
              ) : analyticsData.error ? (
                <Text style={[styles.metricValue, styles.errorText]}>Error</Text>
              ) : (
                <Text style={styles.metricValue}>{metrics.totalSessionTime}</Text>
              )}
              <Text style={styles.metricLabel}>Total session time</Text>
            </View>
            <View style={styles.metricBlock}>
              {analyticsData.loading ? (
                <ActivityIndicator size="small" color={colors.text.primary} />
              ) : analyticsData.error ? (
                <Text style={[styles.metricValue, styles.errorText]}>Error</Text>
              ) : (
                <Text style={styles.metricValue}>{metrics.averageSessionLength}</Text>
              )}
              <Text style={styles.metricLabel}>Avg session length</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.graphContainer}>
            {analyticsData.loading ? (
              <ActivityIndicator size="large" color={colors.text.primary} />
            ) : analyticsData.error ? (
              <Text style={styles.graphPlaceholder}>Failed to load chart data</Text>
            ) : (
              <LineChart
                key={chartKey}
                data={chartData.hangData}
                data2={chartData.pullupData}
                data3={chartData.weightData}
                height={230}
                width={chartWidth}
                spacing={spacing}
                initialSpacing={dynamicInitialSpacing}
                endSpacing={END_SPACING}
                maxValue={maxChartValue}
                color1={colors.chart.hng}
                color2={colors.chart.pull}
                color3={colors.chart.bw}
                thickness1={3}
                thickness2={3}
                thickness3={3}
                dataPointsColor1={colors.chart.hng}
                dataPointsColor2={colors.chart.pull}
                dataPointsColor3={colors.chart.bw}
                dataPointsRadius={4}
                backgroundColor="transparent"
                yAxisColor={colors.border.primary}
                xAxisColor={colors.border.primary}
                yAxisTextStyle={{ color: colors.text.secondary, fontSize: 10 }}
                yAxisLabelWidth={Y_AXIS_LABEL_W}
                hideDataPoints1={false}
                hideDataPoints2={false}
                hideDataPoints3={false}
                hideOrigin={true}
                hideRules
                curved={false}
                animateOnDataChange={false}
                isAnimated={false}
                disableScroll
                yAxisThickness={1}
                xAxisThickness={1}
                xAxisLabelsHeight={0}
                overflowBottom={0}
                overflowTop={16}
                pointerConfig={{
                  showPointerStrip: true,
                  pointerStripColor: colors.background.primary,
                  pointerStripWidth: 2,
                  pointerStripUptoDataPoint: true,
                  pointer1Color: colors.text.primary,
                  pointer2Color: colors.button.disabled,
                  hidePointer1: true,
                  hidePointer2: true,
                  hidePointer3: true,
                  persistPointer: false,
                  activatePointersInstantlyOnTouch: true,
                  pointerLabelWidth: 100,
                  pointerLabelHeight: 64,
                  shiftPointerLabelX: 8,
                  shiftPointerLabelY: 80,
                  autoAdjustPointerLabelPosition: true,
                  pointerLabelComponent: (items: Array<{ value?: number }>) => {
                    const i1 = items?.[0];
                    const i2 = items?.[1];
                    const i3 = items?.[2];
                    return (
                      <View
                        style={{
                          backgroundColor: colors.input.background,
                          borderWidth: 2,
                          borderColor: colors.border.primary,
                          borderRadius: 10,
                          paddingVertical: 6,
                          paddingHorizontal: 8,
                          shadowColor: colors.border.primary,
                          shadowOffset: { width: 2, height: 2 },
                          shadowOpacity: 1,
                          shadowRadius: 0,
                        }}
                      >
                        <Text style={{ color: colors.text.primary }}>bw: {i3?.value ?? '—'} kg</Text>
                        <Text style={{ color: colors.text.primary }}>hang: {i1?.value ?? '—'} kg</Text>
                        <Text style={{ color: colors.text.primary }}>pull: {i2?.value ?? '—'} kg</Text>
                      </View>
                    );
                  },
                }}
              />
            )}
          </View>
          <View style={styles.legendRow}>
            <LegendPill color={colors.chart.hng} label="Hang" />
            <LegendPill color={colors.chart.pull} label="Pull-up" />
            <LegendPill color={colors.chart.bw} label="Weight" />
          </View>
        </View>

        {/* Current metrics */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Current metrics</Text>
          <View style={styles.currentRow}>
            <View style={styles.currentCol}>
              <Text style={styles.currentLabel}>Max hang</Text>
              {analyticsData.loading ? (
                <ActivityIndicator size="small" color={colors.text.primary} />
              ) : analyticsData.error ? (
                <Text style={[styles.currentValue, styles.errorText]}>Error</Text>
              ) : (
                <Text style={styles.currentValue}>{metrics.current.maxHang}</Text>
              )}
            </View>
            <View style={styles.currentCol}>
              <Text style={styles.currentLabel}>Max pull-up</Text>
              {analyticsData.loading ? (
                <ActivityIndicator size="small" color={colors.text.primary} />
              ) : analyticsData.error ? (
                <Text style={[styles.currentValue, styles.errorText]}>Error</Text>
              ) : (
                <Text style={styles.currentValue}>{metrics.current.maxPullup}</Text>
              )}
            </View>
            <View style={styles.currentCol}>
              <Text style={styles.currentLabel}>Weight</Text>
              {analyticsData.loading ? (
                <ActivityIndicator size="small" color={colors.text.primary} />
              ) : analyticsData.error ? (
                <Text style={[styles.currentValue, styles.errorText]}>Error</Text>
              ) : (
                <Text style={styles.currentValue}>{metrics.current.maxWeight}</Text>
              )}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

function LegendPill({ color, label }: { color: string; label: string }) {
  return (
    <View style={[styles.legendPill, { borderColor: color }]}> 
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={[styles.legendText, { color }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingBottom: 7,
    paddingTop: 3,
    backgroundColor: colors.background.primary,
	borderBottomWidth: 5,
	borderColor: colors.border.primary,
  },
  backButton: {
    padding: 8,
  },
	title: { 
		color: colors.text.primary, 
		fontSize: typography.fontSize.title_s, 
		fontWeight: typography.fontWeight.semibold,
		flex: 1,
		textAlign: 'center'
	},
	spacer: { width: 31 },

  // Card
  card: {
    backgroundColor: colors.button.tileDefault,
    borderWidth: 2,
    borderColor: colors.border.primary,
    borderRadius: 16,
    padding: 16,
    shadowColor: colors.border.primary,
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 6,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 12,
  },
  segmentRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  segmentCol: {
    flex: 1,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  metricBlock: {
    flex: 1,
    paddingTop: 4,
  },
  metricValue: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },

  // Graph container
  graphContainer: {
    height: 265,
    backgroundColor: colors.background.lighter,
    borderWidth: 2,
    borderColor: colors.border.primary,
    borderRadius: 12,
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
    marginBottom: 12,
    paddingLeft: 0,
    paddingRight: 8,
    paddingTop: 16,
    paddingBottom: 0,
    overflow: 'hidden',
  },
  graphPlaceholder: {
    color: colors.text.secondary,
  },
  legendRow: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
  },
  legendPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 2, 
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  legendDot: {
    width: 16,
    height: 6,
    borderRadius: 2,
    backgroundColor: colors.button.disabled,
    borderWidth: 2,
    borderColor: colors.border.primary,
  },
  legendText: {
    color: colors.text.secondary,
    fontWeight: typography.fontWeight.bold,
  },

  // Current metrics
  currentRow: {
    flexDirection: 'row',
    gap: 16,
  },
  currentCol: {
    flex: 1,
  },
  currentLabel: {
    color: colors.text.secondary,
    marginBottom: 6,
    fontWeight: typography.fontWeight.bold,
  },
  currentValue: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  errorText: {
    color: colors.text.secondary,
    opacity: 0.7,
  },
  errorContainer: {
    backgroundColor: colors.input.background,
    borderWidth: 2,
    borderColor: colors.border.primary,
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  errorMessage: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.lg,
    textAlign: 'center',
  },
});