import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe, DecimalPipe } from '@angular/common';
import { AdminApiService } from '../../../core/services/admin-api.service';
import { LivreurDetailStats } from '../../../core/models/admin.models';

@Component({
  selector: 'app-admin-livreur-detail',
  standalone: true,
  imports: [RouterLink, DatePipe, DecimalPipe],
  template: `
    <div class="p-6">
      <a routerLink="/admin/livreurs"
        class="inline-flex items-center gap-1 text-gray-400 hover:text-white text-sm mb-4 transition-colors">
        ← Retour aux livreurs
      </a>

      @if (loading()) {
        <div class="flex items-center justify-center h-48 text-gray-400">Chargement...</div>
      } @else if (detail()) {
        @let d = detail()!;
        @let lv = d.livreur;

        <!-- Header -->
        <div class="bg-gray-800 rounded-xl border border-gray-700 p-5 mb-4">
          <div class="flex items-start justify-between">
            <div>
              <div class="flex items-center gap-3 mb-1">
                <h1 class="text-xl font-bold text-white">{{ lv.nom }}</h1>
                @if (!lv.is_active) {
                  <span class="text-xs bg-red-900 text-red-300 px-2 py-0.5 rounded-full">Désactivé</span>
                }
              </div>
              <p class="text-gray-400 text-sm">{{ lv.email }}</p>
              @if (lv.telephone) {
                <p class="text-gray-400 text-sm">{{ lv.telephone }}</p>
              }
              <p class="text-gray-500 text-xs mt-1">Inscrit le {{ lv.created_at | date:'dd/MM/yyyy' }}</p>
              @if (lv.pays) {
                <p class="text-indigo-400 text-xs mt-1">🌍 {{ lv.pays.nom }} — {{ lv.pays.devise_nom }} ({{ lv.pays.devise_code }})</p>
              }
            </div>
            <div class="text-right">
              <p class="text-xs text-gray-400">{{ lv.nb_acolytes }} acolyte(s)</p>
              @if (lv.last_activity) {
                <p class="text-xs text-gray-500 mt-1">Dernière activité : {{ lv.last_activity | date:'dd/MM/yyyy' }}</p>
              }
              @if (lv.last_device) {
                <p class="text-xs text-gray-500">{{ lv.last_device }} · {{ lv.last_platform }}</p>
              }
            </div>
          </div>
        </div>

        <!-- KPI row -->
        <div class="grid grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
          <div class="bg-gray-800 rounded-xl border border-gray-700 p-3 text-center">
            <p class="text-xl font-bold text-white">{{ lv.nb_clients }}</p>
            <p class="text-xs text-gray-400">Clients</p>
          </div>
          <div class="bg-gray-800 rounded-xl border border-gray-700 p-3 text-center">
            <p class="text-xl font-bold text-white">{{ lv.nb_tournees_total }}</p>
            <p class="text-xs text-gray-400">Tournées</p>
          </div>
          <div class="bg-gray-800 rounded-xl border border-gray-700 p-3 text-center">
            <p class="text-xl font-bold text-white">{{ lv.nb_tournees_30d }}</p>
            <p class="text-xs text-gray-400">Tournées 30j</p>
          </div>
          <div class="bg-gray-800 rounded-xl border border-gray-700 p-3 text-center">
            <p class="text-xl font-bold text-white">{{ lv.nb_pains_total }}</p>
            <p class="text-xs text-gray-400">Pains distribués</p>
          </div>
          <div class="bg-gray-800 rounded-xl border border-gray-700 p-3 text-center">
            <p class="text-xl font-bold text-green-400">{{ lv.revenue_total | number:'1.0-0' }}</p>
            <p class="text-xs text-gray-400">{{ lv.pays?.devise_code ?? '' }} total</p>
          </div>
          <div class="bg-gray-800 rounded-xl border border-gray-700 p-3 text-center">
            <p class="text-xl font-bold text-green-400">{{ lv.revenue_30d | number:'1.0-0' }}</p>
            <p class="text-xs text-gray-400">{{ lv.pays?.devise_code ?? '' }} 30j</p>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">

          <!-- Device breakdown -->
          <div class="bg-gray-800 rounded-xl border border-gray-700 p-4">
            <h2 class="text-sm font-semibold text-gray-300 mb-3">Appareils utilisés</h2>
            @let totalSessions = d.device_breakdown.mobile + d.device_breakdown.tablet + d.device_breakdown.desktop;
            @if (totalSessions === 0) {
              <p class="text-gray-500 text-sm">Aucune session enregistrée</p>
            } @else {
              <div class="space-y-3">
                @for (item of deviceItems(d); track item.label) {
                  <div>
                    <div class="flex justify-between text-sm mb-1">
                      <span class="text-gray-400">{{ item.icon }} {{ item.label }}</span>
                      <span class="text-white">{{ item.count }} <span class="text-gray-500">({{ totalSessions ? ((item.count / totalSessions) * 100 | number:'1.0-0') : 0 }}%)</span></span>
                    </div>
                    <div class="h-1.5 bg-gray-700 rounded-full">
                      <div class="h-1.5 rounded-full" [class]="item.color" [style.width.%]="totalSessions ? (item.count / totalSessions) * 100 : 0"></div>
                    </div>
                  </div>
                }
              </div>
            }
          </div>

          <!-- Platform breakdown -->
          <div class="bg-gray-800 rounded-xl border border-gray-700 p-4">
            <h2 class="text-sm font-semibold text-gray-300 mb-3">Plateformes</h2>
            <div class="space-y-2">
              @for (p of platformItems(d); track p.label) {
                @if (p.count > 0) {
                  <div class="flex items-center justify-between text-sm">
                    <span class="text-gray-400">{{ p.icon }} {{ p.label }}</span>
                    <span class="text-white">{{ p.count }}</span>
                  </div>
                }
              }
              @if (allZero(d.platform_breakdown)) {
                <p class="text-gray-500 text-sm">Aucune session enregistrée</p>
              }
            </div>
          </div>
        </div>

        <!-- Monthly revenue -->
        @if (d.monthly_revenue.length > 0) {
          <div class="bg-gray-800 rounded-xl border border-gray-700 p-4 mb-4">
            <h2 class="text-sm font-semibold text-gray-300 mb-3">Revenus mensuels (12 derniers mois)</h2>
            @let maxRevenue = maxRev(d.monthly_revenue);
            <div class="flex items-end gap-1 h-24">
              @for (m of d.monthly_revenue; track m.month) {
                <div class="flex-1 flex flex-col items-center gap-1">
                  <div class="w-full bg-indigo-600 rounded-sm"
                    [style.height.px]="maxRevenue > 0 ? (m.revenue / maxRevenue) * 80 : 0"
                    [title]="m.month + ': ' + (m.revenue | number:'1.0-0') + ' ' + (lv.pays?.devise_code ?? '')">
                  </div>
                  <p class="text-xs text-gray-500 hidden lg:block" style="font-size: 9px">{{ m.month.slice(5) }}</p>
                </div>
              }
            </div>
            <div class="flex justify-between text-xs text-gray-500 mt-2">
              <span>{{ d.monthly_revenue[0]?.month }}</span>
              <span>{{ d.monthly_revenue[d.monthly_revenue.length - 1]?.month }}</span>
            </div>
          </div>
        }

        <!-- Recent sessions -->
        @if (d.recent_sessions.length > 0) {
          <div class="bg-gray-800 rounded-xl border border-gray-700 p-4">
            <h2 class="text-sm font-semibold text-gray-300 mb-3">Dernières connexions</h2>
            <div class="space-y-2">
              @for (session of d.recent_sessions; track session.logged_in_at) {
                <div class="flex items-center justify-between text-sm py-1 border-b border-gray-700 last:border-0">
                  <div class="flex items-center gap-2">
                    <span>{{ deviceIcon(session.device_type) }}</span>
                    <span class="text-gray-300">{{ session.platform }} · {{ session.browser }}</span>
                  </div>
                  <span class="text-gray-500 text-xs">{{ session.logged_in_at | date:'dd/MM/yyyy HH:mm' }}</span>
                </div>
              }
            </div>
          </div>
        }
      }
    </div>
  `,
})
export class AdminLivreurDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private adminApi = inject(AdminApiService);

  detail = signal<LivreurDetailStats | null>(null);
  loading = signal(true);

  ngOnInit(): void {
    const id = +this.route.snapshot.paramMap.get('id')!;
    this.adminApi.loadToken();
    this.adminApi.getLivreurDetail(id).subscribe({
      next: (d) => { this.detail.set(d); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  deviceIcon(type: string): string {
    if (type === 'mobile') return '📱';
    if (type === 'tablet') return '📟';
    return '🖥️';
  }

  deviceItems(d: LivreurDetailStats) {
    return [
      { label: 'Mobile', icon: '📱', count: d.device_breakdown.mobile, color: 'bg-green-500' },
      { label: 'Desktop', icon: '🖥️', count: d.device_breakdown.desktop, color: 'bg-blue-500' },
      { label: 'Tablette', icon: '📟', count: d.device_breakdown.tablet, color: 'bg-purple-500' },
    ];
  }

  platformItems(d: LivreurDetailStats) {
    return [
      { label: 'Android', icon: '🤖', count: d.platform_breakdown.android },
      { label: 'iOS', icon: '🍎', count: d.platform_breakdown.ios },
      { label: 'Windows', icon: '🪟', count: d.platform_breakdown.windows },
      { label: 'macOS', icon: '💻', count: d.platform_breakdown.macos },
      { label: 'Linux', icon: '🐧', count: d.platform_breakdown.linux },
      { label: 'Autre', icon: '❓', count: d.platform_breakdown.other },
    ];
  }

  allZero(pb: any): boolean {
    return !pb.android && !pb.ios && !pb.windows && !pb.macos && !pb.linux && !pb.other;
  }

  maxRev(monthly: { month: string; revenue: number }[]): number {
    return Math.max(...monthly.map((m) => m.revenue), 1);
  }
}
