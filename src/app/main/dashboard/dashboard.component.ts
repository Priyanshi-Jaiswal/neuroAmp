// src/app/dashboard/dashboard.component.ts
import { Component, OnInit } from '@angular/core';
import { AppService } from '../../app.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  totalDevices: number = 0;
  connectedDevices: number = 0;
  totalGateways: number = 0;
  isLoading: boolean = false;

  constructor(private appService: AppService) { }

  ngOnInit(): void {
    this.fetchDashboardData();
  }

  fetchDashboardData(): void {
    this.isLoading = true;
    
    this.appService.getDashboardSummary().subscribe({
      next: (response) => {
        this.totalDevices = response.total_devices;
        this.connectedDevices = response.active_devices;
        this.totalGateways = response.total_gateways;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error fetching dashboard summary:', error);
        this.isLoading = false;
      }
    });
  }
}