import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { Fournisseur } from '../../../core/models/production.models';

@Component({
  selector: 'app-fournisseurs',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Mes boulangeries fournisseurs</h1>
          <p class="text-gray-500 dark:text-gray-400 text-sm">Gérez vos boulangeries d'approvisionnement</p>
        </div>
        <div class="flex gap-2">
          <button (click)="toggleCreateForm()" class="btn-primary text-sm">+ Créer une boulangerie</button>
          <button (click)="toggleLinkForm()" class="btn-secondary text-sm">Lier par ID</button>
        </div>
      </div>

      @if (error()) {
        <div class="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{{ error() }}</div>
      }
      @if (success()) {
        <div class="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg">{{ success() }}</div>
      }

      <!-- Formulaire création -->
      @if (showCreateForm()) {
        <div class="card max-w-lg">
          <h2 class="font-semibold text-gray-900 dark:text-gray-100 mb-4">Créer une nouvelle boulangerie</h2>
          <form [formGroup]="createForm" (ngSubmit)="submitCreate()" class="space-y-4">
            <div>
              <label class="label">Nom de la boulangerie *</label>
              <input type="text" formControlName="nom" class="input-field" placeholder="Ex: Boulangerie Centrale" />
            </div>
            <div>
              <label class="label">Contact</label>
              <input type="text" formControlName="contact" class="input-field" placeholder="+221 77 000 00 00" />
            </div>
            <div>
              <label class="label">Adresse</label>
              <input type="text" formControlName="address" class="input-field" placeholder="Ex: Quartier Médina, Dakar" />
            </div>
            <div>
              <label class="label">Prix d'achat du pain</label>
              <input type="number" formControlName="prix_achat_pain" class="input-field" step="0.01" min="0" placeholder="Ex: 150" />
            </div>
            <div>
              <label class="label">Contact local</label>
              <input type="text" formControlName="contact_local" class="input-field" placeholder="Contact référent" />
            </div>
            <div class="flex gap-3">
              <button type="submit" class="btn-primary" [disabled]="saving()">
                @if (saving()) { Enregistrement... } @else { Créer }
              </button>
              <button type="button" class="btn-secondary" (click)="showCreateForm.set(false)">Annuler</button>
            </div>
          </form>
        </div>
      }

      <!-- Formulaire liaison par ID -->
      @if (showLinkForm()) {
        <div class="card max-w-lg">
          <h2 class="font-semibold text-gray-900 dark:text-gray-100 mb-4">Lier une boulangerie existante</h2>
          <p class="text-sm text-gray-500 mb-4">Entrez l'identifiant de la boulangerie fourni par son administrateur.</p>
          <form [formGroup]="linkForm" (ngSubmit)="submitLink()" class="space-y-4">
            <div>
              <label class="label">ID de la boulangerie *</label>
              <input type="number" formControlName="boulangerie_id" class="input-field" placeholder="Ex: 12" />
            </div>
            <div>
              <label class="label">Prix d'achat du pain</label>
              <input type="number" formControlName="prix_achat_pain" class="input-field" step="0.01" min="0" />
            </div>
            <div>
              <label class="label">Contact local</label>
              <input type="text" formControlName="contact_local" class="input-field" />
            </div>
            <div class="flex gap-3">
              <button type="submit" class="btn-primary" [disabled]="saving()">
                @if (saving()) { Liaison... } @else { Lier }
              </button>
              <button type="button" class="btn-secondary" (click)="showLinkForm.set(false)">Annuler</button>
            </div>
          </form>
        </div>
      }

      <!-- Formulaire modification contrat -->
      @if (editingFournisseur()) {
        <div class="card max-w-lg">
          <h2 class="font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Modifier le contrat — {{ editingFournisseur()!.nom }}
          </h2>
          <form [formGroup]="editForm" (ngSubmit)="submitEdit()" class="space-y-4">
            <div>
              <label class="label">Prix d'achat du pain</label>
              <input type="number" formControlName="prix_achat_pain" class="input-field" step="0.01" min="0" />
            </div>
            <div>
              <label class="label">Contact local</label>
              <input type="text" formControlName="contact_local" class="input-field" />
            </div>
            <div class="flex gap-3">
              <button type="submit" class="btn-primary" [disabled]="saving()">
                @if (saving()) { Enregistrement... } @else { Enregistrer }
              </button>
              <button type="button" class="btn-secondary" (click)="editingFournisseur.set(null)">Annuler</button>
            </div>
          </form>
        </div>
      }

      <!-- Liste des fournisseurs -->
      @if (loading()) {
        <div class="text-center text-gray-400 py-8">Chargement...</div>
      } @else if (fournisseurs().length === 0) {
        <div class="card text-center py-12 text-gray-400">
          <div class="text-4xl mb-3">🥖</div>
          <p>Aucune boulangerie fournisseur configurée</p>
          <p class="text-sm mt-2">Créez ou liez une boulangerie pour commencer</p>
        </div>
      } @else {
        <div class="space-y-3">
          @for (f of fournisseurs(); track f.id) {
            <div class="card">
              <div class="flex items-start justify-between gap-3">
                <div class="flex items-center gap-3">
                  <span class="text-2xl">🥖</span>
                  <div>
                    <p class="font-medium text-gray-900 dark:text-gray-100">{{ f.nom }}</p>
                    <div class="flex flex-wrap gap-3 mt-1 text-xs text-gray-400">
                      @if (f.contact) {
                        <span>📞 {{ f.contact }}</span>
                      }
                      @if (f.address) {
                        <span>📍 {{ f.address }}</span>
                      }
                      @if (f.prix_achat_pain) {
                        <span>💰 Prix achat : {{ f.prix_achat_pain }}</span>
                      }
                      @if (f.contact_local) {
                        <span>🔗 {{ f.contact_local }}</span>
                      }
                    </div>
                    <div class="flex gap-2 mt-1">
                      <span class="text-xs px-2 py-0.5 rounded-full"
                        [class.bg-green-100]="f.lien_actif"
                        [class.text-green-700]="f.lien_actif"
                        [class.bg-red-100]="!f.lien_actif"
                        [class.text-red-700]="!f.lien_actif">
                        {{ f.lien_actif ? 'Lien actif' : 'Lien inactif' }}
                      </span>
                      @if (!f.is_managed) {
                        <span class="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Ma boulangerie</span>
                      }
                    </div>
                  </div>
                </div>
                <div class="flex items-center gap-2 flex-shrink-0">
                  <button (click)="startEdit(f)" class="text-xs text-blue-600 hover:underline">Modifier contrat</button>
                  <button (click)="unlink(f)" class="text-xs text-red-500 hover:underline">Se délier</button>
                </div>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class FournisseursComponent implements OnInit {
  private fb = inject(FormBuilder);
  private api = inject(ApiService);

  fournisseurs = signal<Fournisseur[]>([]);
  loading = signal(true);
  saving = signal(false);
  showCreateForm = signal(false);
  showLinkForm = signal(false);
  editingFournisseur = signal<Fournisseur | null>(null);
  error = signal('');
  success = signal('');

  createForm = this.fb.group({
    nom: ['', Validators.required],
    contact: [''],
    address: [''],
    prix_achat_pain: [null as number | null],
    contact_local: [''],
  });

  linkForm = this.fb.group({
    boulangerie_id: [null as number | null, Validators.required],
    prix_achat_pain: [null as number | null],
    contact_local: [''],
  });

  editForm = this.fb.group({
    prix_achat_pain: [null as number | null],
    contact_local: [''],
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.api.getFournisseurs().subscribe({
      next: (data) => { this.fournisseurs.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  toggleCreateForm(): void {
    this.showCreateForm.update((v) => !v);
    this.showLinkForm.set(false);
  }

  toggleLinkForm(): void {
    this.showLinkForm.update((v) => !v);
    this.showCreateForm.set(false);
  }

  submitCreate(): void {
    if (this.createForm.invalid) return;
    this.saving.set(true);
    this.error.set('');
    const v = this.createForm.value;
    this.api.createFournisseur({
      nom: v.nom!,
      contact: v.contact || undefined,
      address: v.address || undefined,
      prix_achat_pain: v.prix_achat_pain ?? undefined,
      contact_local: v.contact_local || undefined,
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.showCreateForm.set(false);
        this.createForm.reset();
        this.success.set('Boulangerie créée et liée');
        this.load();
        setTimeout(() => this.success.set(''), 3000);
      },
      error: (err) => { this.error.set(err.error?.detail ?? 'Erreur'); this.saving.set(false); },
    });
  }

  submitLink(): void {
    if (this.linkForm.invalid) return;
    this.saving.set(true);
    this.error.set('');
    const v = this.linkForm.value;
    this.api.linkFournisseur({
      boulangerie_id: v.boulangerie_id!,
      prix_achat_pain: v.prix_achat_pain ?? undefined,
      contact_local: v.contact_local || undefined,
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.showLinkForm.set(false);
        this.linkForm.reset();
        this.success.set('Boulangerie liée avec succès');
        this.load();
        setTimeout(() => this.success.set(''), 3000);
      },
      error: (err) => { this.error.set(err.error?.detail ?? 'Boulangerie introuvable ou déjà liée'); this.saving.set(false); },
    });
  }

  startEdit(f: Fournisseur): void {
    this.editingFournisseur.set(f);
    this.editForm.patchValue({
      prix_achat_pain: f.prix_achat_pain ?? null,
      contact_local: f.contact_local ?? '',
    });
  }

  submitEdit(): void {
    const f = this.editingFournisseur();
    if (!f) return;
    this.saving.set(true);
    this.error.set('');
    const v = this.editForm.value;
    this.api.updateContratFournisseur(f.id, {
      prix_achat_pain: v.prix_achat_pain ?? undefined,
      contact_local: v.contact_local || undefined,
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.editingFournisseur.set(null);
        this.success.set('Contrat mis à jour');
        this.load();
        setTimeout(() => this.success.set(''), 3000);
      },
      error: (err) => { this.error.set(err.error?.detail ?? 'Erreur'); this.saving.set(false); },
    });
  }

  unlink(f: Fournisseur): void {
    if (!confirm(`Se délier de "${f.nom}" ?`)) return;
    this.api.unlinkFournisseur(f.id).subscribe({
      next: () => { this.success.set('Délié avec succès'); this.load(); setTimeout(() => this.success.set(''), 3000); },
      error: (err) => this.error.set(err.error?.detail ?? 'Erreur'),
    });
  }
}
