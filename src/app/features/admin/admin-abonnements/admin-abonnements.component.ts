import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe, DecimalPipe } from '@angular/common';
import { AdminApiService } from '../../../core/services/admin-api.service';
import { Abonnement } from '../../../core/models/abonnement.models';

type StatutFilter = 'tous' | 'en_attente' | 'actif' | 'expire' | 'suspendu';

@Component({
  selector: 'app-admin-abonnements',
  standalone: true,
  imports: [FormsModule, DatePipe, DecimalPipe],
  template: `
    <div class="p-6 max-w-5xl">
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-white">Abonnements</h1>
        <p class="text-gray-400 text-sm mt-1">Gestion des abonnements et validation des paiements</p>
      </div>

      <!-- Filters -->
      <div class="flex gap-2 mb-6 flex-wrap">
        @for (s of statuts; track s.value) {
          <button (click)="filterStatut.set(s.value)"
            class="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
            [class.bg-indigo-600]="filterStatut() === s.value"
            [class.text-white]="filterStatut() === s.value"
            [class.bg-gray-700]="filterStatut() !== s.value"
            [class.text-gray-300]="filterStatut() !== s.value">
            {{ s.label }}
            @if (s.value === 'en_attente' && pendingCount() > 0) {
              <span class="ml-1 bg-amber-500 text-black text-xs px-1.5 py-0.5 rounded-full">{{ pendingCount() }}</span>
            }
          </button>
        }
      </div>

      <!-- List -->
      <div class="space-y-4">
        @for (ab of filtered(); track ab.id) {
          <div class="bg-gray-800 rounded-xl border border-gray-700 p-5">
            <div class="flex items-start justify-between mb-3">
              <div>
                <p class="text-white font-semibold">{{ ab.livreur_nom }}</p>
                <p class="text-gray-400 text-sm">{{ ab.formule.nom }} — {{ ab.formule.duree_mois }} mois</p>
                <p class="text-gray-500 text-xs mt-0.5">
                  Du {{ ab.date_debut | date:'dd/MM/yyyy' }} au {{ ab.date_fin | date:'dd/MM/yyyy' }}
                </p>
              </div>
              <span class="text-xs px-2.5 py-1 rounded-full font-medium"
                [class.bg-amber-900]="ab.statut === 'en_attente'" [class.text-amber-300]="ab.statut === 'en_attente'"
                [class.bg-green-900]="ab.statut === 'actif'" [class.text-green-300]="ab.statut === 'actif'"
                [class.bg-gray-700]="ab.statut === 'expire'" [class.text-gray-400]="ab.statut === 'expire'"
                [class.bg-red-900]="ab.statut === 'suspendu'" [class.text-red-300]="ab.statut === 'suspendu'">
                {{ statutLabel(ab.statut) }}
              </span>
            </div>

            @if (ab.paiements.length > 0) {
              <div class="border-t border-gray-700 mt-3 pt-3 space-y-2">
                <p class="text-xs text-gray-400 font-medium uppercase tracking-wider mb-2">Paiements déclarés</p>
                @for (p of ab.paiements; track p.id) {
                  <div class="flex items-center justify-between bg-gray-700/40 rounded-lg px-3 py-2">
                    <div>
                      <span class="text-white text-sm font-medium">{{ p.montant | number }} {{ ab.formule.pays?.devise_code ?? '' }}</span>
                      <span class="text-gray-400 text-xs ml-2">via {{ p.moyen }}</span>
                      @if (p.reference) {
                        <span class="text-gray-500 text-xs ml-2">Réf: {{ p.reference }}</span>
                      }
                      <p class="text-gray-500 text-xs">{{ p.date_paiement | date:'dd/MM/yyyy HH:mm' }}</p>
                    </div>
                    <div class="flex items-center gap-2">
                      @if (p.statut === 'en_attente') {
                        <button (click)="valider(ab.id, p.id, 'valide')"
                          class="text-xs px-3 py-1.5 bg-green-900/50 hover:bg-green-900 text-green-300 rounded-lg transition-colors">
                          ✓ Valider
                        </button>
                        <button (click)="valider(ab.id, p.id, 'rejete')"
                          class="text-xs px-3 py-1.5 bg-red-900/40 hover:bg-red-900/70 text-red-400 rounded-lg transition-colors">
                          ✗ Rejeter
                        </button>
                      } @else {
                        <span class="text-xs px-2 py-1 rounded-full"
                          [class.bg-green-900]="p.statut === 'valide'" [class.text-green-300]="p.statut === 'valide'"
                          [class.bg-red-900]="p.statut === 'rejete'" [class.text-red-300]="p.statut === 'rejete'">
                          {{ p.statut === 'valide' ? 'Validé' : 'Rejeté' }}
                        </span>
                      }
                    </div>
                  </div>
                }
              </div>
            } @else {
              <p class="text-gray-500 text-xs mt-2 italic">Aucun paiement déclaré</p>
            }
          </div>
        } @empty {
          <div class="bg-gray-800 rounded-xl border border-gray-700 py-16 text-center">
            <p class="text-gray-500">Aucun abonnement trouvé</p>
          </div>
        }
      </div>
    </div>
  `,
})
export class AdminAbonnementsComponent implements OnInit {
  private api = inject(AdminApiService);

  abonnements = signal<Abonnement[]>([]);
  filterStatut = signal<StatutFilter>('tous');

  statuts: { value: StatutFilter; label: string }[] = [
    { value: 'tous', label: 'Tous' },
    { value: 'en_attente', label: 'En attente' },
    { value: 'actif', label: 'Actifs' },
    { value: 'expire', label: 'Expirés' },
    { value: 'suspendu', label: 'Suspendus' },
  ];

  filtered = computed(() => {
    const statut = this.filterStatut();
    if (statut === 'tous') return this.abonnements();
    return this.abonnements().filter((a) => a.statut === statut);
  });

  pendingCount = computed(() =>
    this.abonnements().filter((a) =>
      a.paiements.some((p) => p.statut === 'en_attente')
    ).length
  );

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.api.getAbonnements().subscribe((list) => this.abonnements.set(list));
  }

  statutLabel(statut: string): string {
    const labels: Record<string, string> = {
      en_attente: 'En attente',
      actif: 'Actif',
      expire: 'Expiré',
      suspendu: 'Suspendu',
    };
    return labels[statut] ?? statut;
  }

  valider(abonnementId: number, paiementId: number, statut: 'valide' | 'rejete'): void {
    const label = statut === 'valide' ? 'valider' : 'rejeter';
    if (!confirm(`Confirmer : ${label} ce paiement ?`)) return;
    this.api.validerPaiement(abonnementId, paiementId, statut).subscribe({
      next: (updated) =>
        this.abonnements.update((list) => list.map((a) => (a.id === updated.id ? updated : a))),
      error: (err) => alert(err.error?.detail ?? 'Erreur'),
    });
  }
}
