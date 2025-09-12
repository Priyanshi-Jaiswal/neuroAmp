import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AppService } from '../../app.service';
import { MatDialog } from '@angular/material/dialog';
import { ColDef, ICellRendererParams, RowSelectedEvent } from 'ag-grid-community';
import { ActionButtonComponent } from '../action-button/action-button.component';
import * as L from 'leaflet';

const iconDefault = L.icon({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = iconDefault;

@Component({
  selector: 'app-gateways',
  templateUrl: './gateways.component.html',
  styleUrls: ['./gateways.component.scss']
})

export class GatewaysComponent implements OnInit, AfterViewInit {
  gateways: any[] = [];
  selectedRow: any[] = [];
  rowData: any[] = [];
  colDefs: ColDef[] = [
    { field: "select", headerName: "", checkboxSelection: true, headerCheckboxSelection: true, flex: 0.3 },
    {
      field: "status",
      headerName: "Status",
      flex: 0.6,
      cellRenderer: (params: ICellRendererParams) => {
        const status = params.data?.currentStatus;
        // let color = status === 'playing' ? 'green' : 'red';
        let color = status === 'red';
        return `<div style="display: flex; align-items: center; justify-content: left; height: 100%;">
                  <div style="width: 20px; height: 20px; border-radius: 50%; background-color: ${color};"></div>
                </div>`;
      },
    },
    { field: "name", headerName: "Name", filter: 'agTextColumnFilter', flex: 2 },
    { field: "macAddress", headerName: "MAC Address", filter: 'agTextColumnFilter', flex: 2 },
    { field: "type", headerName: "Type", filter: 'agTextColumnFilter', flex: 1.5 },
    { field: "no_of_devices", headerName: "No. of Devices", filter: 'agTextColumnFilter', flex: 1.5 },
    {
      field: "action",
      headerName: "Actions",
      flex: 1.5,
      cellRenderer: ActionButtonComponent,
      suppressMenu: true,
      filter: false,
      sortable: false,
      cellRendererParams: {
        type: 'gateway',
      },
    }
  ];
  paginationPageSizeSelector = [5, 10, 20, 50, 100, 200];
  
  private map!: L.Map;

  @ViewChild('tableContainer') tableContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('mapContainer') mapContainer!: ElementRef<HTMLDivElement>;

  private isDragging = false;
  
  // New: Modal configuration object
  modalConfig = {
    show: false,
    message: '',
    isError: false,
    showCancelButton: false,
  };
  private modalCallback: (() => void) | undefined;

  constructor(private appService: AppService, private router: Router, private route: ActivatedRoute, private dialog: MatDialog) { }

  ngOnInit(): void {
    this.initMap();
    this.loadGateways();
  }

  ngAfterViewInit(): void {
    this.loadGateways();  
  }

  // New: Method to show the modal with custom options and an optional callback
  private showModal(message: string, isError: boolean, showCancel: boolean, callback?: () => void): void {
    this.modalConfig = {
      show: true,
      message: message,
      isError: isError,
      showCancelButton: showCancel
    };
    this.modalCallback = callback;
  }

  // New: Method to handle modal close events (OK/Cancel)
  onModalClose(isConfirmed: boolean): void {
    this.modalConfig.show = false;
    if (isConfirmed && this.modalCallback) {
      this.modalCallback();
    }
    this.modalCallback = undefined;
  }
  
  // Resizing logic
  onDragStart(event: MouseEvent) {
    this.isDragging = true;
    document.body.style.cursor = 'ns-resize';
    document.addEventListener('mousemove', this.onDragging);
    document.addEventListener('mouseup', this.onDragEnd);
  }

  private onDragging = (event: MouseEvent) => {
    if (!this.isDragging) return;

    const container = this.tableContainer.nativeElement.parentElement;
    if (!container) return; // Add a null check here

    const totalHeight = container.offsetHeight;
    const tableHeight = event.clientY - container.getBoundingClientRect().top;
    const mapHeight = totalHeight - tableHeight;

    if (tableHeight > 100 && mapHeight > 100) { // Min height of 100px
      this.tableContainer.nativeElement.style.height = `${tableHeight}px`;
      this.mapContainer.nativeElement.style.height = `${mapHeight}px`;
      if (this.map) {
        this.map.invalidateSize(); // Important to redraw the map after resizing
      }
    }
  }

  private onDragEnd = () => {
    this.isDragging = false;
    document.body.style.cursor = '';
    document.removeEventListener('mousemove', this.onDragging);
    document.removeEventListener('mouseup', this.onDragEnd);
  }


  private initMap(): void {
    const mapElement = document.getElementById('map');
    if (mapElement) {
      this.map = L.map('map', {
        center: [20.5937, 78.9629],
        zoom: 5
      });
  
      const tiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        minZoom: 3,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      });
  
      tiles.addTo(this.map);
      
      this.map.invalidateSize();  
    }
  }

  private addMarkers(gateways: any[]): void {
    if (!this.map) return;
    gateways.forEach(gateway => {
      console.log(`Gateway: ${gateway.name}, Lat: ${gateway.location.latitude}, Lng: ${gateway.location.longitude}`);
      if (gateway.location.latitude && gateway.location.longitude) {
        L.marker([parseFloat(gateway.location.latitude), parseFloat(gateway.location.longitude)])
        .addTo(this.map).bindPopup(`<b>${gateway.name}</b>`);
      }
    });
  }

  loadGateways(): void {
    this.appService.getGateways().subscribe({
      next: (response) => {
        console.log('API Response:', response);
        this.rowData = response.response;
        this.rowData.forEach(gateway => {
          gateway.type = gateway.typeGateway ? 'Virtual' : 'Real';
        });
        this.addMarkers(this.rowData);
      },
      error: (err) => {
        console.error('Failed to fetch gateways:', err);
        // Display a modal on a failed API call
        this.showModal('Failed to fetch gateways. Please try again.', true, false);
      }
    });
  }

  onRowSelected(event: RowSelectedEvent) {
    this.selectedRow = event.api.getSelectedNodes().map(node => node.data);
    console.log('Selected Rows:', this.selectedRow);
  }

  navigateToAddGatewayPage(): void {
    this.router.navigate(['/addGateways']);  
    console.log('Navigating to Add New Device page');
  }

  navigateToEditGatewayPage(): void {
    if (this.selectedRow && this.selectedRow.length === 1) {
      const gatewayId = this.selectedRow[0]._id.$oid;
      this.router.navigate(['/edit-gateway', gatewayId]);
      console.log('Navigating to Edit Gateway page for ID:', gatewayId);
    } else {
      // Replaced console.warn with a modal
      this.showModal('Please select exactly one gateway to edit.', true, false);
    }
  }

  deleteGateway(): void {
    if (this.selectedRow && this.selectedRow.length > 0) {
      const message = `Are you sure you want to delete ${this.selectedRow.length} selected gateway(s)?`;
      // Replaced native confirm() with a modal and a callback function
      this.showModal(message, false, true, () => this._confirmDeleteGateways());
    } else {
      // Replaced console.warn with a modal
      this.showModal('Please select at least one gateway to delete.', true, false);
    }
  }

  private _confirmDeleteGateways(): void {
    const gatewayIds = this.selectedRow.map(row => row._id.$oid);
    gatewayIds.forEach(id => {
      this.appService.deleteGateway(id).subscribe({
        next: (response) => {
          console.log('Gateway deleted successfully:', response);
          this.loadGateways();
          this.showModal('Gateway(s) deleted successfully!', false, false);
        },
        error: (error) => {
          console.error('Error deleting gateway:', error);
          this.showModal('Failed to delete gateway(s). Please try again.', true, false);
        }
      });
    });
    this.selectedRow = [];
  }
}