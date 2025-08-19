import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AppService } from '../../app.service';

@Component({
  selector: 'app-gateway-bridge',
  templateUrl: './gateway-bridge.component.html',
  styleUrls: ['./gateway-bridge.component.scss']
})
export class GatewayBridgeComponent implements OnInit {
  bridgeData = {
    address: '',
    port: ''
  };

  constructor(private appService: AppService) { }

  ngOnInit(): void {
    this.getGatewayBridgeConfig();
  }

  getGatewayBridgeConfig(): void {
    this.appService.getGatewayBridgeConfig().subscribe({
      next: (config) => {
        this.bridgeData.address = config.address;
        this.bridgeData.port = config.port;
        console.log('Gateway Bridge configuration loaded:', this.bridgeData);
      },
      error: (error) => {
        console.error('Error fetching Gateway Bridge configuration:', error);
      }
    });
  }

  saveGatewayBridge(): void {
    console.log('Saving Gateway Bridge data:', this.bridgeData);
  }
}