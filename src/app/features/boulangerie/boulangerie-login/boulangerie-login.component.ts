import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-boulangerie-login',
  standalone: true,
  template: '',
})
export class BoulangerieLoginComponent implements OnInit {
  private router = inject(Router);

  ngOnInit(): void {
    this.router.navigate(['/login']);
  }
}
