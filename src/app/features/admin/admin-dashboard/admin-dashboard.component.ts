import { Component, inject, signal, OnInit } from '@angular/core';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdminApiService } from '../../../core/services/admin-api.service';
import { PlatformStats } from '../../../core/models/admin.models';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CurrencyPipe, DecimalPipe, RouterLink],
  template: `
    <div class="p-6">
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-white">Dashboard plateforme</h1>
        <p class="text-gray-400 text-sm mt-1">Vue d'ensemble de l'utilisation de DistriPain</p>
      </div>

      @if (loading()) {
        <div class="flex items-center justify-center h-48">
          <div class="text-gray-400">Chargement...</div>
        </div>
      } @else if (stats()) {
        @let s = stats()!;

        <!-- KPI Cards -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div class="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <p class="text-xs text-gray-400 uppercase tracking-wider mb-1">Livreurs actifs</p>
            <p class="text-3xl font-bold text-white">{{ s.active_livreurs }}</p>
            <p class="text-xs text-gray-500 mt-1">/ {{ s.total_livreurs }} total</p>
          </div>
          <div class="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <p class="text-xs text-gray-400 uppercase tracking-wider mb-1">Clients actifs</p>
            <p class="text-3xl font-bold text-white">{{ s.total_clients }}</p>
          </div>
          <div class="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <p class="text-xs text-gray-400 uppercase tracking-wider mb-1">Tournées totales</p>
            <p class="text-3xl font-bold text-white">{{ s.total_tournees }}</p>
          </div>
          <div class="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <p class="text-xs text-gray-400 uppercase tracking-wider mb-1">Encaissements (brut)</p>
            <p class="text-2xl font-bold text-green-400">
              {{ s.total_encaissements_fcfa | number:'1.0-0' }}
            </p>
            <p class="text-xs text-gray-500 mt-1">Multi-devises</p>
          </div>
        </div>

        <!-- Sessions + Device Usage -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">

          <!-- Sessions summary -->
          <div class="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <h2 class="text-sm font-semibold text-gray-300 mb-3">Sessions</h2>
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-gray-400 text-sm">Total</span>
                <span class="text-white font-semibold">{{ s.sessions_total }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-gray-400 text-sm">30 derniers jours</span>
                <span class="text-indigo-400 font-semibold">{{ s.sessions_30d }}</span>
              </div>
            </div>
          </div>

          <!-- Device breakdown -->
          <div class="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <h2 class="text-sm font-semibold text-gray-300 mb-3">Appareils</h2>
            @let total = s.sessions_total || 1;
            <div class="space-y-2">
              <div>
                <div class="flex justify-between text-sm mb-1">
                  <span class="text-gray-400">📱 Mobile</span>
                  <span class="text-white">{{ s.device_breakdown.mobile }}</span>
                </div>
                <div class="h-1.5 bg-gray-700 rounded-full">
                  <div class="h-1.5 bg-green-500 rounded-full" [style.width.%]="(s.device_breakdown.mobile / total) * 100"></div>
                </div>
              </div>
              <div>
                <div class="flex justify-between text-sm mb-1">
                  <span class="text-gray-400">🖥️ Desktop</span>
                  <span class="text-white">{{ s.device_breakdown.desktop }}</span>
                </div>
                <div class="h-1.5 bg-gray-700 rounded-full">
                  <div class="h-1.5 bg-blue-500 rounded-full" [style.width.%]="(s.device_breakdown.desktop / total) * 100"></div>
                </div>
              </div>
              <div>
                <div class="flex justify-between text-sm mb-1">
                  <span class="text-gray-400">📟 Tablette</span>
                  <span class="text-white">{{ s.device_breakdown.tablet }}</span>
                </div>
                <div class="h-1.5 bg-gray-700 rounded-full">
                  <div class="h-1.5 bg-purple-500 rounded-full" [style.width.%]="(s.device_breakdown.tablet / total) * 100"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Platform breakdown -->
          <div class="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <h2 class="text-sm font-semibold text-gray-300 mb-3">Plateformes</h2>
            <div class="space-y-1.5">
              @for (p of platformItems(s); track p.label) {
                @if (p.count > 0) {
                  <div class="flex items-center justify-between text-sm">
                    <span class="text-gray-400">{{ p.icon }} {{ p.label }}</span>
                    <span class="text-white">{{ p.count }}</span>
                  </div>
                }
              }
            </div>
          </div>
        </div>

        <!-- Quick link to livreurs -->
        <div class="bg-gray-800 rounded-xl p-4 border border-gray-700 flex items-center justify-between">
          <div>
            <p class="text-white font-medium">Voir les performances par livreur</p>
            <p class="text-gray-400 text-sm">Revenus, tournées, clients, appareils utilisés</p>
          </div>
          <a routerLink="/admin/livreurs"
            class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors">
            Voir →
          </a>
        </div>
      }
    </div>
  `,
})
export class AdminDashboardComponent implements OnInit {
  private adminApi = inject(AdminApiService);

  stats = signal<PlatformStats | null>(null);
  loading = signal(true);

  ngOnInit(): void {
    this.adminApi.loadToken();
    this.adminApi.getStats().subscribe({
      next: (s) => { this.stats.set(s); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  platformItems(s: PlatformStats) {
    return [
      { label: 'Android', icon: '🤖', count: s.platform_breakdown.android },
      { label: 'iOS', icon: '🍎', count: s.platform_breakdown.ios },
      { label: 'Windows', icon: '🪟', count: s.platform_breakdown.windows },
      { label: 'macOS', icon: '💻', count: s.platform_breakdown.macos },
      { label: 'Linux', icon: '🐧', count: s.platform_breakdown.linux },
      { label: 'Autre', icon: '❓', count: s.platform_breakdown.other },
    ];
  }
}
