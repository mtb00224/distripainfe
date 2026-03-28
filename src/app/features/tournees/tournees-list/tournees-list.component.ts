import { Component, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subject, switchMap, combineLatest, startWith } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Tournee } from '../../../core/models/tournee.models';
import { Boulangerie } from '../../../core/models/boulangerie.models';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-tournees-list',
  standalone: true,
  imports: [RouterLink, DatePipe, ReactiveFormsModule, LoadingSpinnerComponent, StatusBadgeComponent, PageHeaderComponent],
  templateUrl: './tournees-list.component.html',
})
export class TourneesListComponent implements OnInit {
  private api = inject(ApiService);
  private destroyRef = inject(DestroyRef);

  tournees = signal<Tournee[]>([]);
  boulangeries = signal<Boulangerie[]>([]);
  loading = signal(true);

  dateCtrl = new FormControl(new Date().toISOString().split('T')[0]);
  boulangerieCtrl = new FormControl<number | null>(null);

  ngOnInit(): void {
    this.api.getBoulangeries()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((b) => this.boulangeries.set(b));

    combineLatest([
      this.dateCtrl.valueChanges.pipe(startWith(this.dateCtrl.value)),
      this.boulangerieCtrl.valueChanges.pipe(startWith(this.boulangerieCtrl.value)),
    ]).pipe(
      switchMap(([date, boulangerieId]) => {
        this.loading.set(true);
        return this.api.getTournees({
          date: date || undefined,
          boulangerie_id: boulangerieId ?? undefined,
        });
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (d) => { this.tournees.set(d); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }
}
