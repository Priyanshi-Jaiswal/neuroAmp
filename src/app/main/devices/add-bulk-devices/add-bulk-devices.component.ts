import { Component, OnInit } from '@angular/core';
import { AppService } from '../../../app.service';

@Component({
  selector: 'app-add-bulk-devices',
  templateUrl: './add-bulk-devices.component.html',
  styleUrl: './add-bulk-devices.component.scss'
})
export class AddBulkDevicesComponent implements OnInit {
  numberOfDevices: number | undefined;
  appKey: string = '';
  showAppKey: boolean = false;
  selectedGatewayId: string | null = null;
  gateway: any[] = [];
  region: string = '';
  regionOptions: string[] = ['US915', 'EU868', 'AS923', 'AU915'];

  message: string | null = null;
  isError: boolean = false;

  constructor(private appService: AppService) { }

  ngOnInit(): void {
    this.appService.getGateways().subscribe({
      next: (response) => {
        this.gateway = response.response;
        console.log('Gateways loaded:', this.gateway);
      },
      error: (err) => {
        console.error('Failed to fetch gateways:', err);
      },
    });
  }

  private generateRandomHexString(length: number): string {
    let result = '';
    const characters = '0123456789ABCDEF';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  }

  generateAppKey(): void {
    this.appKey = this.generateRandomHexString(32);
    console.log('Generated App Key:', this.appKey);
  }

  toggleAppKeyVisibility(): void {
    this.showAppKey = !this.showAppKey;
  }

  addDevices (): void {
    this.message = null; 
    if (!this.numberOfDevices || this.numberOfDevices <= 0) {
      this.showMessage('Please enter a valid number of devices (greater than 0).', true);
      return;
    }
    if (!this.gateway) {
      this.showMessage('Please select a gateway.', true);
      return;
    }
    if (!this.appKey) {
      this.showMessage('App Key cannot be empty. Please generate one or enter manually.', true);
      return;
    }
    if (!this.region) {
      this.showMessage('Please select a region.', true);
      return;
    }

    const deviceData = {
      numberOfDevices: this.numberOfDevices,
      appKey: this.appKey,
      gateway: this.selectedGatewayId,
      region: this.region
    };

    this.appService.createBulkDevices(deviceData).subscribe({
      next: (response) => {
        console.log('Bulk devices created successfully:', response);
        this.showMessage(response.message || `Successfully created ${response.inserted_count} devices.`, false);
        this.resetForm();
      },
      error: (err) => {
        console.error('Error creating bulk devices:', err);
        this.showMessage(err.error?.details || err.error?.error || 'Failed to create devices. Please try again.', true);
      }
    });
  }

  private showMessage(msg: string, isErr: boolean): void {
    this.message = msg;
    this.isError = isErr;
  }

  private resetForm(): void {
    this.numberOfDevices = undefined;
    this.appKey = '';
    this.showAppKey = false;
    this.selectedGatewayId = null;
    this.region = '';
  }
}
