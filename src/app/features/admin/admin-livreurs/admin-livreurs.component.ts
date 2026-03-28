import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatePipe, DecimalPipe } from '@angular/common';
import { AdminApiService } from '../../../core/services/admin-api.service';
import { LivreurPerformance } from '../../../core/models/admin.models';

@Component({
  selector: 'app-admin-livreurs',
  standalone: true,
  imports: [RouterLink, FormsModule, DatePipe, DecimalPipe],
  template: `
    <div class="p-6">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-white">Livreurs</h1>
          <p class="text-gray-400 text-sm mt-1">{{ livreurs().length }} livreur(s) enregistré(s)</p>
        </div>
        <input
          type="text"
          [ngModel]="search()"
          (ngModelChange)="search.set($event)"
          placeholder="Rechercher..."
          class="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      @if (loading()) {
        <div class="flex items-center justify-center h-48 text-gray-400">Chargement...</div>
      } @else {
        <!-- Sort controls -->
        <div class="flex gap-2 mb-4 flex-wrap">
          @for (opt of sortOptions; track opt.key) {
            <button (click)="setSort(opt.key)"
              class="px-3 py-1 rounded-full text-xs font-medium transition-colors"
              [class.bg-indigo-600]="sortBy() === opt.key"
              [class.text-white]="sortBy() === opt.key"
              [class.bg-gray-700]="sortBy() !== opt.key"
              [class.text-gray-300]="sortBy() !== opt.key">
              {{ opt.label }}
            </button>
          }
        </div>

        <div class="space-y-3">
          @for (lv of filtered(); track lv.id) {
            <div class="bg-gray-800 rounded-xl border border-gray-700 p-4">
              <div class="flex items-start justify-between">
                <!-- Left: name + status -->
                <div class="flex items-center gap-3 flex-1 min-w-0">
                  <div class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                    [class.bg-indigo-700]="lv.is_active"
                    [class.bg-gray-700]="!lv.is_active">
                    <span class="text-lg">🚚</span>
                  </div>
                  <div class="min-w-0">
                    <div class="flex items-center gap-2">
                      <p class="font-semibold text-white truncate">{{ lv.nom }}</p>
                      @if (!lv.is_active) {
                        <span class="text-xs bg-red-900 text-red-300 px-2 py-0.5 rounded-full flex-shrink-0">Désactivé</span>
                      }
                    </div>
                    <p class="text-xs text-gray-400 truncate">{{ lv.email }}</p>
                    <p class="text-xs text-gray-500 mt-0.5">
                      Inscrit {{ lv.created_at | date:'dd/MM/yyyy' }}
                      @if (lv.last_platform) { · 📱 {{ lv.last_platform }} }
                      @if (lv.pays) {
                        · <span class="text-indigo-400">🌍 {{ lv.pays.nom }} ({{ lv.pays.devise_code }})</span>
                      }
                    </p>
                  </div>
                </div>

                <!-- Right: actions -->
                <div class="flex items-center gap-2 flex-shrink-0 ml-2">
                  <a [routerLink]="['/admin/livreurs', lv.id]"
                    class="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs rounded-lg transition-colors">
                    Détails
                  </a>
                  <button (click)="toggleActive(lv)"
                    class="px-3 py-1.5 text-xs rounded-lg transition-colors"
                    [class.bg-red-900]="lv.is_active"
                    [class.text-red-300]="lv.is_active"
                    [class.bg-green-900]="!lv.is_active"
                    [class.text-green-300]="!lv.is_active">
                    {{ lv.is_active ? 'Désactiver' : 'Activer' }}
                  </button>
                </div>
              </div>

              <!-- Metrics row -->
              <div class="grid grid-cols-5 gap-2 mt-4 pt-3 border-t border-gray-700">
                <div class="text-center">
                  <p class="text-lg font-bold text-white">{{ lv.nb_clients }}</p>
                  <p class="text-xs text-gray-400">Clients</p>
                </div>
                <div class="text-center">
                  <p class="text-lg font-bold text-white">{{ lv.nb_tournees_total }}</p>
                  <p class="text-xs text-gray-400">Tournées</p>
                </div>
                <div class="text-center">
                  <p class="text-lg font-bold text-white">{{ lv.nb_tournees_30d }}</p>
                  <p class="text-xs text-gray-400">Tournées 30j</p>
                </div>
                <div class="text-center">
                  <p class="text-lg font-bold text-white">{{ lv.nb_pains_total }}</p>
                  <p class="text-xs text-gray-400">Pains</p>
                </div>
                <div class="text-center">
                  <p class="text-lg font-bold text-green-400">{{ lv.revenue_30d | number:'1.0-0' }}</p>
                  <p class="text-xs text-gray-400">{{ lv.pays?.devise_code ?? '' }} 30j</p>
                </div>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class AdminLivreursComponent implements OnInit {
  private adminApi = inject(AdminApiService);

  livreurs = signal<LivreurPerformance[]>([]);
  loading = signal(true);
  search = signal('');
  sortBy = signal('revenue_30d');

  sortOptions = [
    { key: 'revenue_30d', label: 'Revenus 30j ↓' },
    { key: 'nb_tournees_total', label: 'Tournées ↓' },
    { key: 'nb_clients', label: 'Clients ↓' },
    { key: 'nb_pains_total', label: 'Pains ↓' },
    { key: 'created_at', label: 'Récents d\'abord' },
  ];

  filtered = computed(() => {
    let list = this.livreurs();
    const q = this.search().toLowerCase();
    if (q) {
      list = list.filter((lv) => lv.nom.toLowerCase().includes(q) || lv.email.toLowerCase().includes(q));
    }
    const sort = this.sortBy();
    return [...list].sort((a, b) => {
      if (sort === 'created_at') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      return (b as any)[sort] - (a as any)[sort];
    });
  });

  ngOnInit(): void {
    this.adminApi.loadToken();
    this.adminApi.getLivreurs().subscribe({
      next: (lv) => { this.livreurs.set(lv); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  setSort(key: string): void {
    this.sortBy.set(key);
  }

  toggleActive(lv: LivreurPerformance): void {
    const action = lv.is_active ? 'désactiver' : 'activer';
    if (!confirm(`Voulez-vous ${action} le compte de ${lv.nom} ?`)) return;
    this.adminApi.toggleLivreur(lv.id, !lv.is_active).subscribe({
      next: (updated) => {
        this.livreurs.update((list) => list.map((l) => l.id === updated.id ? updated : l));
      },
    });
  }
}
