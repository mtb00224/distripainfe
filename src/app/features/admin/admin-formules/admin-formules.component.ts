import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { AdminApiService } from '../../../core/services/admin-api.service';
import { FormulaAbonnement, FormulaAbonnementCreate } from '../../../core/models/abonnement.models';

@Component({
  selector: 'app-admin-formules',
  standalone: true,
  imports: [FormsModule, DecimalPipe],
  template: `
    <div class="p-6 max-w-4xl">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-white">Formules d'abonnement</h1>
          <p class="text-gray-400 text-sm mt-1">Configurez les offres d'abonnement proposées aux livreurs</p>
        </div>
        <button (click)="showForm.set(!showForm())"
          class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors">
          {{ showForm() ? 'Annuler' : '+ Ajouter une formule' }}
        </button>
      </div>

      @if (showForm()) {
        <div class="bg-gray-800 rounded-xl border border-gray-700 p-5 mb-6">
          <h3 class="text-white font-semibold mb-4">{{ editing() ? 'Modifier la formule' : 'Nouvelle formule' }}</h3>
          <div class="grid grid-cols-2 gap-4">
            <div class="col-span-2">
              <label class="block text-xs text-gray-400 mb-1">Pays / Devise</label>
              <div class="admin-input flex items-center gap-2 text-gray-300">
                <span>🇸🇳</span> Sénégal — FCFA
              </div>
              <p class="text-xs text-gray-500 mt-1">Le projet fonctionne uniquement avec le FCFA sénégalais</p>
            </div>
            <div class="col-span-2">
              <label class="block text-xs text-gray-400 mb-1">Nom de la formule *</label>
              <input [(ngModel)]="form.nom" class="admin-input" placeholder="ex: Mensuel, Trimestriel..." />
            </div>
            <div>
              <label class="block text-xs text-gray-400 mb-1">Durée (mois) *</label>
              <input [(ngModel)]="form.duree_mois" type="number" min="1" class="admin-input" placeholder="ex: 1, 3, 12" />
            </div>
            <div>
              <label class="block text-xs text-gray-400 mb-1">Prix (FCFA) *</label>
              <input [(ngModel)]="form.prix" type="number" min="0" class="admin-input" placeholder="ex: 5000" />
            </div>
            <div class="col-span-2">
              <label class="block text-xs text-gray-400 mb-1">Description</label>
              <textarea [(ngModel)]="form.description" class="admin-input" rows="2"
                placeholder="Description optionnelle de la formule..."></textarea>
            </div>
          </div>
          @if (error()) {
            <p class="text-red-400 text-sm mt-3">{{ error() }}</p>
          }
          <div class="flex gap-3 mt-4">
            <button (click)="save()" [disabled]="saving()"
              class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors">
              {{ saving() ? 'Enregistrement...' : (editing() ? 'Modifier' : 'Créer') }}
            </button>
            <button (click)="cancelEdit()" class="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-sm transition-colors">
              Annuler
            </button>
          </div>
        </div>
      }

      <div class="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-gray-700/50 border-b border-gray-700">
            <tr>
              <th class="text-left px-4 py-3 text-gray-400 font-medium">Formule</th>
              <th class="text-left px-4 py-3 text-gray-400 font-medium">Pays</th>
              <th class="text-left px-4 py-3 text-gray-400 font-medium">Durée</th>
              <th class="text-left px-4 py-3 text-gray-400 font-medium">Prix</th>
              <th class="text-left px-4 py-3 text-gray-400 font-medium">Statut</th>
              <th class="text-right px-4 py-3 text-gray-400 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-700">
            @for (f of formules(); track f.id) {
              <tr class="hover:bg-gray-700/30 transition-colors">
                <td class="px-4 py-3">
                  <p class="text-white font-medium">{{ f.nom }}</p>
                  @if (f.description) {
                    <p class="text-gray-500 text-xs mt-0.5">{{ f.description }}</p>
                  }
                </td>
                <td class="px-4 py-3">
                  <span class="text-xs px-2 py-1 bg-green-900/40 text-green-300 rounded-full">🇸🇳 Sénégal</span>
                </td>
                <td class="px-4 py-3 text-gray-300">{{ f.duree_mois }} mois</td>
                <td class="px-4 py-3 text-gray-300 font-medium">{{ f.prix | number }} FCFA</td>
                <td class="px-4 py-3">
                  <span class="text-xs px-2 py-1 rounded-full"
                    [class.bg-green-900]="f.is_active" [class.text-green-300]="f.is_active"
                    [class.bg-gray-700]="!f.is_active" [class.text-gray-400]="!f.is_active">
                    {{ f.is_active ? 'Active' : 'Inactive' }}
                  </span>
                </td>
                <td class="px-4 py-3 text-right">
                  <div class="flex gap-2 justify-end">
                    <button (click)="startEdit(f)"
                      class="text-xs px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors">
                      Modifier
                    </button>
                    <button (click)="toggleActive(f)"
                      class="text-xs px-3 py-1.5 rounded-lg transition-colors"
                      [class.bg-amber-900]="f.is_active" [class.text-amber-300]="f.is_active"
                      [class.bg-gray-700]="!f.is_active" [class.text-gray-300]="!f.is_active">
                      {{ f.is_active ? 'Désactiver' : 'Activer' }}
                    </button>
                    <button (click)="deleteFormule(f)"
                      class="text-xs px-3 py-1.5 bg-red-900/40 hover:bg-red-900/70 text-red-400 rounded-lg transition-colors">
                      Supprimer
                    </button>
                  </div>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="6" class="px-4 py-10 text-center text-gray-500">Aucune formule configurée</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .admin-input {
      @apply w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm
             focus:outline-none focus:border-indigo-500 placeholder-gray-500;
    }
    textarea.admin-input { @apply resize-none; }
  `],
})
export class AdminFormulesComponent implements OnInit {
  private api = inject(AdminApiService);

  formules = signal<FormulaAbonnement[]>([]);
  showForm = signal(false);
  saving = signal(false);
  error = signal('');
  editing = signal<FormulaAbonnement | null>(null);

  form: FormulaAbonnementCreate & { description?: string } = { pays_id: null, nom: '', duree_mois: 1, prix: 0 };

  ngOnInit(): void {
    this.api.getFormules().subscribe((f) => this.formules.set(f));
  }

  startEdit(f: FormulaAbonnement): void {
    this.editing.set(f);
    this.form = { pays_id: null, nom: f.nom, duree_mois: f.duree_mois, prix: f.prix, description: f.description ?? '' };
    this.showForm.set(true);
  }

  cancelEdit(): void {
    this.editing.set(null);
    this.form = { pays_id: null, nom: '', duree_mois: 1, prix: 0 };
    this.showForm.set(false);
    this.error.set('');
  }

  save(): void {
    if (!this.form.nom || !this.form.duree_mois || this.form.prix == null) {
      this.error.set('Nom, durée et prix sont requis');
      return;
    }
    this.saving.set(true);
    this.error.set('');
    const editing = this.editing();
    const obs = editing
      ? this.api.updateFormule(editing.id, this.form)
      : this.api.createFormule(this.form);

    obs.subscribe({
      next: (f) => {
        this.formules.update((list) =>
          editing ? list.map((x) => (x.id === f.id ? f : x)) : [f, ...list]
        );
        this.cancelEdit();
        this.saving.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.detail ?? 'Erreur');
        this.saving.set(false);
      },
    });
  }

  toggleActive(f: FormulaAbonnement): void {
    this.api.updateFormule(f.id, { is_active: !f.is_active }).subscribe((updated) =>
      this.formules.update((list) => list.map((x) => (x.id === updated.id ? updated : x)))
    );
  }

  deleteFormule(f: FormulaAbonnement): void {
    if (!confirm(`Supprimer la formule « ${f.nom} » ?`)) return;
    this.api.deleteFormule(f.id).subscribe({
      next: () => this.formules.update((list) => list.filter((x) => x.id !== f.id)),
      error: (err) => alert(err.error?.detail ?? 'Impossible de supprimer'),
    });
  }
}
