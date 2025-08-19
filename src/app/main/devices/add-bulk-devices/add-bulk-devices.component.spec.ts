import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddBulkDevicesComponent } from './add-bulk-devices.component';

describe('AddBulkDevicesComponent', () => {
  let component: AddBulkDevicesComponent;
  let fixture: ComponentFixture<AddBulkDevicesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AddBulkDevicesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddBulkDevicesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
