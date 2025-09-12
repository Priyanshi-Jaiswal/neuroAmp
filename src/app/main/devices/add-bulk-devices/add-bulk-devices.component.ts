import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AppService } from '../../../app.service';

@Component({
  selector: 'app-add-bulk-devices',
  templateUrl: './add-bulk-devices.component.html',
  styleUrl: './add-bulk-devices.component.scss'
})
export class AddBulkDevicesComponent implements OnInit {
  numberOfDevices: number | undefined;
  name: string = '';
  showAppKey: boolean = false;
  selectedGatewayId: string | null = null;
  gateway: any[] = [];
  region: string | null = null;
  regionOptions: string[] = ['US915', 'EU868', 'AS923', 'AU915'];

  // New: A single object to manage the modal's state
  modalConfig = {
    show: false,
    message: '',
    isError: false,
    showCancelButton: false, // Simple alerts don't need a cancel button
  };

  constructor(private router: Router, private appService: AppService) { }

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

  addDevices(): void {
    // Hide the modal at the start of the function
    this.modalConfig.show = false;
    
    if (!this.numberOfDevices || this.numberOfDevices <= 0) {
      this.showModal('Please enter a valid number of devices (greater than 0).', true);
      return;
    }
    if (!this.name) {
      this.showModal('Please enter the name.', true);
      return;
    }
    // Changed this to use selectedGatewayId
    if (!this.selectedGatewayId) {
      this.showModal('Please select a gateway.', true);
      return;
    }
    if (!this.region) {
      this.showModal('Please select a region.', true);
      return;
    }

    const deviceData = {
      numberOfDevices: this.numberOfDevices,
      name: this.name,
      gateway: this.selectedGatewayId,
      region: this.region
    };

    this.appService.createBulkDevices(deviceData).subscribe({
      next: (response) => {
        console.log('Bulk devices created successfully:', response);
        this.showModal(response.message || `Successfully created ${response.inserted_count} devices.`, false);
        this.resetForm();
      },
      error: (err) => {
        console.error('Error creating bulk devices:', err);
        this.showModal(err.error?.details || err.error?.error || 'Failed to create devices. Please try again.', true);
      }
    });
  }

  // New method to show the modal
  private showModal(msg: string, isErr: boolean): void {
    this.modalConfig.message = msg;
    this.modalConfig.isError = isErr;
    this.modalConfig.show = true;
  }

  // New method to close the modal, called by its output events
  onModalClose(): void {
    this.modalConfig.show = false;
  }

  private resetForm(): void {
    this.numberOfDevices = undefined;
    this.name = '';
    this.selectedGatewayId = null;
    this.region = '';
  }
}