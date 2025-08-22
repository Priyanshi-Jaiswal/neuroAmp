import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AppService } from '../../app.service';
import { MatDialog } from '@angular/material/dialog';
import { ColDef, ICellRendererParams, RowSelectedEvent } from 'ag-grid-community';
import { ActionButtonComponent } from '../action-button/action-button.component';

@Component({
  selector: 'app-gateways',
  templateUrl: './gateways.component.html',
  styleUrls: ['./gateways.component.scss']
})

export class GatewaysComponent implements OnInit {
  selectedRow: any[] = [];
  rowData: any[] = [];
  colDefs: ColDef[] = [
    { field: "select", headerName: "", checkboxSelection: true, headerCheckboxSelection: true, flex: 0.3 },
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

  constructor(private appService: AppService, private router: Router, private route: ActivatedRoute, private dialog: MatDialog) { }

  ngOnInit(): void {
    this.loadGateways();
  }

  loadGateways(): void {
    this.appService.getGateways().subscribe({
      next: (response) => {
        this.rowData = response.response;
        this.rowData.forEach(gateway => {
          gateway.type = gateway.typeGateway ? 'Virtual' : 'Real';
        });
      },
      error: (err) => {
        console.error('Failed to fetch gateways:', err);
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
      console.warn('Please select exactly one gateway to edit.');
    }
  }

  deleteGateway(): void {
    if (this.selectedRow && this.selectedRow.length > 0) {
      const gatewayIds = this.selectedRow.map(row => row._id.$oid);
      const confirmation = confirm(`Are you sure you want to delete ${gatewayIds.length} selected gateway(s)?`);
      if (confirmation) {
        gatewayIds.forEach(id => {
          this.appService.deleteGateway(id).subscribe({
            next: (response) => {
              console.log('Gateway deleted successfully:', response);
              this.loadGateways(); // Reload the list after deletion
            },
            error: (error) => {
              console.error('Error deleting gateway:', error);
            }
          });
        });
        this.selectedRow = [];
      }
    } else {
      console.warn('Please select at least one gateway to delete.');
    }
  }
}