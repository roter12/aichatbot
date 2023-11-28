import React from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    BarElement,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import moment from 'moment';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend
);

export const options = {
    responsive: true,
    plugins: {
        legend: {
            display: false,
            position: 'top' as const,
        },
        title: {
            display: false,
            text: 'Chart.js Line Chart',
        },
    },
    scales: {
        x: {
            display: false,
        },
        y: {
            display: false,
        }
    },
};

const LineGraph = ({ values, color }: { values: { x: number, y: number }[], color: string }) => {

    const x_min = Math.min(...values.map(({ x }) => x));
    const x_max = Math.max(...values.map(({ x }) => x));

    const INTERVALS = values.length;

    const interval = Math.ceil((x_max - x_min) / INTERVALS);
    const x_values = Array.from({ length: INTERVALS + 1 }, (_, i) => x_min + (i * interval));

    const y_values = x_values.map(x => {
        const values_in_interval = values.filter(({ x: _x }) => _x >= x && _x < x + interval);
        return values_in_interval.length > 0
            ? values_in_interval.reduce((acc, { y }) => acc + y, 0) / values_in_interval.length
            : undefined;
    });

    console.log(x_values, y_values)

    const x_values_filtered = x_values.filter((_, i) => y_values[i] !== undefined);
    const y_values_filtered = y_values.filter(y => y !== undefined);

    const labels = x_values_filtered

    const data = {
        labels,
        datasets: [
            {
                label: 'Amount',
                data: y_values_filtered,
                borderColor: color, //'rgb(132, 99, 255)',
                backgroundColor: 'rgba(132, 99, 255, 0.5)',
                strikeWidth: 5,
            },
        ],
    };

    return <Line options={options} data={data} />
}

export default LineGraph;