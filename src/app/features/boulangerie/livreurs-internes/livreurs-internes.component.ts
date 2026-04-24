import { Component, inject, signal, computed, OnInit, effect } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminBoulangerieService } from '../../../core/services/admin-boulangerie.service';
import {
  LivreurInterne,
  CompteInterne,
  LivreurInternePortionPain,
  LivreurInternePortionCreate,
} from '../../../core/models/production.models';
import { forkJoin, of } from 'rxjs';

interface PortionDraft {
  nom: string;
  prix_achat: number;
  equivalent_pains: number;
  /** null = toutes les boulangeries sélectionnées */
  boulangerie_id: number | null;
}

@Component({
  selector: 'app-livreurs-internes',
  standalone: true,
  imports: [ReactiveFormsModule, DecimalPipe],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Livreurs internes</h1>
          <p class="text-gray-500 dark:text-gray-400 text-sm">
            Boulangerie active :
            <strong class="text-amber-600">{{ boulangerieActive()?.nom ?? '—' }}</strong>
          </p>
        </div>
        <button (click)="showAddForm.set(true)" class="btn-primary">+ Ajouter un livreur</button>
      </div>

      @if (error()) {
        <div class="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{{ error() }}</div>
      }
      @if (success()) {
        <div class="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg">{{ success() }}</div>
      }

      <!-- ═══════════════════════════════════════════════
           FORMULAIRE AJOUT
      ════════════════════════════════════════════════ -->
      @if (showAddForm()) {
        <div class="card max-w-2xl space-y-6">
          <h2 class="font-semibold text-gray-900 dark:text-gray-100 text-lg">Nouveau livreur interne</h2>

          <!-- ─── Section 1 : Infos ─── -->
          <section>
            <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Informations</h3>
            <form [formGroup]="addForm" class="space-y-3">
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="label">Prénom *</label>
                  <input type="text" formControlName="prenom" class="input-field" placeholder="Ex: Mamadou" />
                </div>
                <div>
                  <label class="label">Nom *</label>
                  <input type="text" formControlName="nom" class="input-field" placeholder="Ex: Diallo" />
                </div>
              </div>
              <div>
                <label class="label">Téléphone</label>
                <input type="text" formControlName="telephone" class="input-field" placeholder="+221 77 000 00 00" />
              </div>
              <div>
                <label class="label">Prix d'achat pain entier (FCFA) — par défaut</label>
                <input type="number" formControlName="prix_achat_pain" class="input-field" step="0.01" placeholder="Ex: 150" />
                <p class="text-xs text-gray-400 mt-1">Ce prix sera utilisé si aucune portion spécifique n'est configurée.</p>
              </div>
            </form>
          </section>

          <hr class="border-gray-200 dark:border-gray-700" />

          <!-- ─── Section 2 : Boulangeries ─── -->
          <section>
            <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Boulangeries *</h3>
            <p class="text-xs text-gray-400 mb-3">Sélectionnez toutes les boulangeries où ce livreur travaille</p>
            @if (mesBoulangeries().length === 0) {
              <p class="text-sm text-gray-400 italic">Aucune boulangerie disponible</p>
            } @else {
              <div class="space-y-2">
                @for (b of mesBoulangeries(); track b.id) {
                  <label class="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                    <input type="checkbox"
                      [checked]="isBoulangerieSelected(b.id)"
                      (change)="toggleBoulangerie(b.id)"
                      class="w-4 h-4 text-amber-600 rounded" />
                    <span class="text-sm text-gray-900 dark:text-gray-100">{{ b.nom }}</span>
                  </label>
                }
              </div>
            }
            @if (selectedBoulangerieIds().length === 0) {
              <p class="text-xs text-red-500 mt-2">Sélectionnez au moins une boulangerie</p>
            }
          </section>

          <hr class="border-gray-200 dark:border-gray-700" />

          <!-- ─── Section 3 : Portions ─── -->
          <section>
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wide">Portions de pain</h3>
              <button type="button" (click)="addPortionDraft()" class="text-xs text-amber-600 hover:underline font-medium">+ Ajouter une portion</button>
            </div>
            <p class="text-xs text-gray-400 mb-3">
              Définissez les morceaux de pain et leurs prix pour ce livreur.
              Ces prix peuvent différer selon la boulangerie.
            </p>

            <!-- Checkbox "même config pour toutes" -->
            @if (selectedBoulangerieIds().length > 1) {
              <label class="flex items-center gap-3 cursor-pointer mb-4 p-3 bg-amber-50 dark:bg-amber-900/10 rounded-lg border border-amber-200 dark:border-amber-800">
                <input type="checkbox"
                  [checked]="samePortionForAll()"
                  (change)="samePortionForAll.set(!samePortionForAll())"
                  class="w-4 h-4 text-amber-600 rounded" />
                <div>
                  <span class="text-sm font-medium text-amber-700 dark:text-amber-300">Même configuration pour toutes les boulangeries sélectionnées</span>
                  <p class="text-xs text-amber-600/70 dark:text-amber-400/70 mt-0.5">Si décoché, choisissez la boulangerie pour chaque portion</p>
                </div>
              </label>
            }

            <!-- Liste des portions draft -->
            @if (portionDrafts().length === 0) {
              <p class="text-sm text-gray-400 italic text-center py-4">Aucune portion configurée — vous pourrez en ajouter après la création</p>
            } @else {
              <div class="space-y-3">
                @for (p of portionDrafts(); track $index) {
                  <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 space-y-2">
                    <div class="flex items-start gap-2">
                      <div class="flex-1 grid grid-cols-3 gap-2">
                        <div class="col-span-3 sm:col-span-1">
                          <label class="label text-xs">Nom *</label>
                          <input type="text" [value]="p.nom" (input)="updateDraft($index, 'nom', $any($event.target).value)"
                            class="input-field text-sm" placeholder="Ex: Demi-pain" />
                        </div>
                        <div>
                          <label class="label text-xs">Prix achat (FCFA) *</label>
                          <input type="number" [value]="p.prix_achat" (input)="updateDraft($index, 'prix_achat', +$any($event.target).value)"
                            class="input-field text-sm" min="0" placeholder="75" />
                        </div>
                        <div>
                          <label class="label text-xs">Équiv. pain *</label>
                          <input type="number" [value]="p.equivalent_pains" (input)="updateDraft($index, 'equivalent_pains', +$any($event.target).value)"
                            class="input-field text-sm" min="0.01" step="0.01" placeholder="0.5" />
                        </div>
                      </div>
                      <button type="button" (click)="removeDraft($index)" class="text-red-400 hover:text-red-600 mt-5 flex-shrink-0">✕</button>
                    </div>

                    <!-- Sélection boulangerie si non "same for all" et plusieurs boulangeries -->
                    @if (!samePortionForAll() && selectedBoulangerieIds().length > 1) {
                      <div>
                        <label class="label text-xs">Boulangerie *</label>
                        <select [value]="p.boulangerie_id ?? ''" (change)="updateDraft($index, 'boulangerie_id', $any($event.target).value ? +$any($event.target).value : null)"
                          class="input-field text-sm">
                          <option value="">— Toutes —</option>
                          @for (b of selectedBoulangeries(); track b.id) {
                            <option [value]="b.id">{{ b.nom }}</option>
                          }
                        </select>
                      </div>
                    }
                  </div>
                }
              </div>
            }
          </section>

          <!-- Actions -->
          <div class="flex gap-3 pt-2">
            <button type="button" class="btn-primary" [disabled]="saving() || addForm.invalid || selectedBoulangerieIds().length === 0" (click)="submitAdd()">
              @if (saving()) { Enregistrement... } @else { Enregistrer }
            </button>
            <button type="button" class="btn-secondary" (click)="cancelAdd()">Annuler</button>
          </div>
        </div>
      }

      <!-- ═══════════════════════════════════════════════
           FORMULAIRE ÉDITION
      ════════════════════════════════════════════════ -->
      @if (editingLivreur()) {
        <div class="card max-w-2xl space-y-6">
          <h2 class="font-semibold text-gray-900 dark:text-gray-100 text-lg">
            Modifier — {{ editingLivreur()!.prenom }} {{ editingLivreur()!.nom }}
          </h2>

          <section>
            <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Informations</h3>
            <form [formGroup]="editForm" class="space-y-3">
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="label">Prénom *</label>
                  <input type="text" formControlName="prenom" class="input-field" />
                </div>
                <div>
                  <label class="label">Nom *</label>
                  <input type="text" formControlName="nom" class="input-field" />
                </div>
              </div>
              <div>
                <label class="label">Téléphone</label>
                <input type="text" formControlName="telephone" class="input-field" />
              </div>
              <div>
                <label class="label">Prix d'achat pain entier (FCFA)</label>
                <input type="number" formControlName="prix_achat_pain" class="input-field" step="0.01" />
              </div>
            </form>
          </section>

          <hr class="border-gray-200 dark:border-gray-700" />

          <!-- ─── Portions livreur (édition) ─── -->
          <section>
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wide">Portions de pain</h3>
              <button type="button" (click)="showAddPortionEdit.set(!showAddPortionEdit())" class="text-xs text-amber-600 hover:underline font-medium">
                {{ showAddPortionEdit() ? 'Annuler' : '+ Ajouter une portion' }}
              </button>
            </div>

            @if (showAddPortionEdit()) {
              <form [formGroup]="portionEditForm" (ngSubmit)="submitPortionAdd()" class="bg-amber-50 dark:bg-amber-900/10 rounded-lg p-3 mb-3 space-y-2">
                <div class="grid grid-cols-3 gap-2">
                  <div class="col-span-3 sm:col-span-1">
                    <label class="label text-xs">Nom *</label>
                    <input type="text" formControlName="nom" class="input-field text-sm" placeholder="Demi-pain" />
                  </div>
                  <div>
                    <label class="label text-xs">Prix achat (FCFA) *</label>
                    <input type="number" formControlName="prix_achat" class="input-field text-sm" min="0" placeholder="75" />
                  </div>
                  <div>
                    <label class="label text-xs">Équiv. pain *</label>
                    <input type="number" formControlName="equivalent_pains" class="input-field text-sm" min="0.01" step="0.01" placeholder="0.5" />
                  </div>
                </div>
                <button type="submit" class="btn-primary text-xs" [disabled]="portionEditForm.invalid || savingPortion()">
                  @if (savingPortion()) { ... } @else { Enregistrer }
                </button>
              </form>
            }

            @if (loadingPortions()) {
              <p class="text-xs text-gray-400 text-center py-4">Chargement...</p>
            } @else if (editPortions().length === 0) {
              <p class="text-sm text-gray-400 italic text-center py-4">Aucune portion configurée</p>
            } @else {
              <div class="space-y-2">
                @for (p of editPortions(); track p.id) {
                  <div class="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div>
                      <span class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ p.nom }}</span>
                      <span class="ml-3 text-xs text-amber-600 font-mono">{{ p.prix_achat }} FCFA · {{ p.equivalent_pains }} pain</span>
                    </div>
                    <button (click)="deletePortion(p)" class="text-xs text-red-500 hover:underline">Supprimer</button>
                  </div>
                }
              </div>
            }
          </section>

          <div class="flex gap-3 pt-2">
            <button type="button" class="btn-primary" [disabled]="saving() || editForm.invalid" (click)="submitEdit()">
              @if (saving()) { Enregistrement... } @else { Enregistrer }
            </button>
            <button type="button" class="btn-secondary" (click)="cancelEdit()">Annuler</button>
          </div>
        </div>
      }

      <!-- Solde compte -->
      @if (compteDetail()) {
        <div class="card max-w-lg border-amber-200 dark:border-amber-700">
          <div class="flex items-center justify-between mb-3">
            <h3 class="font-semibold text-gray-900 dark:text-gray-100">Compte interne</h3>
            <button (click)="compteDetail.set(null)" class="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
          </div>
          <p class="text-3xl font-bold text-amber-600 mb-1">{{ compteDetail()!.solde_actuel | number:'1.0-0' }} FCFA</p>
          <p class="text-xs text-gray-400">Mis à jour : {{ formatDate(compteDetail()!.updated_at) }}</p>
        </div>
      }

      <!-- ═══════════════════════════════════════════════
           LISTE
      ════════════════════════════════════════════════ -->
      @if (loading()) {
        <div class="text-center text-gray-400 py-8">Chargement...</div>
      } @else if (livreurs().length === 0) {
        <div class="card text-center py-12 text-gray-400">
          <div class="text-4xl mb-3">🏃</div>
          <p>Aucun livreur interne pour cette boulangerie</p>
        </div>
      } @else {
        <div class="space-y-3">
          @for (l of livreurs(); track l.id) {
            <div class="card">
              <div class="flex items-start justify-between gap-3">
                <div class="flex items-center gap-3">
                  <span class="text-2xl">🏃</span>
                  <div>
                    <p class="font-medium text-gray-900 dark:text-gray-100">{{ l.prenom }} {{ l.nom }}</p>
                    @if (l.telephone) {
                      <p class="text-sm text-gray-500">📞 {{ l.telephone }}</p>
                    }
                    <div class="flex gap-3 mt-1 text-xs text-gray-400">
                      @if (l.prix_achat_pain) {
                        <span>💰 Prix défaut : {{ l.prix_achat_pain }} FCFA</span>
                      }
                      @if (l.solde_compte !== undefined && l.solde_compte !== null) {
                        <span class="text-amber-600 font-medium">Solde : {{ l.solde_compte | number:'1.0-0' }} FCFA</span>
                      }
                    </div>
                  </div>
                </div>
                <div class="flex items-center gap-2 flex-shrink-0">
                  <span class="text-xs px-2 py-1 rounded-full"
                    [class.bg-green-100]="l.is_active" [class.text-green-700]="l.is_active"
                    [class.bg-gray-100]="!l.is_active" [class.text-gray-500]="!l.is_active">
                    {{ l.is_active ? 'Actif' : 'Inactif' }}
                  </span>
                  <button (click)="viewCompte(l)" class="text-xs text-amber-600 hover:underline">Compte</button>
                  <button (click)="startEdit(l)" class="text-xs text-blue-600 hover:underline">Modifier</button>
                  @if (l.is_active) {
                    <button (click)="deactivate(l)" class="text-xs text-red-500 hover:underline">Désactiver</button>
                  }
                </div>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class LivreursInternesComponent implements OnInit {
  private fb = inject(FormBuilder);
  private service = inject(AdminBoulangerieService);

  livreurs = signal<LivreurInterne[]>([]);
  loading = signal(true);
  saving = signal(false);
  savingPortion = signal(false);
  loadingPortions = signal(false);
  showAddForm = signal(false);
  showAddPortionEdit = signal(false);
  editingLivreur = signal<LivreurInterne | null>(null);
  editPortions = signal<LivreurInternePortionPain[]>([]);
  compteDetail = signal<CompteInterne | null>(null);
  error = signal('');
  success = signal('');
  selectedBoulangerieIds = signal<number[]>([]);
  samePortionForAll = signal(true);
  portionDrafts = signal<PortionDraft[]>([]);

  mesBoulangeries = computed(() => this.service.profile()?.boulangeries?.filter(b => b.is_active) ?? []);
  boulangerieActive = computed(() => this.service.boulangerieActive());
  selectedBoulangeries = computed(() =>
    this.mesBoulangeries().filter(b => this.selectedBoulangerieIds().includes(b.id))
  );

  addForm = this.fb.group({
    prenom: ['', Validators.required],
    nom: ['', Validators.required],
    telephone: [''],
    prix_achat_pain: [null as number | null],
  });

  editForm = this.fb.group({
    prenom: ['', Validators.required],
    nom: ['', Validators.required],
    telephone: [''],
    prix_achat_pain: [null as number | null],
  });

  portionEditForm = this.fb.group({
    nom: ['', Validators.required],
    prix_achat: [null as number | null, [Validators.required, Validators.min(0)]],
    equivalent_pains: [null as number | null, [Validators.required, Validators.min(0.01)]],
  });

  constructor() {
    // Recharger automatiquement quand la boulangerie active change
    effect(() => {
      const activeId = this.service.boulangerieActiveId();
      if (activeId !== null) {
        this.load();
      }
    });
  }

  ngOnInit(): void {
    // Le premier chargement est déclenché par l'effect du constructor
    if (this.service.boulangerieActiveId() === null) {
      this.load();
    }
  }

  load(): void {
    this.loading.set(true);
    this.service.getLivreursInternes(true).subscribe({
      next: (d) => { this.livreurs.set(d); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  // ── Gestion boulangeries ────────────────────────────────────────────────────

  isBoulangerieSelected(id: number): boolean {
    return this.selectedBoulangerieIds().includes(id);
  }

  toggleBoulangerie(id: number): void {
    const current = this.selectedBoulangerieIds();
    if (current.includes(id)) {
      this.selectedBoulangerieIds.set(current.filter(x => x !== id));
    } else {
      this.selectedBoulangerieIds.set([...current, id]);
    }
  }

  // ── Gestion portions draft (formulaire ajout) ───────────────────────────────

  addPortionDraft(): void {
    this.portionDrafts.update(d => [...d, { nom: '', prix_achat: 0, equivalent_pains: 1.0, boulangerie_id: null }]);
  }

  removeDraft(index: number): void {
    this.portionDrafts.update(d => d.filter((_, i) => i !== index));
  }

  updateDraft(index: number, field: keyof PortionDraft, value: string | number | null): void {
    this.portionDrafts.update(drafts => {
      const copy = [...drafts];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  }

  // ── Soumission ajout ────────────────────────────────────────────────────────

  submitAdd(): void {
    if (this.addForm.invalid || this.selectedBoulangerieIds().length === 0) return;
    this.saving.set(true);
    this.error.set('');
    const v = this.addForm.value;

    this.service.createLivreurInterne({
      prenom: v.prenom!,
      nom: v.nom!,
      telephone: v.telephone || undefined,
      prix_achat_pain: v.prix_achat_pain ?? undefined,
      boulangerie_ids: this.selectedBoulangerieIds(),
    }).subscribe({
      next: (created) => {
        const drafts = this.portionDrafts().filter(p => p.nom.trim() && p.prix_achat > 0 && p.equivalent_pains > 0);

        if (drafts.length === 0) {
          this.saving.set(false);
          this.cancelAdd();
          this.success.set(`${created.length} livreur(s) ajouté(s)`);
          this.load();
          setTimeout(() => this.success.set(''), 3000);
          return;
        }

        // Créer les portions pour chaque livreur créé
        const portionCalls: ReturnType<AdminBoulangerieService['createLivreurInternePortion']>[] = [];

        for (const livreurCreated of created) {
          for (const draft of drafts) {
            const applyToThis = this.samePortionForAll()
              || draft.boulangerie_id === null
              || draft.boulangerie_id === livreurCreated.boulangerie_id;

            if (applyToThis) {
              portionCalls.push(
                this.service.createLivreurInternePortion(livreurCreated.id, {
                  nom: draft.nom,
                  prix_achat: draft.prix_achat,
                  equivalent_pains: draft.equivalent_pains,
                })
              );
            }
          }
        }

        forkJoin(portionCalls.length > 0 ? portionCalls : [of(null)]).subscribe({
          next: () => {
            this.saving.set(false);
            this.cancelAdd();
            this.success.set(`${created.length} livreur(s) ajouté(s) avec ${drafts.length} portion(s) configurée(s)`);
            this.load();
            setTimeout(() => this.success.set(''), 4000);
          },
          error: () => {
            this.saving.set(false);
            this.cancelAdd();
            this.success.set(`Livreur(s) créé(s) — erreur partielle sur les portions`);
            this.load();
          },
        });
      },
      error: (err) => {
        this.error.set(err.error?.detail ?? 'Erreur lors de la création');
        this.saving.set(false);
      },
    });
  }

  cancelAdd(): void {
    this.showAddForm.set(false);
    this.addForm.reset();
    this.selectedBoulangerieIds.set([]);
    this.portionDrafts.set([]);
    this.samePortionForAll.set(true);
  }

  // ── Édition livreur ─────────────────────────────────────────────────────────

  startEdit(l: LivreurInterne): void {
    this.editingLivreur.set(l);
    this.editForm.patchValue({
      prenom: l.prenom, nom: l.nom,
      telephone: l.telephone ?? '',
      prix_achat_pain: l.prix_achat_pain ?? null,
    });
    this.showAddPortionEdit.set(false);
    this.loadPortionsForEdit(l.id);
  }

  cancelEdit(): void {
    this.editingLivreur.set(null);
    this.editPortions.set([]);
    this.showAddPortionEdit.set(false);
    this.portionEditForm.reset();
  }

  loadPortionsForEdit(id: number): void {
    this.loadingPortions.set(true);
    this.service.getLivreurInternePortions(id).subscribe({
      next: (p) => { this.editPortions.set(p); this.loadingPortions.set(false); },
      error: () => this.loadingPortions.set(false),
    });
  }

  submitEdit(): void {
    const l = this.editingLivreur();
    if (!l || this.editForm.invalid) return;
    this.saving.set(true);
    this.error.set('');
    const v = this.editForm.value;
    this.service.updateLivreurInterne(l.id, {
      prenom: v.prenom ?? undefined,
      nom: v.nom ?? undefined,
      telephone: v.telephone || undefined,
      prix_achat_pain: v.prix_achat_pain ?? undefined,
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.cancelEdit();
        this.success.set('Livreur mis à jour');
        this.load();
        setTimeout(() => this.success.set(''), 3000);
      },
      error: (err) => {
        this.error.set(err.error?.detail ?? 'Erreur');
        this.saving.set(false);
      },
    });
  }

  // ── Portions en édition ─────────────────────────────────────────────────────

  submitPortionAdd(): void {
    const l = this.editingLivreur();
    if (!l || this.portionEditForm.invalid) return;
    this.savingPortion.set(true);
    const v = this.portionEditForm.value;
    this.service.createLivreurInternePortion(l.id, {
      nom: v.nom!,
      prix_achat: v.prix_achat!,
      equivalent_pains: v.equivalent_pains!,
    }).subscribe({
      next: () => {
        this.savingPortion.set(false);
        this.portionEditForm.reset();
        this.showAddPortionEdit.set(false);
        this.loadPortionsForEdit(l.id);
      },
      error: (err) => {
        this.error.set(err.error?.detail ?? 'Erreur');
        this.savingPortion.set(false);
      },
    });
  }

  deletePortion(p: LivreurInternePortionPain): void {
    const l = this.editingLivreur();
    if (!l || !confirm(`Supprimer la portion "${p.nom}" ?`)) return;
    this.service.deleteLivreurInternePortion(l.id, p.id).subscribe({
      next: () => this.loadPortionsForEdit(l.id),
      error: (err) => this.error.set(err.error?.detail ?? 'Erreur'),
    });
  }

  // ── Autres actions ──────────────────────────────────────────────────────────

  deactivate(l: LivreurInterne): void {
    if (!confirm(`Désactiver ${l.prenom} ${l.nom} ?`)) return;
    this.service.deactivateLivreurInterne(l.id).subscribe({
      next: () => { this.success.set('Livreur désactivé'); this.load(); setTimeout(() => this.success.set(''), 3000); },
      error: (err) => this.error.set(err.error?.detail ?? 'Erreur'),
    });
  }

  viewCompte(l: LivreurInterne): void {
    this.compteDetail.set(null);
    this.service.getCompteInterne(l.id).subscribe({
      next: (c) => this.compteDetail.set(c),
      error: () => this.error.set('Aucun compte interne trouvé'),
    });
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
}
