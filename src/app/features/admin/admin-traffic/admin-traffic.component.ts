import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { DatePipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminApiService } from '../../../core/services/admin-api.service';
import { TrafficEntry, TrafficStats } from '../../../core/models/admin.models';

@Component({
  selector: 'app-admin-traffic',
  standalone: true,
  imports: [DatePipe, FormsModule, NgClass],
  template: `
    <div class="p-6">
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-white">Trafic utilisateurs</h1>
        <p class="text-gray-400 text-sm mt-1">Journal de connexion — appareils, IPs, sessions</p>
      </div>

      @if (loadingStats()) {
        <div class="flex items-center justify-center h-24 text-gray-400">Chargement...</div>
      } @else if (stats()) {
        @let s = stats()!;

        <!-- KPI row -->
        <div class="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div class="bg-gray-800 rounded-xl border border-gray-700 p-4">
            <p class="text-xs text-gray-400 uppercase tracking-wider mb-1">Sessions totales</p>
            <p class="text-3xl font-bold text-white">{{ s.total_sessions }}</p>
          </div>
          <div class="bg-gray-800 rounded-xl border border-gray-700 p-4">
            <p class="text-xs text-gray-400 uppercase tracking-wider mb-1">Sessions 7 derniers jours</p>
            <p class="text-3xl font-bold text-indigo-400">{{ s.sessions_7d }}</p>
          </div>
          <div class="bg-gray-800 rounded-xl border border-gray-700 p-4 col-span-2 lg:col-span-1">
            <p class="text-xs text-gray-400 uppercase tracking-wider mb-1">IPs uniques (7j)</p>
            <p class="text-3xl font-bold text-green-400">{{ s.unique_ips_7d }}</p>
          </div>
        </div>

        <!-- Activity chart (last 14 days) -->
        @if (s.sessions_per_day.length > 0) {
          <div class="bg-gray-800 rounded-xl border border-gray-700 p-4 mb-6">
            <h2 class="text-sm font-semibold text-gray-300 mb-4">Activité — 14 derniers jours</h2>
            @let maxCount = maxDay(s.sessions_per_day);
            <div class="flex items-end gap-1.5 h-20">
              @for (day of s.sessions_per_day; track day.date) {
                <div class="flex-1 flex flex-col items-center gap-1 group relative">
                  <div
                    class="w-full bg-indigo-600 hover:bg-indigo-500 rounded-sm transition-colors cursor-default"
                    [style.height.px]="maxCount > 0 ? (day.count / maxCount) * 64 : 2"
                    [title]="day.date + ' : ' + day.count + ' session(s)'">
                  </div>
                  <p class="text-gray-600 hidden lg:block" style="font-size: 9px">{{ day.date.slice(5) }}</p>
                </div>
              }
            </div>
          </div>
        }
      }

      <!-- Filters -->
      <div class="flex gap-3 mb-4 flex-wrap items-center">
        <input
          type="text"
          [ngModel]="search()"
          (ngModelChange)="search.set($event)"
          placeholder="Filtrer par nom, IP, navigateur..."
          class="flex-1 min-w-48 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <select
          [ngModel]="filterDevice()"
          (ngModelChange)="filterDevice.set($event)"
          class="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="">Tous appareils</option>
          <option value="mobile">Mobile</option>
          <option value="tablet">Tablette</option>
          <option value="desktop">Desktop</option>
        </select>
        <select
          [ngModel]="filterUserType()"
          (ngModelChange)="filterUserType.set($event)"
          class="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="">Tous types</option>
          <option value="livreur">Livreur</option>
          <option value="acolyte_livreur">Acolyte</option>
        </select>
        <span class="text-gray-400 text-sm">{{ filtered().length }} résultat(s)</span>
      </div>

      <!-- Sessions table -->
      @if (loadingSessions()) {
        <div class="flex items-center justify-center h-48 text-gray-400">Chargement des sessions...</div>
      } @else {
        <div class="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <!-- Table header -->
          <div class="grid grid-cols-12 gap-2 px-4 py-2 border-b border-gray-700 text-xs text-gray-400 uppercase tracking-wider">
            <div class="col-span-1">Type</div>
            <div class="col-span-3">Utilisateur</div>
            <div class="col-span-2">IP</div>
            <div class="col-span-2">Appareil</div>
            <div class="col-span-2">Navigateur</div>
            <div class="col-span-2 text-right">Date</div>
          </div>

          @if (filtered().length === 0) {
            <div class="text-center py-12 text-gray-500">Aucune session trouvée</div>
          }

          @for (entry of filtered(); track entry.id) {
            <div class="grid grid-cols-12 gap-2 px-4 py-3 border-b border-gray-700/50 last:border-0 hover:bg-gray-750 transition-colors items-center">

              <!-- Type badge -->
              <div class="col-span-1">
                <span class="text-xs px-1.5 py-0.5 rounded font-medium"
                  [ngClass]="entry.role === 'acolyte_livreur'
                    ? 'bg-amber-900/50 text-amber-300'
                    : 'bg-indigo-900/50 text-indigo-300'">
                  {{ entry.role === 'acolyte_livreur' ? 'AC' : 'LV' }}
                </span>
              </div>

              <!-- Utilisateur -->
              <div class="col-span-3 min-w-0">
                <p class="text-white text-sm truncate font-medium">{{ entry.username }}</p>
                <p class="text-xs text-gray-500 truncate">{{ entry.role }}</p>
              </div>

              <!-- IP -->
              <div class="col-span-2">
                <span class="text-gray-300 text-sm font-mono">{{ entry.ip_address ?? '—' }}</span>
              </div>

              <!-- Appareil + plateforme -->
              <div class="col-span-2">
                <div class="flex items-center gap-1">
                  <span>{{ deviceIcon(entry.device_type) }}</span>
                  <span class="text-gray-300 text-sm truncate">{{ entry.platform }}</span>
                </div>
                <p class="text-gray-500 text-xs">{{ entry.device_type }}</p>
              </div>

              <!-- Navigateur -->
              <div class="col-span-2">
                <div class="flex items-center gap-1">
                  <span>{{ browserIcon(entry.browser) }}</span>
                  <span class="text-gray-300 text-sm">{{ entry.browser }}</span>
                </div>
              </div>

              <!-- Date + delete -->
              <div class="col-span-2 text-right flex flex-col items-end gap-1">
                <p class="text-gray-300 text-sm">{{ entry.logged_in_at | date:'dd/MM/yyyy' }}</p>
                <p class="text-gray-500 text-xs">{{ entry.logged_in_at | date:'HH:mm' }}</p>
                <button (click)="deleteSession(entry.id)"
                  class="text-xs text-red-500 hover:text-red-400 transition-colors mt-0.5">
                  Supprimer
                </button>
              </div>
            </div>
          }
        </div>

        <!-- Load more -->
        @if (entries().length >= limit) {
          <div class="mt-4 text-center">
            <button (click)="loadMore()"
              class="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm rounded-lg transition-colors">
              Charger plus
            </button>
          </div>
        }
      }
    </div>
  `,
})
export class AdminTrafficComponent implements OnInit {
  private adminApi = inject(AdminApiService);

  stats = signal<TrafficStats | null>(null);
  entries = signal<TrafficEntry[]>([]);
  loadingStats = signal(true);
  loadingSessions = signal(true);
  search = signal('');
  filterDevice = signal('');
  filterUserType = signal('');
  limit = 100;

  filtered = computed(() => {
    const q = this.search().toLowerCase();
    const dev = this.filterDevice();
    const type = this.filterUserType();
    return this.entries().filter((e) => {
      if (dev && e.device_type !== dev) return false;
      if (type && e.role !== type) return false;
      if (q) {
        const hay = `${e.username} ${e.ip_address ?? ''} ${e.browser} ${e.platform}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  });

  ngOnInit(): void {
    this.adminApi.loadToken();
    this.adminApi.getTrafficStats().subscribe({
      next: (s) => { this.stats.set(s); this.loadingStats.set(false); },
      error: () => this.loadingStats.set(false),
    });
    this._loadSessions(0);
  }

  loadMore(): void {
    this._loadSessions(this.entries().length);
  }

  private _loadSessions(offset: number): void {
    this.loadingSessions.set(true);
    this.adminApi.getTraffic(this.limit, offset).subscribe({
      next: (data) => {
        this.entries.update((prev) => (offset === 0 ? data : [...prev, ...data]));
        this.loadingSessions.set(false);
      },
      error: () => this.loadingSessions.set(false),
    });
  }

  deleteSession(id: number): void {
    if (!confirm('Supprimer cette session ?')) return;
    this.adminApi.deleteTrafficSession(id).subscribe({
      next: () => this.entries.update((list) => list.filter((e) => e.id !== id)),
      error: () => alert('Erreur lors de la suppression'),
    });
  }

  maxDay(days: { date: string; count: number }[]): number {
    return Math.max(...days.map((d) => d.count), 1);
  }

  deviceIcon(type: string): string {
    if (type === 'mobile') return '📱';
    if (type === 'tablet') return '📟';
    return '🖥️';
  }

  browserIcon(browser: string): string {
    const map: Record<string, string> = {
      Chrome: '🟡', Firefox: '🦊', Safari: '🧭', Edge: '🔵', Opera: '🔴',
    };
    return map[browser] ?? '🌐';
  }
}
