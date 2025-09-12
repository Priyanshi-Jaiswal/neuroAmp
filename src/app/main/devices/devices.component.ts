import { Component, OnInit } from '@angular/core';
import { AppService } from '../../app.service';
import { Router } from '@angular/router';
import { ColDef, RowSelectedEvent, ICellRendererParams, GridApi } from 'ag-grid-community';
import { ActionButtonComponent } from '../action-button/action-button.component';
import { LogPanelComponent } from '../action-button/log-panel/log-panel.component';

@Component({
  selector: 'app-devices',
  templateUrl: './devices.component.html',
  styleUrls: ['./devices.component.scss']
})

export class DevicesComponent implements OnInit {
  selectedRow: any[] = [];
  devices: any[] = [];
  isLoading: boolean = false;
  errorMessage: string | null = null;
  private gridApi!: GridApi;
  getRowId = (params: any) => params.data.devEUI;

  // Replaced message and isError with a single config object
  modalConfig = {
    show: false,
    message: '',
    isError: false,
    showCancelButton: false,
    callback: () => { }
  };

  public showLogPanel = false;
  public selectedDevEuiForLogs: string | null = null;

  colDefs: ColDef[] = [
    { field: "select", headerName: "", checkboxSelection: true, headerCheckboxSelection: true, flex: 0.3 },
    {
      field: "status",
      headerName: "Status",
      flex: 0.6,
      cellRenderer: (params: ICellRendererParams) => {
        const status = params.data?.currentStatus;
        let color = status === 'playing' ? 'green' : 'red';
        return `<div style="display: flex; align-items: center; justify-content: left; height: 100%;">
                  <div style="width: 20px; height: 20px; border-radius: 50%; background-color: ${color};"></div>
                </div>`;
      },
    },
    { field: "name", headerName: "Name", filter: 'agTextColumnFilter', flex: 2 },
    { field: "devEUI", headerName: "Device EUI", filter: 'agTextColumnFilter', flex: 2 },
    { field: "gateway", headerName: "Gateway", filter: 'agTextColumnFilter', flex: 2 },
    {
      field: "action",
      headerName: "Actions",
      flex: 1.5,
      cellRenderer: ActionButtonComponent,
      suppressMenu: true,
      filter: false,
      sortable: false,
      cellRendererParams: (params: ICellRendererParams) => ({
        ...params,
        type: 'device',
        onViewLogs: (devEui: string) => this.onViewLogs(devEui)
      })
    }
  ];
  paginationPageSizeSelector = [5, 10, 20, 50, 100, 200];

  constructor(private appService: AppService, private router: Router) { }

  ngOnInit(): void {
    this.loadDevices();
  }

  onGridReady(params: any) {
    this.gridApi = params.api;
    console.log('AG-Grid API is ready:', this.gridApi);
  }

  // New method to show a simple alert using the modal
  private showModalAlert(msg: string, isErr: boolean): void {
    this.modalConfig = {
      show: true,
      message: msg,
      isError: isErr,
      showCancelButton: false,
      callback: () => { } // The callback can be empty for simple alerts
    };
  }

  // New method to show a confirmation modal
  private showModalConfirm(msg: string, callback: () => void): void {
    this.modalConfig = {
      show: true,
      message: msg,
      isError: false, // Confirmations are not errors
      showCancelButton: true,
      callback: callback
    };
  }
  
  // Method to handle the modal's confirm event
  onModalConfirm(): void {
    this.modalConfig.show = false;
    if (this.modalConfig.callback) {
      this.modalConfig.callback();
    }
  }

  // Method to handle the modal's cancel event
  onModalCancel(): void {
    this.modalConfig.show = false;
  }
  
  loadDevices(): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.appService.getDevices().subscribe({
      next: (response) => {
        this.devices = response.response.map((device: any) => ({
          ...device,
          currentStatus: device.currentStatus || 'paused',
          uplinkStatus: device.uplinkStatus || 'stopped'
        }));
        this.isLoading = false;
        console.log('Devices loaded:', this.devices);
      },
      error: (error) => {
        console.error('Error fetching devices:', error);
        this.errorMessage = 'Failed to load devices. Please try again.';
        this.isLoading = false;
      }
    });
  }

  onRowSelected(event: RowSelectedEvent) {
    this.selectedRow = event.api.getSelectedNodes().map(node => node.data);
    console.log('Selected Rows:', this.selectedRow);
  }

  public hasSelection(): boolean {
    return this.selectedRow.length > 0;
  }
  public allSelectedArePaused(): boolean {
    return this.hasSelection() && this.selectedRow.every(device => device.currentStatus === 'paused');
  }
  public allSelectedArePlaying(): boolean {
    return this.hasSelection() && this.selectedRow.every(device => device.currentStatus === 'playing');
  }
  public allSelectedUplinkIsStopped(): boolean {
    return this.hasSelection() && this.selectedRow.every(device => device.uplinkStatus === 'stopped');
  }
  public allSelectedUplinkIsRunning(): boolean {
    return this.hasSelection() && this.selectedRow.every(device => device.uplinkStatus === 'running');
  }

  navigateToAddDevicePage(): void {
    this.router.navigate(['/addDevices']);
    console.log('Navigating to Add New Device page');
  }

  addBulkDevice(): void {
    this.router.navigate(['/addBulkDevices']);
    console.log('Navigating to Add New Device page');
  }

  startSelectedDevices(): void {
    const devEUIsToStart = this.selectedRow.map(device => device.devEUI);
    if (this.allSelectedArePaused()) {
      this.appService.startDevice(devEUIsToStart).subscribe({
        next: (response) => {
          console.log('All simulator started:', response);
          this.selectedRow = this.selectedRow.map(device => ({ ...device, currentStatus: 'playing' }));
          this.gridApi.applyTransaction({ update: this.selectedRow });
          this.gridApi.refreshCells({ rowNodes: this.gridApi.getSelectedNodes(), force: true });
        },
        error: (error) => {
          console.error('Error starting simulator:', error);
          this.showModalAlert('Failed to start simulator.', true);
        }
      });
    } else {
      this.showModalAlert('Please select devices that are not already joined.', true);
    }
  }

  stopSelectedDevices(): void {
    const devEUIsToStop = this.selectedRow.map(device => device.devEUI);
    if (this.allSelectedArePlaying()) {
      this.appService.stopDevice(devEUIsToStop).subscribe({
        next: (response) => {
          console.log('All simulator stopped:', response);
          this.selectedRow = this.selectedRow.map(device => ({ ...device, currentStatus: 'paused', uplinkStatus: 'stopped' }));
          this.gridApi.applyTransaction({ update: this.selectedRow });
          this.gridApi.refreshCells({ rowNodes: this.gridApi.getSelectedNodes(), force: true });
        },
        error: (error) => {
          console.error('Error stopping simulator:', error);
          this.showModalAlert('Failed to stop simulator.', true);
        }
      });
    } else {
      this.showModalAlert('Please select devices that are already joined.', true);
    }
  }

  startAllUplinkDevice(): void {
    const devEUIsToStart = this.selectedRow.map(device => device.devEUI);
    if (this.allSelectedArePlaying() && this.allSelectedUplinkIsStopped()) {
      this.appService.startDeviceUplink(devEUIsToStart).subscribe({
        next: (response) => {
          console.log('All Devices uplink started:', response);
          this.selectedRow = this.selectedRow.map(device => ({ ...device, uplinkStatus: 'running' }));
          this.gridApi.applyTransaction({ update: this.selectedRow });
          this.gridApi.refreshCells({ rowNodes: this.gridApi.getSelectedNodes(), force: true });
        },
        error: (error) => {
          console.error('Error starting devices uplink:', error);
          this.showModalAlert('Failed to start devices uplink.', true);
        }
      });
    } else {
      this.showModalAlert('Please select joined devices with stopped uplinks.', true);
    }
  }

  stopAllUplinkDevice(): void {
    const devEUIsToStop = this.selectedRow.map(device => device.devEUI);
    if (this.allSelectedArePlaying() && this.allSelectedUplinkIsRunning()) {
      this.appService.stopDeviceUplink(devEUIsToStop).subscribe({
        next: (response) => {
          console.log('All devices uplink stopped:', response);
          this.selectedRow = this.selectedRow.map(device => ({ ...device, uplinkStatus: 'stopped' }));
          this.gridApi.applyTransaction({ update: this.selectedRow });
          this.gridApi.refreshCells({ rowNodes: this.gridApi.getSelectedNodes(), force: true });
        },
        error: (error) => {
          console.error('Error stopping devices uplink:', error);
          this.showModalAlert('Failed to stop devices uplink.', true);
        }
      });
    } else {
      this.showModalAlert('Please select joined devices with running uplinks.', true);
    }
  }

  navigateToEditDevicePage(): void {
    if (this.selectedRow && this.selectedRow.length === 1) {
      const devEUI = this.selectedRow[0].devEUI;
      console.log("Navigating to Edit Device page with device EUI:", devEUI);
      this.router.navigate(['/edit-device', devEUI]);
    } else {
      this.showModalAlert('Please select exactly one device to edit.', true);
      console.warn('Invalid selection for editing.');
    }
  }

  deleteDevice(): void {
    if (this.selectedRow.length === 0) {
      this.showModalAlert('Please select at least one device to delete.', true);
      return;
    }
    
    // Show a confirmation modal instead of a simple alert
    const deviceCount = this.selectedRow.length;
    const message = `Are you sure you want to delete ${deviceCount === 1 ? 'this device' : 'these devices'}?`;

    this.showModalConfirm(message, () => {
      const devEUIsToDelete = this.selectedRow.map(device => device.devEUI);
      const deletePromises = devEUIsToDelete.map(id =>
        this.appService.deleteDevice(id).subscribe({
          next: (response) => {
            console.log('Device deleted:', response);
            this.loadDevices();
          },
          error: (error) => {
            console.error('Error deleting device:', error);
            this.showModalAlert('Failed to delete device. Check console for details.', true);
          },
        })
      );
    });
  }

  public onViewLogs(devEui: string): void {
    this.selectedDevEuiForLogs = devEui;
    this.showLogPanel = true;
  }
}
