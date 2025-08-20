import { Component, Input, Output, EventEmitter, OnInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { AppService } from '../../../app.service';

@Component({
  selector: 'app-log-panel',
  templateUrl: './log-panel.component.html',
  styleUrls: ['./log-panel.component.scss']
})
export class LogPanelComponent implements OnInit, AfterViewChecked {
  @Input() devEui: string | null = null;
  @Output() closePanel = new EventEmitter<void>();

  @ViewChild('logBody') private logBodyRef!: ElementRef;

  logs: string[] = [];
  isLoading = false;
  error: string | null = null;
  private shouldScrollToBottom = false;

  constructor(private appService: AppService) {}

  ngOnInit(): void {
    this.fetchLogs();
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false; // Reset the flag
    }
  }

  fetchLogs(): void {
    if (this.devEui) {
      this.isLoading = true;
      this.error = null;
      this.appService.getDeviceLogs(this.devEui).subscribe({
        next: (response) => {
          const allLogs = response.logs || ['No logs found for this device.'];
          const recentLogs = allLogs.slice(-600);
          this.logs = recentLogs;
          this.isLoading = false;
          
          // Set the flag to true to trigger the scroll after the view is updated
          this.shouldScrollToBottom = true;
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

  onRefresh(): void {
    this.fetchLogs();
  }

  private scrollToBottom(): void {
    try {
      this.logBodyRef.nativeElement.scrollTop = this.logBodyRef.nativeElement.scrollHeight;
    } catch (err) {
      console.error('Could not scroll to bottom:', err);
    }
  }
}
