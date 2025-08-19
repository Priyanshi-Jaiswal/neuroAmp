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

  public showLogPanel = false;
  public selectedDevEuiForLogs: string | null = null;

  colDefs: ColDef[] = [
    { field: "select", headerName: "Select", checkboxSelection: true, headerCheckboxSelection: true, flex: 0.75 },
    {
      field: "status",
      headerName: "Status",
      filter: 'agTextColumnFilter',
      flex: 0.6,
      cellRenderer: (params: ICellRendererParams) => {
        const status = params.data?.currentStatus;
        let color = status === 'playing' ? 'green' : 'red';
        return `<div style="display: flex; align-items: center; justify-content: center; height: 100%;">
                  <div style="width: 10px; height: 10px; border-radius: 50%; background-color: ${color};"></div>
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
      // Use the component as the cell renderer
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

  // --- New Logic for Button Activation (Changed to public) ---
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

  // --- Existing Methods with Updates ---
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
          // Update the local selectedRow array with the new status
          this.selectedRow = this.selectedRow.map(device => ({ ...device, currentStatus: 'playing' }));

          // Update the grid's internal data
          this.gridApi.applyTransaction({ update: this.selectedRow });
          this.gridApi.refreshCells({ rowNodes: this.gridApi.getSelectedNodes(), force: true });
        },
        error: (error) => {
          console.error('Error starting simulator:', error);
          alert('Failed to start simulator.');
        }
      });
    } else {
      alert('Please select devices that are not already joined.');
    }
  }

  stopSelectedDevices(): void {
    const devEUIsToStop = this.selectedRow.map(device => device.devEUI);
    if (this.allSelectedArePlaying()) {
      this.appService.stopDevice(devEUIsToStop).subscribe({
        next: (response) => {
          console.log('All simulator stopped:', response);
          // Update the local selectedRow array with the new status
          this.selectedRow = this.selectedRow.map(device => ({ ...device, currentStatus: 'paused', uplinkStatus: 'stopped' }));

          // Update the grid's internal data
          this.gridApi.applyTransaction({ update: this.selectedRow });
          this.gridApi.refreshCells({ rowNodes: this.gridApi.getSelectedNodes(), force: true });
        },
        error: (error) => {
          console.error('Error stopping simulator:', error);
          alert('Failed to stop simulator.');
        }
      });
    } else {
      alert('Please select devices that are already joined.');
    }
  }

  startAllUplinkDevice(): void {
    const devEUIsToStart = this.selectedRow.map(device => device.devEUI);
    if (this.allSelectedArePlaying() && this.allSelectedUplinkIsStopped()) {
      this.appService.startDeviceUplink(devEUIsToStart).subscribe({
        next: (response) => {
          console.log('All Devices uplink started:', response);
          // Update the local selectedRow array with the new status
          this.selectedRow = this.selectedRow.map(device => ({ ...device, uplinkStatus: 'running' }));

          // Update the grid's internal data
          this.gridApi.applyTransaction({ update: this.selectedRow });
          this.gridApi.refreshCells({ rowNodes: this.gridApi.getSelectedNodes(), force: true });
        },
        error: (error) => {
          console.error('Error starting devices uplink:', error);
          alert('Failed to start devices uplink.');
        }
      });
    } else {
      alert('Please select joined devices with stopped uplinks.');
    }
  }

  stopAllUplinkDevice(): void {
    const devEUIsToStop = this.selectedRow.map(device => device.devEUI);
    if (this.allSelectedArePlaying() && this.allSelectedUplinkIsRunning()) {
      this.appService.stopDeviceUplink(devEUIsToStop).subscribe({
        next: (response) => {
          console.log('All devices uplink stopped:', response);
          // Update the local selectedRow array with the new status
          this.selectedRow = this.selectedRow.map(device => ({ ...device, uplinkStatus: 'stopped' }));
          
          // Update the grid's internal data
          this.gridApi.applyTransaction({ update: this.selectedRow });
          this.gridApi.refreshCells({ rowNodes: this.gridApi.getSelectedNodes(), force: true });
        },
        error: (error) => {
          console.error('Error stopping devices uplink:', error);
          alert('Failed to stop devices uplink.');
        }
      });
    } else {
      alert('Please select joined devices with running uplinks.');
    }
  }
  
  navigateToEditDevicePage(): void {
    if (this.selectedRow && this.selectedRow.length === 1) {
      const devEUI = this.selectedRow[0].devEUI;
      console.log("Navigating to Edit Device page with device EUI:", devEUI);
      this.router.navigate(['/edit-device', devEUI]);
    } else {
      alert('Please select exactly one device to edit.');
      console.warn('Invalid selection for editing.');
    }
  }

  deleteDevice(): void {
    const devEUIsToDelete = this.selectedRow.map(device => device.devEUI);
    if (confirm('Are you sure you want to delete this device?')) {
      const deletePromises = devEUIsToDelete.map(id =>
        this.appService.deleteDevice(id).subscribe({
          next: (response) => {
            console.log('Device deleted:', response);
            this.loadDevices();
          },
          error: (error) => {
            console.error('Error deleting device:', error);
            alert('Failed to delete device. Check console for details.');
          },
        })
      );
    }
  }

  public onViewLogs(devEui: string): void {
    this.selectedDevEuiForLogs = devEui;
    this.showLogPanel = true;
  }
}
