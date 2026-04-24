import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminBoulangerieService } from '../../../core/services/admin-boulangerie.service';
import { LivreurLinkResponse } from '../../../core/models/admin_boulangerie.models';

@Component({
  selector: 'app-boulangerie-livreurs',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Livreurs liés</h1>
          <p class="text-gray-500 dark:text-gray-400 text-sm">Livreurs ayant accès à votre boulangerie</p>
        </div>
        <button (click)="showLinkForm.set(true)" class="btn-primary">+ Lier un livreur</button>
      </div>

      @if (error()) {
        <div class="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{{ error() }}</div>
      }
      @if (success()) {
        <div class="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg">{{ success() }}</div>
      }

      <!-- Link form -->
      @if (showLinkForm()) {
        <div class="card max-w-lg">
          <h2 class="font-semibold text-gray-900 dark:text-gray-100 mb-4">Lier un livreur</h2>
          <p class="text-sm text-gray-500 mb-4">Entrez le nom d'utilisateur ou l'email du compte livreur existant.</p>
          <form [formGroup]="linkForm" (ngSubmit)="linkLivreur()" class="space-y-4">
            <div>
              <label class="label">Identifiant (username ou email) *</label>
              <input type="text" formControlName="identifier" class="input-field" placeholder="jean.dupont ou jean@mail.com" />
            </div>
            <div>
              <label class="label">Prix d'achat du pain</label>
              <input type="number" formControlName="prix_achat_pain" class="input-field" step="0.01" placeholder="Ex: 150" />
            </div>
            <div>
              <label class="label">Contact local</label>
              <input type="text" formControlName="contact_local" class="input-field" placeholder="+221 77 000 00 00" />
            </div>
            <div class="flex gap-3">
              <button type="submit" class="btn-primary" [disabled]="linking()">
                @if (linking()) { Liaison... } @else { Lier }
              </button>
              <button type="button" class="btn-secondary" (click)="cancelLink()">Annuler</button>
            </div>
          </form>
        </div>
      }

      <!-- Contrat edit form -->
      @if (editingLivreur()) {
        <div class="card max-w-lg">
          <h2 class="font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Modifier le contrat — {{ editingLivreur()!.first_name }} {{ editingLivreur()!.last_name }}
          </h2>
          <form [formGroup]="contratForm" (ngSubmit)="saveContrat()" class="space-y-4">
            <div>
              <label class="label">Prix d'achat du pain</label>
              <input type="number" formControlName="prix_achat_pain" class="input-field" step="0.01" />
            </div>
            <div>
              <label class="label">Contact local</label>
              <input type="text" formControlName="contact_local" class="input-field" />
            </div>
            <div class="flex gap-3">
              <button type="submit" class="btn-primary" [disabled]="saving()">
                @if (saving()) { Enregistrement... } @else { Enregistrer }
              </button>
              <button type="button" class="btn-secondary" (click)="editingLivreur.set(null)">Annuler</button>
            </div>
          </form>
        </div>
      }

      <!-- Livreurs list -->
      @if (loading()) {
        <div class="text-center text-gray-400 py-8">Chargement...</div>
      } @else if (livreurs().length === 0) {
        <div class="card text-center py-12 text-gray-400">
          <div class="text-4xl mb-3">🚚</div>
          <p>Aucun livreur lié à cette boulangerie</p>
        </div>
      } @else {
        <div class="space-y-3">
          @for (l of livreurs(); track l.livreur_id) {
            <div class="card">
              <div class="flex items-start justify-between">
                <div class="flex items-center gap-3">
                  <span class="text-2xl">🚚</span>
                  <div>
                    <p class="font-medium text-gray-900 dark:text-gray-100">{{ l.first_name }} {{ l.last_name }}</p>
                    <p class="text-sm text-gray-500">{{ l.username }}{{ l.email ? ' · ' + l.email : '' }}</p>
                    <div class="flex gap-4 mt-1 text-xs text-gray-400">
                      @if (l.prix_achat_pain) {
                        <span>💰 Prix achat : {{ l.prix_achat_pain }}</span>
                      }
                      @if (l.contact_local) {
                        <span>📞 {{ l.contact_local }}</span>
                      }
                    </div>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-xs px-2 py-1 rounded-full"
                    [class.bg-green-100]="l.is_active" [class.text-green-700]="l.is_active"
                    [class.bg-gray-100]="!l.is_active" [class.text-gray-500]="!l.is_active">
                    {{ l.is_active ? 'Actif' : 'Inactif' }}
                  </span>
                  <button (click)="startEditContrat(l)" class="text-xs text-amber-600 hover:underline">Modifier</button>
                  <button (click)="unlinkLivreur(l)" class="text-xs text-red-500 hover:underline">Délier</button>
                </div>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class BoulangerieLivreursComponent implements OnInit {
  private fb = inject(FormBuilder);
  private service = inject(AdminBoulangerieService);

  livreurs = signal<LivreurLinkResponse[]>([]);
  loading = signal(true);
  linking = signal(false);
  saving = signal(false);
  showLinkForm = signal(false);
  editingLivreur = signal<LivreurLinkResponse | null>(null);
  error = signal('');
  success = signal('');

  linkForm = this.fb.group({
    identifier: ['', Validators.required],
    prix_achat_pain: [null as number | null],
    contact_local: [''],
  });

  contratForm = this.fb.group({
    prix_achat_pain: [null as number | null],
    contact_local: [''],
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.service.getLivreurs().subscribe({
      next: (d) => { this.livreurs.set(d); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  linkLivreur(): void {
    if (this.linkForm.invalid) return;
    this.linking.set(true);
    this.error.set('');
    this.service.linkLivreur({
      identifier: this.linkForm.value.identifier!,
      prix_achat_pain: this.linkForm.value.prix_achat_pain ?? undefined,
      contact_local: this.linkForm.value.contact_local || undefined,
    }).subscribe({
      next: () => {
        this.linking.set(false);
        this.cancelLink();
        this.success.set('Livreur lié avec succès');
        this.load();
        setTimeout(() => this.success.set(''), 3000);
      },
      error: (err) => {
        this.error.set(err.error?.detail ?? 'Livreur introuvable ou déjà lié');
        this.linking.set(false);
      },
    });
  }

  cancelLink(): void {
    this.showLinkForm.set(false);
    this.linkForm.reset();
  }

  startEditContrat(l: LivreurLinkResponse): void {
    this.editingLivreur.set(l);
    this.contratForm.patchValue({
      prix_achat_pain: l.prix_achat_pain ?? null,
      contact_local: l.contact_local ?? '',
    });
  }

  saveContrat(): void {
    const l = this.editingLivreur();
    if (!l) return;
    this.saving.set(true);
    this.service.updateContratLivreur(l.livreur_id, {
      prix_achat_pain: this.contratForm.value.prix_achat_pain ?? undefined,
      contact_local: this.contratForm.value.contact_local || undefined,
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.editingLivreur.set(null);
        this.success.set('Contrat mis à jour');
        this.load();
        setTimeout(() => this.success.set(''), 3000);
      },
      error: (err) => {
        this.error.set(err.error?.detail ?? 'Erreur');
        this.saving.set(false);
      },
    });
  }

  unlinkLivreur(l: LivreurLinkResponse): void {
    if (!confirm(`Délier ${l.first_name} ${l.last_name} ?`)) return;
    this.service.unlinkLivreur(l.livreur_id).subscribe({
      next: () => { this.success.set('Livreur délié'); this.load(); setTimeout(() => this.success.set(''), 3000); },
      error: () => {},
    });
  }
}
