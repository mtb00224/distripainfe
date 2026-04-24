import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AdminBoulangerieService } from '../../../core/services/admin-boulangerie.service';
import {
  SessionProduction,
  Distribution,
  LivreurInterne,
  ModeReglement,
  LivreurInternePortionPain,
  RetourLigneBoulangerie,
} from '../../../core/models/production.models';

@Component({
  selector: 'app-production-detail',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, DecimalPipe],
  template: `
    <div class="space-y-6">
      <!-- Retour -->
      <a routerLink="/boulangerie/production" class="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-amber-600">
        ← Retour au journal
      </a>

      @if (error()) {
        <div class="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{{ error() }}</div>
      }
      @if (success()) {
        <div class="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg">{{ success() }}</div>
      }

      @if (loading()) {
        <div class="text-center text-gray-400 py-8">Chargement...</div>
      } @else if (session()) {
        <!-- En-tête session -->
        <div class="card">
          <div class="flex items-start justify-between">
            <div>
              <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Session du {{ formatDate(session()!.date) }}
              </h1>
              <div class="flex items-center gap-2 mt-1">
                <span class="text-sm px-2 py-0.5 rounded-full font-medium"
                  [class.bg-amber-100]="session()!.periode === 'matin'"
                  [class.text-amber-700]="session()!.periode === 'matin'"
                  [class.bg-indigo-100]="session()!.periode === 'soir'"
                  [class.text-indigo-700]="session()!.periode === 'soir'">
                  {{ session()!.periode === 'matin' ? '🌅 Matin' : '🌙 Soir' }}
                </span>
                <span class="text-sm px-2 py-0.5 rounded-full font-medium"
                  [class.bg-green-100]="session()!.statut === 'ouverte'"
                  [class.text-green-700]="session()!.statut === 'ouverte'"
                  [class.bg-gray-100]="session()!.statut === 'cloturee'"
                  [class.text-gray-600]="session()!.statut === 'cloturee'">
                  {{ session()!.statut === 'ouverte' ? 'Ouverte' : 'Clôturée' }}
                </span>
              </div>
              @if (session()!.notes) {
                <p class="text-sm text-gray-500 mt-2">{{ session()!.notes }}</p>
              }
            </div>
            @if (session()!.statut === 'ouverte') {
              <button (click)="cloturer()" class="btn-primary bg-red-600 hover:bg-red-700" [disabled]="cloturing()">
                @if (cloturing()) { Clôture en cours... } @else { Clôturer la session }
              </button>
            }
          </div>

          <!-- Récapitulatif stats -->
          <div class="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
            <div class="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 text-center">
              <div class="text-2xl font-bold text-amber-600">{{ session()!.nb_pains_produits }}</div>
              <div class="text-xs text-gray-500 mt-1">Produits</div>
            </div>
            <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-center">
              <div class="text-2xl font-bold text-blue-600">{{ session()!.nb_pains_ambulatoire }}</div>
              <div class="text-xs text-gray-500 mt-1">Ambulatoire</div>
            </div>
            <div class="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 text-center">
              <div class="text-2xl font-bold text-purple-600">{{ session()!.nb_pains_distribues }}</div>
              <div class="text-xs text-gray-500 mt-1">Distribués</div>
            </div>
            <div class="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center">
              <div class="text-2xl font-bold text-green-600">{{ session()!.nb_pains_vendus_total }}</div>
              <div class="text-xs text-gray-500 mt-1">Vendus</div>
            </div>
            <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-center">
              <div class="text-2xl font-bold text-gray-600">{{ session()!.nb_pains_non_distribues }}</div>
              <div class="text-xs text-gray-500 mt-1">Non distribués</div>
            </div>
          </div>
          @if (session()!.montant_ambulatoire > 0) {
            <p class="text-sm text-gray-500 mt-3">
              💰 Montant ambulatoire : <strong class="text-amber-600">{{ session()!.montant_ambulatoire | number:'1.0-0' }} FCFA</strong>
            </p>
          }
        </div>

        <!-- Section Distributions -->
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Distributions livreurs</h2>
            @if (session()!.statut === 'ouverte') {
              <button (click)="showAddDistForm.set(!showAddDistForm())" class="btn-secondary text-sm">
                {{ showAddDistForm() ? 'Annuler' : '+ Ajouter un livreur' }}
              </button>
            }
          </div>

          <!-- Formulaire ajout distribution -->
          @if (showAddDistForm() && session()!.statut === 'ouverte') {
            <div class="card max-w-lg">
              <h3 class="font-medium text-gray-900 dark:text-gray-100 mb-3">Distribuer des pains</h3>
              @if (livreursInternes().length === 0) {
                <p class="text-sm text-gray-400 italic py-4 text-center">
                  Aucun livreur interne actif. <a routerLink="/boulangerie/livreurs-internes" class="text-amber-600 hover:underline">En ajouter</a>
                </p>
              } @else {
                <form [formGroup]="addDistForm" (ngSubmit)="submitDist()" class="space-y-3">
                  <div>
                    <label class="label">Livreur *</label>
                    <select formControlName="livreur_interne_id" class="input-field">
                      <option value="">— Sélectionner un livreur —</option>
                      @for (l of livreursInternes(); track l.id) {
                        <option [value]="l.id">{{ l.prenom }} {{ l.nom }}</option>
                      }
                    </select>
                  </div>
                  <div class="grid grid-cols-2 gap-3">
                    <div>
                      <label class="label">Nb pains donnés *</label>
                      <input type="number" formControlName="nb_pains_donnes" class="input-field" min="1" />
                    </div>
                    <div>
                      <label class="label">Prix/pain (optionnel)</label>
                      <input type="number" formControlName="prix_par_pain" class="input-field" step="0.01" min="0" />
                    </div>
                  </div>
                  <div class="flex gap-3">
                    <button type="submit" class="btn-primary" [disabled]="addingDist()">
                      @if (addingDist()) { Enregistrement... } @else { Distribuer }
                    </button>
                  </div>
                </form>
              }
            </div>
          }

          <!-- Tableau distributions -->
          @if (session()!.distributions.length === 0) {
            <div class="card text-center py-8 text-gray-400">
              <p>Aucune distribution pour cette session</p>
            </div>
          } @else {
            <div class="card overflow-x-auto p-0">
              <table class="w-full text-sm">
                <thead class="bg-gray-50 dark:bg-gray-800 text-xs text-gray-500 uppercase">
                  <tr>
                    <th class="px-4 py-3 text-left">Livreur</th>
                    <th class="px-4 py-3 text-right">Donnés</th>
                    <th class="px-4 py-3 text-right">Prix/pain</th>
                    <th class="px-4 py-3 text-right">Retournés</th>
                    <th class="px-4 py-3 text-right">Vendus</th>
                    <th class="px-4 py-3 text-right">Montant dû</th>
                    <th class="px-4 py-3 text-right">Encaissé</th>
                    <th class="px-4 py-3 text-right">Écart</th>
                    <th class="px-4 py-3 text-left">Mode</th>
                    <th class="px-4 py-3 text-left">Statut</th>
                    <th class="px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
                  @for (d of session()!.distributions; track d.id) {
                    <tr class="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td class="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                        {{ d.livreur_prenom }} {{ d.livreur_nom }}
                      </td>
                      <td class="px-4 py-3 text-right">{{ d.nb_pains_donnes }}</td>
                      <td class="px-4 py-3 text-right">{{ d.prix_par_pain }}</td>
                      <td class="px-4 py-3 text-right">{{ d.nb_pains_retournes }}</td>
                      <td class="px-4 py-3 text-right">{{ d.nb_pains_vendus }}</td>
                      <td class="px-4 py-3 text-right font-medium">{{ d.montant_theorique | number:'1.0-0' }}</td>
                      <td class="px-4 py-3 text-right font-medium text-green-600">{{ d.montant_encaisse | number:'1.0-0' }}</td>
                      <td class="px-4 py-3 text-right"
                        [class.text-red-500]="d.ecart < 0"
                        [class.text-green-600]="d.ecart >= 0">
                        {{ d.ecart | number:'1.0-0' }}
                      </td>
                      <td class="px-4 py-3 text-xs">{{ modeLabel(d.mode_reglement) }}</td>
                      <td class="px-4 py-3">
                        <span class="text-xs px-2 py-0.5 rounded-full"
                          [class.bg-yellow-100]="d.statut === 'en_attente'"
                          [class.text-yellow-700]="d.statut === 'en_attente'"
                          [class.bg-green-100]="d.statut === 'solde'"
                          [class.text-green-700]="d.statut === 'solde'"
                          [class.bg-red-100]="d.statut === 'annule'"
                          [class.text-red-700]="d.statut === 'annule'">
                          {{ statutDistLabel(d.statut) }}
                        </span>
                      </td>
                      <td class="px-4 py-3">
                        @if (d.statut === 'en_attente' && session()!.statut === 'ouverte') {
                          <button (click)="startRetour(d)" class="text-xs text-amber-600 hover:underline">Saisir retour</button>
                        }
                        @if (session()!.statut === 'ouverte') {
                          <button (click)="deleteDist(d)" class="text-xs text-red-500 hover:underline ml-2">Supprimer</button>
                        }
                      </td>
                    </tr>

                    <!-- Formulaire retour inline -->
                    @if (retourDistId() === d.id) {
                      <tr>
                        <td colspan="11" class="px-4 py-4 bg-amber-50 dark:bg-amber-900/10">
                          <div class="space-y-4">
                            <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300">Saisir le retour — {{ d.livreur_prenom }} {{ d.livreur_nom }}</h4>

                            <!-- Saisie par portions (si configurées) -->
                            @if (loadingPortions()) {
                              <p class="text-xs text-gray-400">Chargement des portions...</p>
                            } @else if (activeRetourPortions().length > 0) {
                              <div>
                                <p class="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Pains retournés par portion :</p>
                                <div class="flex flex-wrap gap-4">
                                  @for (p of activeRetourPortions(); track p.id) {
                                    <div class="flex items-center gap-2">
                                      <label class="text-xs text-gray-600 dark:text-gray-400 w-24">{{ p.nom }}</label>
                                      <input type="number"
                                        [value]="getPortionQty(p.id)"
                                        (input)="onPortionInput(p.id, $event)"
                                        min="0"
                                        class="input-field w-20 text-sm py-1" />
                                      <span class="text-xs text-gray-400">
                                        = {{ portionTotal(p) | number:'1.0-2' }} pain(s)
                                      </span>
                                    </div>
                                  }
                                </div>
                                <p class="text-sm font-semibold text-amber-600 mt-2">
                                  Total retourné : {{ totalPainsRetournes() | number:'1.0-2' }} pain(s)
                                </p>
                              </div>
                            } @else {
                              <!-- Saisie directe si aucune portion configurée -->
                              <form [formGroup]="retourForm" class="flex flex-wrap items-end gap-3">
                                <div>
                                  <label class="label text-xs">Pains retournés</label>
                                  <input type="number" formControlName="nb_pains_retournes" class="input-field w-32" min="0" />
                                </div>
                              </form>
                            }

                            <!-- Encaissement et mode de règlement -->
                            <form [formGroup]="retourForm" (ngSubmit)="submitRetour(d)" class="flex flex-wrap items-end gap-3">
                              <div>
                                <label class="label text-xs">Montant encaissé (FCFA)</label>
                                <input type="number" formControlName="montant_encaisse" class="input-field w-36" step="1" min="0" />
                              </div>
                              <div>
                                <label class="label text-xs">Mode de règlement</label>
                                <select formControlName="mode_reglement" class="input-field w-40">
                                  <option value="cash">Cash</option>
                                  <option value="compte_interne">Compte interne</option>
                                  <option value="virement">Virement</option>
                                  <option value="credit">Crédit</option>
                                </select>
                              </div>
                              <div class="flex gap-2">
                                <button type="submit" class="btn-primary text-sm" [disabled]="savingRetour()">
                                  @if (savingRetour()) { ... } @else { Valider }
                                </button>
                                <button type="button" class="btn-secondary text-sm" (click)="cancelRetour()">Annuler</button>
                              </div>
                            </form>

                            @if (!loadingPortions() && activeRetourPortions().length === 0) {
                              <p class="text-xs text-gray-400">
                                💡 Configurez des <a routerLink="/boulangerie/livreurs-internes" class="text-amber-600 hover:underline">portions pour ce livreur</a> pour faciliter la saisie des retours.
                              </p>
                            }
                          </div>
                        </td>
                      </tr>
                    }
                  }
                </tbody>
                <tfoot class="bg-gray-50 dark:bg-gray-800 font-semibold text-sm">
                  <tr>
                    <td class="px-4 py-3 text-gray-700 dark:text-gray-300" colspan="5">Total</td>
                    <td class="px-4 py-3 text-right">{{ session()!.montant_encaisse_total | number:'1.0-0' }}</td>
                    <td class="px-4 py-3 text-right text-amber-600">{{ session()!.montant_encaisse_total | number:'1.0-0' }}</td>
                    <td colspan="4"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class ProductionDetailComponent implements OnInit {
  private fb = inject(FormBuilder);
  private service = inject(AdminBoulangerieService);
  private route = inject(ActivatedRoute);

  session = signal<SessionProduction | null>(null);
  livreursInternes = signal<LivreurInterne[]>([]);
  activeRetourPortions = signal<LivreurInternePortionPain[]>([]);
  portionQuantites = signal<Record<number, number>>({});
  loadingPortions = signal(false);
  loading = signal(true);
  saving = signal(false);
  cloturing = signal(false);
  addingDist = signal(false);
  savingRetour = signal(false);
  showAddDistForm = signal(false);
  retourDistId = signal<number | null>(null);
  error = signal('');
  success = signal('');

  totalPainsRetournes = computed(() => {
    const qtys = this.portionQuantites();
    return this.activeRetourPortions().reduce((sum, p) => sum + (qtys[p.id] ?? 0) * p.equivalent_pains, 0);
  });

  addDistForm = this.fb.group({
    livreur_interne_id: ['', Validators.required],
    nb_pains_donnes: [null as number | null, [Validators.required, Validators.min(1)]],
    prix_par_pain: [null as number | null],
  });

  retourForm = this.fb.group({
    nb_pains_retournes: [0, [Validators.required, Validators.min(0)]],
    montant_encaisse: [0, [Validators.required, Validators.min(0)]],
    mode_reglement: ['cash' as ModeReglement, Validators.required],
  });

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.loadSession(id);
    this.service.getLivreursInternes().subscribe({
      next: (data) => this.livreursInternes.set(data.filter((l) => l.is_active)),
      error: () => {},
    });
  }

  loadSession(id: number): void {
    this.loading.set(true);
    this.service.getSession(id).subscribe({
      next: (s) => { this.session.set(s); this.loading.set(false); },
      error: () => { this.error.set('Session introuvable'); this.loading.set(false); },
    });
  }

  cloturer(): void {
    const s = this.session();
    if (!s) return;
    if (!confirm('Clôturer cette session ? Cette action est irréversible.')) return;
    this.cloturing.set(true);
    this.service.cloturerSession(s.id).subscribe({
      next: (updated) => { this.session.set(updated); this.cloturing.set(false); this.success.set('Session clôturée'); setTimeout(() => this.success.set(''), 3000); },
      error: (err) => { this.error.set(err.error?.detail ?? 'Erreur'); this.cloturing.set(false); },
    });
  }

  submitDist(): void {
    if (this.addDistForm.invalid) return;
    const s = this.session();
    if (!s) return;
    this.addingDist.set(true);
    const v = this.addDistForm.value;
    this.service.addDistribution(s.id, {
      livreur_interne_id: Number(v.livreur_interne_id),
      nb_pains_donnes: v.nb_pains_donnes!,
      prix_par_pain: v.prix_par_pain ?? undefined,
    }).subscribe({
      next: () => {
        this.addingDist.set(false);
        this.showAddDistForm.set(false);
        this.addDistForm.reset();
        this.loadSession(s.id);
        this.success.set('Distribution ajoutée');
        setTimeout(() => this.success.set(''), 3000);
      },
      error: (err) => { this.error.set(err.error?.detail ?? 'Erreur'); this.addingDist.set(false); },
    });
  }

  startRetour(d: Distribution): void {
    this.retourDistId.set(d.id);
    this.portionQuantites.set({});
    this.activeRetourPortions.set([]);
    this.retourForm.patchValue({
      nb_pains_retournes: d.nb_pains_retournes,
      montant_encaisse: d.montant_encaisse,
      mode_reglement: d.mode_reglement,
    });
    this.loadingPortions.set(true);
    this.service.getLivreurInternePortions(d.livreur_interne_id).subscribe({
      next: (portions) => {
        this.activeRetourPortions.set(portions.filter((p) => p.is_active));
        this.loadingPortions.set(false);
      },
      error: () => this.loadingPortions.set(false),
    });
  }

  cancelRetour(): void {
    this.retourDistId.set(null);
    this.portionQuantites.set({});
    this.activeRetourPortions.set([]);
  }

  getPortionQty(portionId: number): number {
    return this.portionQuantites()[portionId] ?? 0;
  }

  portionTotal(p: LivreurInternePortionPain): number {
    return (this.portionQuantites()[p.id] ?? 0) * p.equivalent_pains;
  }

  onPortionInput(portionId: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const qty = Math.max(0, Number(input.value) || 0);
    this.portionQuantites.update(q => ({ ...q, [portionId]: qty }));
  }

  submitRetour(d: Distribution): void {
    const s = this.session();
    if (!s) return;
    this.savingRetour.set(true);
    const v = this.retourForm.value;

    const hasPortion = this.activeRetourPortions().length > 0;
    const payload: {
      montant_encaisse: number;
      mode_reglement: ModeReglement;
      statut: 'solde';
      nb_pains_retournes?: number;
      lignes_retour?: RetourLigneBoulangerie[];
    } = {
      montant_encaisse: v.montant_encaisse ?? 0,
      mode_reglement: v.mode_reglement as ModeReglement,
      statut: 'solde',
    };

    if (hasPortion) {
      const qtys = this.portionQuantites();
      payload.lignes_retour = this.activeRetourPortions()
        .filter((p) => (qtys[p.id] ?? 0) > 0)
        .map((p) => ({ portion_id: p.id, quantite: qtys[p.id] }));
    } else {
      payload.nb_pains_retournes = v.nb_pains_retournes ?? 0;
    }

    this.service.updateDistribution(s.id, d.id, payload).subscribe({
      next: () => {
        this.savingRetour.set(false);
        this.retourDistId.set(null);
        this.portionQuantites.set({});
        this.loadSession(s.id);
        this.success.set('Retour enregistré');
        setTimeout(() => this.success.set(''), 3000);
      },
      error: (err) => { this.error.set(err.error?.detail ?? 'Erreur'); this.savingRetour.set(false); },
    });
  }

  deleteDist(d: Distribution): void {
    const s = this.session();
    if (!s) return;
    if (!confirm('Supprimer cette distribution ?')) return;
    this.service.deleteDistribution(s.id, d.id).subscribe({
      next: () => { this.loadSession(s.id); this.success.set('Distribution supprimée'); setTimeout(() => this.success.set(''), 3000); },
      error: (err) => this.error.set(err.error?.detail ?? 'Erreur'),
    });
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
  }

  modeLabel(mode: ModeReglement): string {
    const labels: Record<ModeReglement, string> = {
      cash: 'Cash',
      compte_interne: 'Compte',
      virement: 'Virement',
      credit: 'Crédit',
    };
    return labels[mode] ?? mode;
  }

  statutDistLabel(statut: string): string {
    const labels: Record<string, string> = {
      en_attente: 'En attente',
      solde: 'Soldé',
      annule: 'Annulé',
    };
    return labels[statut] ?? statut;
  }
}
