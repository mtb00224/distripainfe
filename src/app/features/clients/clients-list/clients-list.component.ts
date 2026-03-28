import { Component, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { combineLatest, switchMap } from 'rxjs';
import { debounceTime, distinctUntilChanged, startWith } from 'rxjs/operators';
import { ApiService } from '../../../core/services/api.service';
import { Client } from '../../../core/models/client.models';
import { Zone } from '../../../core/models/zone.models';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-clients-list',
  standalone: true,
  imports: [RouterLink, DecimalPipe, ReactiveFormsModule, LoadingSpinnerComponent, StatusBadgeComponent, PageHeaderComponent, ConfirmDialogComponent],
  templateUrl: './clients-list.component.html',
})
export class ClientsListComponent implements OnInit {
  private api = inject(ApiService);
  private destroyRef = inject(DestroyRef);
  clients = signal<Client[]>([]);
  zones = signal<Zone[]>([]);
  loading = signal(true);
  showConfirm = signal(false);
  toDelete = signal<Client | null>(null);

  searchCtrl = new FormControl('');
  zoneCtrl = new FormControl<number | null>(null);

  ngOnInit(): void {
    this.api.getZones()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((z) => this.zones.set(z));

    combineLatest([
      this.searchCtrl.valueChanges.pipe(startWith(this.searchCtrl.value), debounceTime(300), distinctUntilChanged()),
      this.zoneCtrl.valueChanges.pipe(startWith(this.zoneCtrl.value)),
    ]).pipe(
      switchMap(([search, zoneId]) => {
        this.loading.set(true);
        return this.api.getClients({ search: search || undefined, zone_id: zoneId ?? undefined });
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (d) => { this.clients.set(d); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  load(): void {
    this.loading.set(true);
    this.api.getClients({
      search: this.searchCtrl.value || undefined,
      zone_id: this.zoneCtrl.value ?? undefined,
    }).pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (d) => { this.clients.set(d); this.loading.set(false); },
        error: () => this.loading.set(false),
      });
  }

  getStatusForSolde(solde: number): string {
    return solde > 0 ? 'impaye' : 'solde';
  }

  confirmDelete(c: Client): void { this.toDelete.set(c); this.showConfirm.set(true); }
  doDelete(): void {
    this.api.deleteClient(this.toDelete()!.id).subscribe({ next: () => { this.showConfirm.set(false); this.load(); } });
  }
}
