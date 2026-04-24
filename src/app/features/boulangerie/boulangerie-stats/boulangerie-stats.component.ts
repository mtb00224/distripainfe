import { Component, inject, signal, computed, effect } from '@angular/core';
import { DecimalPipe, NgTemplateOutlet } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminBoulangerieService } from '../../../core/services/admin-boulangerie.service';
import { StatsBoulangerie, GlobalStatsBoulangerie } from '../../../core/models/production.models';

type TabId = 'active' | 'global';

@Component({
  selector: 'app-boulangerie-stats',
  standalone: true,
  imports: [DecimalPipe, FormsModule, NgTemplateOutlet],
  template: `
    <div class="space-y-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Statistiques</h1>
        <p class="text-gray-500 dark:text-gray-400 text-sm">Résumé financier et production sur la période</p>
      </div>

      <!-- Onglets -->
      <div class="border-b border-gray-200 dark:border-gray-700">
        <nav class="-mb-px flex gap-6">
          <button (click)="activeTab.set('active')"
            class="pb-3 text-sm font-medium border-b-2 transition-colors"
            [class.border-amber-500]="activeTab() === 'active'"
            [class.text-amber-600]="activeTab() === 'active'"
            [class.border-transparent]="activeTab() !== 'active'"
            [class.text-gray-500]="activeTab() !== 'active'">
            {{ boulangerieNom() || 'Boulangerie active' }}
          </button>
          <button (click)="activeTab.set('global')"
            class="pb-3 text-sm font-medium border-b-2 transition-colors"
            [class.border-blue-500]="activeTab() === 'global'"
            [class.text-blue-600]="activeTab() === 'global'"
            [class.border-transparent]="activeTab() !== 'global'"
            [class.text-gray-500]="activeTab() !== 'global'">
            Toutes les boulangeries
          </button>
        </nav>
      </div>

      <!-- Filtres communs -->
      <div class="card flex flex-wrap gap-3 items-end">
        <div>
          <label class="label">Du</label>
          <input type="date" [(ngModel)]="filterDebut" class="input-field" />
        </div>
        <div>
          <label class="label">Au</label>
          <input type="date" [(ngModel)]="filterFin" class="input-field" />
        </div>
        <button (click)="load()" class="btn-primary">Actualiser</button>
        <button (click)="setThisMonth()" class="btn-secondary text-sm">Ce mois</button>
        <button (click)="setThisWeek()" class="btn-secondary text-sm">Cette semaine</button>
      </div>

      <!-- ─── Onglet Boulangerie active ─── -->
      @if (activeTab() === 'active') {
        @if (loading()) {
          <div class="text-center text-gray-400 py-12">Chargement...</div>
        } @else if (stats()) {
          @let s = stats()!;
          <ng-container *ngTemplateOutlet="statsBlock; context: { $implicit: s }"></ng-container>
        }
      }

      <!-- ─── Onglet Toutes boulangeries ─── -->
      @if (activeTab() === 'global') {
        @if (loadingGlobal()) {
          <div class="text-center text-gray-400 py-12">Chargement...</div>
        } @else if (globalStats()) {
          @let g = globalStats()!;

          <!-- Total global -->
          <div class="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
            <h2 class="text-sm font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider mb-3">
              Total — toutes boulangeries
            </h2>
            <ng-container *ngTemplateOutlet="statsBlock; context: { $implicit: g.total, color: 'blue' }"></ng-container>
          </div>

          <!-- Par boulangerie -->
          @if (g.boulangeries.length > 1) {
            <h2 class="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Détail par boulangerie
            </h2>
            @for (b of g.boulangeries; track b.boulangerie_id) {
              <div class="card">
                <h3 class="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                  <span class="text-xl">🏪</span> {{ b.boulangerie_nom }}
                </h3>
                <ng-container *ngTemplateOutlet="statsBlock; context: { $implicit: b }"></ng-container>
              </div>
            }
          } @else if (g.boulangeries.length === 0) {
            <div class="card text-center py-8 text-gray-400">Aucune boulangerie active.</div>
          }
        }
      }
    </div>

    <!-- Template réutilisable pour les KPIs -->
    <ng-template #statsBlock let-s let-color="color">
      <div class="space-y-4">
        <!-- KPIs production -->
        <div>
          <h4 class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Production</h4>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-center">
              <p class="text-2xl font-bold text-gray-900 dark:text-gray-100">{{ s.nb_sessions_total }}</p>
              <p class="text-xs text-gray-400 mt-1">Sessions</p>
              <p class="text-xs text-gray-400">dont {{ s.nb_sessions_cloturees }} clôturées</p>
            </div>
            <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-center">
              <p class="text-2xl font-bold text-gray-900 dark:text-gray-100">{{ s.nb_pains_produits | number:'1.0-0' }}</p>
              <p class="text-xs text-gray-400 mt-1">Pains produits</p>
              <p class="text-xs text-gray-400">{{ s.nb_pains_ambulatoire }} ambulatoire</p>
            </div>
            <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-center">
              <p class="text-2xl font-bold text-gray-900 dark:text-gray-100">{{ s.nb_pains_distribues | number:'1.0-0' }}</p>
              <p class="text-xs text-gray-400 mt-1">Distribués</p>
            </div>
            <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-center">
              <p class="text-2xl font-bold text-gray-900 dark:text-gray-100">{{ s.nb_pains_vendus | number:'1.0-0' }}</p>
              <p class="text-xs text-gray-400 mt-1">Vendus</p>
            </div>
          </div>
        </div>

        <!-- KPIs financiers -->
        <div>
          <h4 class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Finances</h4>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div class="card border-green-200 dark:border-green-800">
              <p class="text-xs text-gray-400 mb-1">Total encaissé</p>
              <p class="text-2xl font-bold text-green-600">{{ s.montant_encaisse | number:'1.0-0' }}</p>
              <p class="text-xs text-gray-400 mt-1">FCFA (dont {{ s.montant_ambulatoire | number:'1.0-0' }} ambulatoire)</p>
            </div>
            <div class="card border-red-200 dark:border-red-800">
              <p class="text-xs text-gray-400 mb-1">Total dépenses</p>
              <p class="text-2xl font-bold text-red-500">{{ s.total_depenses | number:'1.0-0' }}</p>
              <p class="text-xs text-gray-400 mt-1">FCFA</p>
            </div>
            <div class="card"
              [class.border-amber-300]="s.benefice_net >= 0"
              [class.border-red-300]="s.benefice_net < 0">
              <p class="text-xs text-gray-400 mb-1">Bénéfice net</p>
              <p class="text-2xl font-bold"
                [class.text-amber-600]="s.benefice_net >= 0"
                [class.text-red-600]="s.benefice_net < 0">
                {{ s.benefice_net | number:'1.0-0' }}
              </p>
              <p class="text-xs text-gray-400 mt-1">FCFA (encaissé − dépenses)</p>
            </div>
          </div>
        </div>

        @if (s.nb_sessions_total === 0) {
          <p class="text-sm text-gray-400 text-center py-4">Aucune donnée pour cette période.</p>
        }
      </div>
    </ng-template>
  `,
})
export class BoulangerieStatsComponent {
  private service = inject(AdminBoulangerieService);

  stats = signal<StatsBoulangerie | null>(null);
  globalStats = signal<GlobalStatsBoulangerie | null>(null);
  loading = signal(false);
  loadingGlobal = signal(false);
  activeTab = signal<TabId>('active');

  filterDebut = '';
  filterFin = '';

  boulangerieNom = computed(() => this.service.boulangerieActive()?.nom ?? '');

  constructor() {
    // Recharger les stats active quand la boulangerie change ou l'onglet bascule
    effect(() => {
      const bid = this.service.boulangerieActiveId();
      const tab = this.activeTab();
      if (bid !== null && tab === 'active') {
        this._loadActive();
      }
    });

    effect(() => {
      const tab = this.activeTab();
      if (tab === 'global') {
        this._loadGlobal();
      }
    });

    this.setThisMonth();
  }

  load(): void {
    if (this.activeTab() === 'active') {
      this._loadActive();
    } else {
      this._loadGlobal();
    }
  }

  private _loadActive(): void {
    this.loading.set(true);
    const params: any = {};
    if (this.filterDebut) params.date_debut = this.filterDebut;
    if (this.filterFin) params.date_fin = this.filterFin;
    this.service.getStats(params).subscribe({
      next: (s) => { this.stats.set(s); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  private _loadGlobal(): void {
    this.loadingGlobal.set(true);
    const params: any = {};
    if (this.filterDebut) params.date_debut = this.filterDebut;
    if (this.filterFin) params.date_fin = this.filterFin;
    this.service.getGlobalStats(params).subscribe({
      next: (g) => { this.globalStats.set(g); this.loadingGlobal.set(false); },
      error: () => this.loadingGlobal.set(false),
    });
  }

  setThisMonth(): void {
    const now = new Date();
    this.filterDebut = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    this.filterFin = now.toISOString().split('T')[0];
  }

  setThisWeek(): void {
    const now = new Date();
    const monday = new Date(now);
    monday.setDate(now.getDate() - now.getDay() + 1);
    this.filterDebut = monday.toISOString().split('T')[0];
    this.filterFin = now.toISOString().split('T')[0];
  }
}
