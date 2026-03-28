import { Component, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { DatePipe, DecimalPipe, TitleCasePipe } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { switchMap } from 'rxjs';
import { startWith } from 'rxjs/operators';
import { ApiService } from '../../../core/services/api.service';
import { Encaissement } from '../../../core/models/encaissement.models';
import { Client } from '../../../core/models/client.models';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-encaissements-list',
  standalone: true,
  imports: [RouterLink, DecimalPipe, DatePipe, TitleCasePipe, ReactiveFormsModule, LoadingSpinnerComponent, PageHeaderComponent],
  template: `
    <app-page-header title="Encaissements" subtitle="Historique des paiements reçus" />
    <div class="flex flex-col sm:flex-row gap-3 mb-4">
      <select [formControl]="clientCtrl" class="input-field sm:w-56">
        <option [ngValue]="null">Tous les clients</option>
        @for (c of clients(); track c.id) {
          <option [ngValue]="c.id">{{ c.nom }}{{ c.zone?.nom ? ' (' + c.zone!.nom + ')' : '' }}</option>
        }
      </select>
      <a routerLink="/encaissements/new" class="btn-primary whitespace-nowrap ml-auto">+ Encaisser</a>
    </div>
    @if (loading()) { <app-loading-spinner /> }
    @else {
      <div class="space-y-3">
        @for (e of encaissements(); track e.id) {
          <div class="card flex items-center justify-between">
            <div class="flex items-center gap-3">
              <span class="text-2xl">💰</span>
              <div>
                <div class="flex items-center gap-2 flex-wrap">
                  <p class="font-medium text-gray-900 dark:text-gray-100">{{ e.client?.nom ?? 'Client' }}</p>
                  @if (e.client?.zone?.nom) {
                    <span class="text-xs px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                      📍 {{ e.client!.zone!.nom }}
                    </span>
                  }
                </div>
                <p class="text-xs text-gray-500 dark:text-gray-400">{{ e.date_encaissement | date:'dd/MM/yyyy HH:mm' }}</p>
                <span class="text-xs px-2 py-0.5 rounded-full"
                  [class.bg-green-100]="e.type === 'complet'" [class.text-green-700]="e.type === 'complet'"
                  [class.bg-orange-100]="e.type === 'partiel'" [class.text-orange-700]="e.type === 'partiel'"
                  [class.bg-blue-100]="e.type === 'avance'" [class.text-blue-700]="e.type === 'avance'"
                  [class.bg-purple-100]="e.type === 'dette'" [class.text-purple-700]="e.type === 'dette'">
                  {{ e.type === 'dette' ? '📋 Dette' : (e.type | titlecase) }}
                </span>
              </div>
            </div>
            <span class="text-lg font-bold text-green-600">+ {{ e.montant | number:'1.0-0' }} {{ e.client?.pays?.devise_code ?? '' }}</span>
          </div>
        }
        @if (encaissements().length === 0) {
          <div class="card text-center py-12 text-gray-400">
            <div class="text-4xl mb-3">💰</div>
            <p>Aucun encaissement enregistré</p>
          </div>
        }
      </div>
    }
  `,
})
export class EncaissementsListComponent implements OnInit {
  private api = inject(ApiService);
  private destroyRef = inject(DestroyRef);
  encaissements = signal<Encaissement[]>([]);
  clients = signal<Client[]>([]);
  loading = signal(true);
  clientCtrl = new FormControl<number | null>(null);

  ngOnInit(): void {
    this.api.getClients()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((c) => this.clients.set(c));

    this.clientCtrl.valueChanges.pipe(
      startWith(this.clientCtrl.value),
      switchMap((clientId) => {
        this.loading.set(true);
        return this.api.getEncaissements({ client_id: clientId ?? undefined });
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (d) => { this.encaissements.set(d); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }
}
