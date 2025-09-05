import { Component, OnInit } from '@angular/core';
import { AppService } from '../../app.service';
import { Chart, registerables } from 'chart.js';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  totalDevices: number = 0;
  connectedDevices: number = 0;
  disconnectedDevices: number = 0;
  totalGateways: number = 0;
  isLoading: boolean = false;
  errorMessage: string | null = null;

  gatewaysWithDeviceCounts: any[] = [];

  private deviceStatusChart: Chart | undefined;
  private gatewayDevicesChart: Chart | undefined;

  constructor(private appService: AppService) { }

  ngOnInit(): void {
    this.fetchDashboardData();
  }

  fetchDashboardData(): void {
    this.isLoading = true;
    this.errorMessage = null;

    forkJoin({
      summary: this.appService.getDashboardSummary().pipe(
        catchError(error => {
          console.error('API Error: Failed to fetch dashboard summary.', error);
          this.errorMessage = 'Failed to load device data.';
          return of({ total_devices: 0, active_devices: 0 });
        })
      ),
      gateways: this.appService.getGateways().pipe(
        catchError(error => {
          console.error('API Error: Failed to fetch gateways.', error);
          if (!this.errorMessage) {
            this.errorMessage = 'Failed to load gateway data.';
          }
          return of({ response: [] });
        })
      )
    }).subscribe({
      next: (response) => {
        this.totalDevices = response.summary.total_devices;
        this.connectedDevices = response.summary.active_devices;
        this.disconnectedDevices = this.totalDevices - this.connectedDevices;
        this.gatewaysWithDeviceCounts = response.gateways.response;
        this.totalGateways = this.gatewaysWithDeviceCounts.length;

        // This is the key fix: We set isLoading to false, which makes the chart
        // containers visible, and then we immediately render the charts.
        this.isLoading = false;
        
        // This setTimeout is a final safeguard to give the DOM one last moment to update.
        // It should not be necessary but will ensure the charts appear.
        setTimeout(() => {
          this.renderDeviceChart();
          this.renderGatewayChart();
        }, 10);
      },
      error: (error) => {
        console.error('An unexpected error occurred during data fetching:', error);
        this.isLoading = false;
        this.errorMessage = this.errorMessage || 'An unexpected error occurred.';
      }
    });
  }

  renderDeviceChart(): void {
    const ctx = document.getElementById('deviceStatusPieChart') as HTMLCanvasElement;
    if (ctx) {
      console.log("Canvas element 'deviceStatusPieChart' found. Rendering chart...");
      if (this.deviceStatusChart) {
        this.deviceStatusChart.destroy();
      }
      this.deviceStatusChart = new Chart(ctx, {
        type: 'pie',
        data: {
          labels: ['Connected', 'Disconnected'],
 /* font: {
                 size: 12
                },*/
          datasets: [{
            data: [this.connectedDevices, this.disconnectedDevices],
            backgroundColor: ['#5cb85c', '#d9534f'],
            borderWidth: 0.5,
            borderColor: '#ffffff',
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: function(context) {
                  let label = context.label || '';
                  if (label) { label += ': '; }
                  if (context.parsed !== null) { label += context.parsed; }
                  return label;
                }
              }
            }
          }
        }
      });
    } else {
      console.error('Canvas element #deviceStatusPieChart not found.');
    }
  }

  renderGatewayChart(): void {
    const ctx = document.getElementById('gatewayDevicesBarChart') as HTMLCanvasElement;
    if (ctx && this.gatewaysWithDeviceCounts && this.gatewaysWithDeviceCounts.length > 0) {
      console.log("Canvas element 'gatewayDevicesBarChart' found. Rendering chart...");
      if (this.gatewayDevicesChart) {
        this.gatewayDevicesChart.destroy();
      }

      const gatewayNames = this.gatewaysWithDeviceCounts
        .filter(g => g && g.name)
        .map(g => g.name);

      const connectedDeviceCounts = this.gatewaysWithDeviceCounts
        .filter(g => g && (g.connected_devices || g.connected_devices === 0))
        .map(g => g.connected_devices);

      const disconnectedDeviceCounts = this.gatewaysWithDeviceCounts
        .filter(g => g && (g.disconnected_devices || g.disconnected_devices === 0))
        .map(g => g.disconnected_devices);

      if (gatewayNames.length === 0) {
        console.warn('Gateway chart data is empty or invalid.');
        return;
      }

      this.gatewayDevicesChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: gatewayNames,
          datasets: [
            {
              label: 'Disconnected',
              data: disconnectedDeviceCounts,
              backgroundColor: '#d9534f',
              barPercentage: 0.25,
            },
            {
              label: 'Connected',
              data: connectedDeviceCounts,
              backgroundColor: '#5cb85c',
              barPercentage: 0.25,
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              align: 'center',
              labels: {
                usePointStyle: true,
                //padding: { top: 0, bottom: 0, left: 15, right: 25 },
                //boxWidth: 15,
              }
            }
          },
          scales: {
            x: {
              /*title: {
                display: true,
                text: 'Gateways',
                color: '#000',
                font: {
                  size: 8
                }
              },*/
              ticks: {
                //color: '#000',
                font: {
                  size: 12
                }
              },
              grid: {
                color: 'rgba(100, 100, 100, 0.2)',
                display: false
              },
              stacked: true,
            },
            y: {
              title: {
                display: true,
                text: '#Devices',
                //color: '#000',
                font: {
                  size: 12
                }
              },
              ticks: {
                //color: '#000',
                font: {
                  size: 10
                },
                callback: function(value) {
                  return Number.isInteger(value) ? value : null;
                },
              },
              grid: {
                color: 'rgba(100, 100, 100, 0.2)'
              },
              beginAtZero: true,
              stacked: true,
            }
          }
        }
      });
    } else {
      console.error('Canvas element #gatewayDevicesBarChart not found or no data available.');
    }
  }
}