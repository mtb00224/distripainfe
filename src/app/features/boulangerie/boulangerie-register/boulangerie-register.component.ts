import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-boulangerie-register',
  standalone: true,
  template: '',
})
export class BoulangerieRegisterComponent implements OnInit {
  private router = inject(Router);

  ngOnInit(): void {
    this.router.navigate(['/register']);
  }
}
