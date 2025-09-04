import 'chart.js';
import 'chartjs-plugin-chartjs-3d';

declare module 'chart.js' {
    interface ChartDatasetProperties<TType extends ChartType, TData> {
        bar3d?: {
            bevel?: number;
            offset?: number;
            depth?: number;
        };
    }
}