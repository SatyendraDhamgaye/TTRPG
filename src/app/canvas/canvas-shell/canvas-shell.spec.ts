import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CanvasShell } from './canvas-shell';

describe('CanvasShell', () => {
  let component: CanvasShell;
  let fixture: ComponentFixture<CanvasShell>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CanvasShell]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CanvasShell);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
