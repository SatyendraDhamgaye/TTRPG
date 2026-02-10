import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CanvasSidebar } from './canvas-sidebar';


describe('CanvasSidebar', () => {
  let component: CanvasSidebar;
  let fixture: ComponentFixture<CanvasSidebar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CanvasSidebar]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CanvasSidebar);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
