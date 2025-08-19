import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import { AppService } from '../../../app.service';

@Component({
  selector: 'app-log-panel',
  templateUrl: './log-panel.component.html',
  styleUrls: ['./log-panel.component.scss']
})
export class LogPanelComponent implements OnInit, OnChanges, OnDestroy {
  @Input() devEui: string | null = null;
  @Output() closePanel = new EventEmitter<void>();

  logs: string[] = [];
  isLoading = false;
  error: string | null = null;

  private refreshInterval: any;

  constructor(private appService: AppService) {}

  ngOnInit(): void {
    this.fetchLogs();
    this.startLogRefresh();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['devEui'] && changes['devEui'].currentValue !== changes['devEui'].previousValue) {
      this.stopLogRefresh();
      this.fetchLogs();
      this.startLogRefresh();
    }
  }

  ngOnDestroy(): void {
    this.stopLogRefresh();
  }

  fetchLogs(): void {
    if (this.devEui) {
      this.isLoading = true;
      this.error = null;
      this.appService.getDeviceLogs(this.devEui).subscribe({
        next: (response) => {
          this.logs = response.logs || ['No logs found for this device.'];
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error fetching logs:', err);
          this.error = 'Failed to fetch logs. Please try again.';
          this.isLoading = false;
          this.logs = [];
        }
      });
    }
  }

  onClose(): void {
    this.closePanel.emit();
  }

  private startLogRefresh(): void {
    // Clear any existing timer before starting a new one
    this.stopLogRefresh();
    this.refreshInterval = setInterval(() => {
      this.fetchLogs();
    }, 3000); // 3000 milliseconds = 3 seconds
  }

  private stopLogRefresh(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }
}
