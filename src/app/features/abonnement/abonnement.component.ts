import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe, DecimalPipe, NgClass } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import { Abonnement, FormulaAbonnement, MoyenPaiement, PaiementAbonnementCreate } from '../../core/models/abonnement.models';

@Component({
  selector: 'app-abonnement',
  standalone: true,
  imports: [FormsModule, DatePipe, DecimalPipe, NgClass],
  template: `
    <div class="max-w-3xl">
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Mon abonnement</h1>
        <p class="text-gray-500 dark:text-gray-400 text-sm mt-1">Gérez votre abonnement DistriPain</p>
      </div>

      <!-- Current subscription -->
      <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 mb-5">
        <h2 class="text-base font-semibold text-gray-900 dark:text-white mb-3">Abonnement actuel</h2>

        @if (loading()) {
          <p class="text-gray-400 text-sm">Chargement...</p>
        } @else if (current()) {
          @let ab = current()!;
          <div class="flex items-start justify-between">
            <div>
              <p class="text-lg font-bold text-gray-900 dark:text-white">{{ ab.formule.nom }}</p>
              <p class="text-gray-500 dark:text-gray-400 text-sm">{{ ab.formule.duree_mois }} mois — {{ ab.formule.prix | number }} {{ ab.formule.pays?.devise_code ?? 'FCFA' }}</p>
              <p class="text-gray-400 text-xs mt-1">
                Du {{ ab.date_debut | date:'dd/MM/yyyy' }} au {{ ab.date_fin | date:'dd/MM/yyyy' }}
              </p>
            </div>
            <span class="text-sm px-3 py-1 rounded-full font-medium"
              [ngClass]="statutClass(ab.statut)">
              {{ statutLabel(ab.statut) }}
            </span>
          </div>

          <!-- Payments for current -->
          @if (ab.paiements.length > 0) {
            <div class="mt-4 border-t border-gray-100 dark:border-gray-700 pt-3">
              <p class="text-xs text-gray-400 font-medium uppercase tracking-wider mb-2">Mes paiements</p>
              <div class="space-y-2">
                @for (p of ab.paiements; track p.id) {
                  <div class="flex items-center justify-between bg-gray-50 dark:bg-gray-700/40 rounded-lg px-3 py-2">
                    <div>
                      <span class="text-gray-900 dark:text-white text-sm font-medium">{{ p.montant | number }} {{ ab.formule.pays?.devise_code ?? 'FCFA' }}</span>
                      <span class="text-gray-500 dark:text-gray-400 text-xs ml-2">via {{ p.moyen }}</span>
                      @if (p.reference) {
                        <span class="text-gray-400 text-xs ml-2">Réf: {{ p.reference }}</span>
                      }
                    </div>
                    <span class="text-xs px-2 py-0.5 rounded-full"
                      [ngClass]="paiementStatutClass(p.statut)">
                      {{ p.statut === 'en_attente' ? 'En attente' : p.statut === 'valide' ? 'Validé' : 'Rejeté' }}
                    </span>
                  </div>
                }
              </div>
            </div>
          }

          <!-- Declare payment button -->
          @if (ab.statut === 'en_attente' || ab.statut === 'actif') {
            <button (click)="showPayForm.set(!showPayForm())"
              class="mt-4 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium transition-colors">
              {{ showPayForm() ? 'Annuler' : '💳 Déclarer un paiement' }}
            </button>
          }
        } @else {
          <div class="text-center py-8">
            <p class="text-gray-500 dark:text-gray-400 mb-4">Vous n'avez pas d'abonnement actif.</p>
            <button (click)="showSubscribeForm.set(true)"
              class="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium transition-colors">
              S'abonner maintenant
            </button>
          </div>
        }
      </div>

      <!-- Payment declaration form -->
      @if (showPayForm() && current()) {
        <div class="bg-white dark:bg-gray-800 rounded-xl border border-amber-300 dark:border-amber-700 p-5 mb-5">
          <h3 class="text-base font-semibold text-gray-900 dark:text-white mb-4">Déclarer un paiement</h3>

          @if (moyens().length > 0) {
            <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">Effectuez votre paiement sur l'un des numéros ci-dessous, puis renseignez les informations :</p>
            <div class="space-y-2 mb-4">
              @for (m of moyens(); track m.id) {
                <div class="bg-gray-50 dark:bg-gray-700/50 rounded-lg px-3 py-2.5 flex items-center gap-3">
                  <span class="text-lg">💳</span>
                  <div>
                    <p class="text-gray-900 dark:text-white font-medium text-sm">{{ m.nom }}</p>
                    <p class="text-gray-500 dark:text-gray-400 text-xs font-mono">{{ m.numero }}</p>
                    @if (m.instructions) {
                      <p class="text-gray-400 text-xs mt-0.5">{{ m.instructions }}</p>
                    }
                  </div>
                </div>
              }
            </div>
          }

          <div class="space-y-3">
            <div>
              <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">Montant payé *</label>
              <input [(ngModel)]="payForm.montant" type="number" min="0" class="form-input"
                placeholder="Montant" />
            </div>
            <div>
              <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">Moyen utilisé *</label>
              <select [(ngModel)]="payForm.moyen" class="form-input">
                <option value="">Sélectionner...</option>
                @for (m of moyens(); track m.id) {
                  <option [value]="m.nom">{{ m.nom }}</option>
                }
                <option value="Autre">Autre</option>
              </select>
            </div>
            <div>
              <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">Référence / ID transaction</label>
              <input [(ngModel)]="payForm.reference" class="form-input" placeholder="Optionnel" />
            </div>
          </div>

          @if (payError()) {
            <p class="text-red-500 text-sm mt-3">{{ payError() }}</p>
          }

          <div class="flex gap-3 mt-4">
            <button (click)="declarerPaiement()" [disabled]="paying()"
              class="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors">
              {{ paying() ? 'Envoi...' : 'Envoyer la déclaration' }}
            </button>
            <button (click)="showPayForm.set(false)"
              class="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm transition-colors">
              Annuler
            </button>
          </div>
        </div>
      }

      <!-- Subscribe form -->
      @if (showSubscribeForm()) {
        <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 mb-5">
          <h3 class="text-base font-semibold text-gray-900 dark:text-white mb-4">Choisir une formule</h3>
          <div class="grid gap-3 mb-4">
            @for (f of formules(); track f.id) {
              <label class="flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors"
                [ngClass]="selectedFormule === f.id
                  ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/30'
                  : 'border-gray-200 dark:border-gray-600'">
                <input type="radio" [value]="f.id" [(ngModel)]="selectedFormule"
                  class="text-amber-600 focus:ring-amber-500" />
                <div class="flex-1">
                  <p class="font-semibold text-gray-900 dark:text-white">{{ f.nom }}</p>
                  <p class="text-gray-500 dark:text-gray-400 text-sm">{{ f.duree_mois }} mois</p>
                  @if (f.description) {
                    <p class="text-gray-400 text-xs mt-0.5">{{ f.description }}</p>
                  }
                </div>
                <p class="text-xl font-bold text-amber-600">{{ f.prix | number }} <span class="text-sm font-normal">{{ f.pays?.devise_code ?? 'FCFA' }}</span></p>
              </label>
            } @empty {
              <p class="text-gray-400 text-sm">Aucune formule disponible pour le moment.</p>
            }
          </div>

          <div class="mb-4">
            <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">Date de début</label>
            <input [(ngModel)]="subscribeDate" type="date" class="form-input" />
          </div>

          @if (subscribeError()) {
            <p class="text-red-500 text-sm mb-3">{{ subscribeError() }}</p>
          }

          <div class="flex gap-3">
            <button (click)="souscrire()" [disabled]="subscribing()"
              class="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors">
              {{ subscribing() ? 'Souscription...' : 'Souscrire' }}
            </button>
            <button (click)="showSubscribeForm.set(false)"
              class="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm transition-colors">
              Annuler
            </button>
          </div>
        </div>
      }

      <!-- History -->
      @if (history().length > 1) {
        <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h2 class="text-base font-semibold text-gray-900 dark:text-white mb-3">Historique</h2>
          <div class="space-y-2">
            @for (ab of history().slice(1); track ab.id) {
              <div class="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                <div>
                  <p class="text-gray-700 dark:text-gray-300 text-sm font-medium">{{ ab.formule.nom }}</p>
                  <p class="text-gray-400 text-xs">{{ ab.date_debut | date:'dd/MM/yyyy' }} — {{ ab.date_fin | date:'dd/MM/yyyy' }}</p>
                </div>
                <span class="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                  {{ statutLabel(ab.statut) }}
                </span>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .form-input {
      @apply w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600
             text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm
             focus:outline-none focus:border-amber-500 placeholder-gray-400 dark:placeholder-gray-500;
    }
  `],
})
export class AbonnementComponent implements OnInit {
  private api = inject(ApiService);

  current = signal<Abonnement | null>(null);
  history = signal<Abonnement[]>([]);
  formules = signal<FormulaAbonnement[]>([]);
  moyens = signal<MoyenPaiement[]>([]);
  loading = signal(true);

  showPayForm = signal(false);
  showSubscribeForm = signal(false);

  paying = signal(false);
  payError = signal('');
  payForm: PaiementAbonnementCreate = { montant: 0, moyen: '', reference: '' };

  subscribing = signal(false);
  subscribeError = signal('');
  selectedFormule: number | null = null;
  subscribeDate = new Date().toISOString().split('T')[0];

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.api.getCurrentAbonnement().subscribe({
      next: (ab) => {
        this.current.set(ab);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
    this.api.getAbonnementHistory().subscribe((list) => this.history.set(list));
    this.api.getFormules().subscribe((f) => this.formules.set(f));
    this.api.getMoyensPaiement().subscribe((m) => this.moyens.set(m));
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

  statutClass(statut: string): string {
    const map: Record<string, string> = {
      en_attente: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
      actif: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
      expire: 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400',
      suspendu: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
    };
    return map[statut] ?? '';
  }

  paiementStatutClass(statut: string): string {
    const map: Record<string, string> = {
      en_attente: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
      valide: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
      rejete: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
    };
    return map[statut] ?? '';
  }

  declarerPaiement(): void {
    if (!this.payForm.montant || !this.payForm.moyen) {
      this.payError.set('Montant et moyen sont requis');
      return;
    }
    const ab = this.current();
    if (!ab) return;
    this.paying.set(true);
    this.payError.set('');
    this.api.declarerPaiement(ab.id, {
      montant: this.payForm.montant,
      moyen: this.payForm.moyen,
      reference: this.payForm.reference || undefined,
    }).subscribe({
      next: () => {
        this.payForm = { montant: 0, moyen: '', reference: '' };
        this.showPayForm.set(false);
        this.paying.set(false);
        this.loadData();
      },
      error: (err) => {
        this.payError.set(err.error?.detail ?? 'Erreur');
        this.paying.set(false);
      },
    });
  }

  souscrire(): void {
    if (!this.selectedFormule) {
      this.subscribeError.set('Sélectionnez une formule');
      return;
    }
    this.subscribing.set(true);
    this.subscribeError.set('');
    this.api.createAbonnement({ formule_id: this.selectedFormule, date_debut: this.subscribeDate }).subscribe({
      next: () => {
        this.showSubscribeForm.set(false);
        this.subscribing.set(false);
        this.loadData();
      },
      error: (err) => {
        this.subscribeError.set(err.error?.detail ?? 'Erreur');
        this.subscribing.set(false);
      },
    });
  }
}
