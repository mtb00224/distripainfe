import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AdminApiService } from '../../../core/services/admin-api.service';
import { LivreurPermissions } from '../../../core/models/admin.models';
import { LivreurPerformance } from '../../../core/models/admin.models';

const ALL_PERMISSIONS = [
  { key: 'read_tournees', label: 'Voir les tournées' },
  { key: 'write_tournees', label: 'Créer/modifier des tournées' },
  { key: 'read_clients', label: 'Voir les clients' },
  { key: 'write_clients', label: 'Créer/modifier des clients' },
  { key: 'read_encaissements', label: 'Voir les encaissements' },
  { key: 'write_encaissements', label: 'Saisir des encaissements' },
  { key: 'read_zones', label: 'Voir les zones' },
  { key: 'write_zones', label: 'Créer/modifier des zones' },
  { key: 'read_boulangeries', label: 'Voir les boulangeries' },
  { key: 'write_boulangeries', label: 'Créer/modifier des boulangeries' },
  { key: 'read_stats', label: 'Voir les statistiques' },
];

@Component({
  selector: 'app-admin-livreur-permissions',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="p-6 max-w-4xl">
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-white">Permissions des livreurs</h1>
        <p class="text-gray-400 text-sm mt-1">Restreignez l'accès de chaque livreur à certaines fonctionnalités</p>
      </div>

      @if (loading()) {
        <div class="text-center py-16 text-gray-500">Chargement...</div>
      } @else {
        <div class="space-y-4">
          @for (livreur of livreurs(); track livreur.id) {
            <div class="bg-gray-800 rounded-xl border border-gray-700 p-5">
              <div class="flex items-center justify-between mb-4">
                <div>
                  <p class="text-white font-semibold">{{ livreur.nom }}</p>
                  <p class="text-gray-400 text-sm">{{ livreur.email }}</p>
                </div>
                <div class="flex items-center gap-3">
                  @if (getPermissions(livreur.id) === null) {
                    <span class="text-xs px-2.5 py-1 bg-green-900/50 text-green-300 rounded-full">Accès complet</span>
                  } @else {
                    <span class="text-xs px-2.5 py-1 bg-amber-900/50 text-amber-300 rounded-full">
                      {{ getPermissions(livreur.id)!.length }} permission(s) active(s)
                    </span>
                  }
                  <button (click)="toggleExpand(livreur.id)"
                    class="text-xs px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors">
                    {{ expanded() === livreur.id ? 'Fermer' : 'Configurer' }}
                  </button>
                </div>
              </div>

              @if (expanded() === livreur.id) {
                <div class="border-t border-gray-700 pt-4">
                  <div class="flex items-center justify-between mb-3">
                    <p class="text-sm text-gray-300">Sélectionnez les permissions autorisées :</p>
                    <div class="flex gap-2">
                      <button (click)="grantAll(livreur.id)"
                        class="text-xs px-2.5 py-1 bg-green-900/40 hover:bg-green-900/70 text-green-300 rounded-lg transition-colors">
                        Tout autoriser
                      </button>
                      <button (click)="revokeAll(livreur.id)"
                        class="text-xs px-2.5 py-1 bg-red-900/40 hover:bg-red-900/70 text-red-400 rounded-lg transition-colors">
                        Tout restreindre
                      </button>
                    </div>
                  </div>

                  <div class="grid grid-cols-2 gap-2 mb-4">
                    @for (perm of allPermissions; track perm.key) {
                      <label class="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-700/50 hover:bg-gray-700 cursor-pointer transition-colors">
                        <input type="checkbox"
                          [checked]="hasPermission(livreur.id, perm.key)"
                          (change)="togglePermission(livreur.id, perm.key)"
                          class="rounded border-gray-600 text-indigo-600 focus:ring-indigo-500" />
                        <span class="text-sm text-gray-300">{{ perm.label }}</span>
                      </label>
                    }
                  </div>

                  <div class="flex gap-3">
                    <button (click)="savePermissions(livreur.id)" [disabled]="saving() === livreur.id"
                      class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors">
                      {{ saving() === livreur.id ? 'Enregistrement...' : 'Enregistrer' }}
                    </button>
                    @if (saveSuccess() === livreur.id) {
                      <span class="text-green-400 text-sm self-center">✓ Sauvegardé</span>
                    }
                  </div>
                </div>
              }
            </div>
          } @empty {
            <div class="bg-gray-800 rounded-xl border border-gray-700 py-16 text-center">
              <p class="text-gray-500">Aucun livreur</p>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class AdminLivreurPermissionsComponent implements OnInit {
  private api = inject(AdminApiService);

  livreurs = signal<LivreurPerformance[]>([]);
  permissionsMap = signal<Map<number, string[] | null>>(new Map());
  loading = signal(true);
  expanded = signal<number | null>(null);
  saving = signal<number | null>(null);
  saveSuccess = signal<number | null>(null);

  allPermissions = ALL_PERMISSIONS;

  ngOnInit(): void {
    this.api.getLivreurs().subscribe((list) => {
      this.livreurs.set(list);
      // Load permissions for each livreur
      let loaded = 0;
      const map = new Map<number, string[] | null>();
      list.forEach((l) => {
        this.api.getLivreurPermissions(l.id).subscribe({
          next: (p) => {
            map.set(l.id, p.permissions);
            loaded++;
            if (loaded === list.length) {
              this.permissionsMap.set(new Map(map));
              this.loading.set(false);
            }
          },
          error: () => {
            map.set(l.id, null);
            loaded++;
            if (loaded === list.length) {
              this.permissionsMap.set(new Map(map));
              this.loading.set(false);
            }
          },
        });
      });
      if (list.length === 0) this.loading.set(false);
    });
  }

  getPermissions(livreurId: number): string[] | null {
    return this.permissionsMap().get(livreurId) ?? null;
  }

  hasPermission(livreurId: number, perm: string): boolean {
    const perms = this.getPermissions(livreurId);
    if (perms === null) return true; // full access
    return perms.includes(perm);
  }

  togglePermission(livreurId: number, perm: string): void {
    const map = new Map(this.permissionsMap());
    const current = map.get(livreurId) ?? ALL_PERMISSIONS.map((p) => p.key);
    const updated = current.includes(perm)
      ? current.filter((p) => p !== perm)
      : [...current, perm];
    map.set(livreurId, updated);
    this.permissionsMap.set(map);
  }

  grantAll(livreurId: number): void {
    const map = new Map(this.permissionsMap());
    map.set(livreurId, null); // null = unrestricted
    this.permissionsMap.set(map);
  }

  revokeAll(livreurId: number): void {
    const map = new Map(this.permissionsMap());
    map.set(livreurId, []);
    this.permissionsMap.set(map);
  }

  toggleExpand(livreurId: number): void {
    this.expanded.set(this.expanded() === livreurId ? null : livreurId);
    this.saveSuccess.set(null);
  }

  savePermissions(livreurId: number): void {
    const perms = this.getPermissions(livreurId);
    this.saving.set(livreurId);
    this.api.updateLivreurPermissions(livreurId, perms).subscribe({
      next: (result) => {
        const map = new Map(this.permissionsMap());
        map.set(livreurId, result.permissions);
        this.permissionsMap.set(map);
        this.saving.set(null);
        this.saveSuccess.set(livreurId);
        setTimeout(() => this.saveSuccess.set(null), 3000);
      },
      error: (err) => {
        alert(err.error?.detail ?? 'Erreur lors de la sauvegarde');
        this.saving.set(null);
      },
    });
  }
}
