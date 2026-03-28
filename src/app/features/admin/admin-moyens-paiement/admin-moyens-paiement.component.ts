import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminApiService } from '../../../core/services/admin-api.service';
import { MoyenPaiement, MoyenPaiementCreate } from '../../../core/models/abonnement.models';
import { Pays } from '../../../core/models/pays.models';

@Component({
  selector: 'app-admin-moyens-paiement',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="p-6 max-w-4xl">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-white">Moyens de paiement</h1>
          <p class="text-gray-400 text-sm mt-1">Configurez les numéros Wave, Orange Money, MoMo, etc.</p>
        </div>
        <button (click)="showForm.set(!showForm())"
          class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors">
          {{ showForm() ? 'Annuler' : '+ Ajouter un moyen' }}
        </button>
      </div>

      @if (showForm()) {
        <div class="bg-gray-800 rounded-xl border border-gray-700 p-5 mb-6">
          <h3 class="text-white font-semibold mb-4">{{ editing() ? 'Modifier le moyen' : 'Nouveau moyen de paiement' }}</h3>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs text-gray-400 mb-1">Nom *</label>
              <input [(ngModel)]="form.nom" class="admin-input" placeholder="ex: Wave, Orange Money..." />
            </div>
            <div>
              <label class="block text-xs text-gray-400 mb-1">Numéro *</label>
              <input [(ngModel)]="form.numero" class="admin-input" placeholder="ex: +221 77 000 00 00" />
            </div>
            <div>
              <label class="block text-xs text-gray-400 mb-1">Pays (optionnel)</label>
              <select [(ngModel)]="form.pays_id" class="admin-input">
                <option [ngValue]="null">Tous les pays</option>
                @for (p of pays(); track p.id) {
                  <option [ngValue]="p.id">{{ p.nom }} ({{ p.devise_code }})</option>
                }
              </select>
            </div>
            <div class="col-span-2">
              <label class="block text-xs text-gray-400 mb-1">Instructions</label>
              <textarea [(ngModel)]="form.instructions" class="admin-input" rows="2"
                placeholder="Instructions pour le livreur (optionnel)..."></textarea>
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
              <th class="text-left px-4 py-3 text-gray-400 font-medium">Service</th>
              <th class="text-left px-4 py-3 text-gray-400 font-medium">Numéro</th>
              <th class="text-left px-4 py-3 text-gray-400 font-medium">Pays</th>
              <th class="text-left px-4 py-3 text-gray-400 font-medium">Statut</th>
              <th class="text-right px-4 py-3 text-gray-400 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-700">
            @for (m of moyens(); track m.id) {
              <tr class="hover:bg-gray-700/30 transition-colors">
                <td class="px-4 py-3">
                  <p class="text-white font-medium">{{ m.nom }}</p>
                  @if (m.instructions) {
                    <p class="text-gray-500 text-xs mt-0.5">{{ m.instructions }}</p>
                  }
                </td>
                <td class="px-4 py-3 text-gray-300 font-mono">{{ m.numero }}</td>
                <td class="px-4 py-3 text-gray-400 text-xs">
                  {{ m.pays ? m.pays.nom : 'Tous les pays' }}
                </td>
                <td class="px-4 py-3">
                  <span class="text-xs px-2 py-1 rounded-full"
                    [class.bg-green-900]="m.is_active" [class.text-green-300]="m.is_active"
                    [class.bg-gray-700]="!m.is_active" [class.text-gray-400]="!m.is_active">
                    {{ m.is_active ? 'Actif' : 'Inactif' }}
                  </span>
                </td>
                <td class="px-4 py-3 text-right">
                  <div class="flex gap-2 justify-end">
                    <button (click)="startEdit(m)"
                      class="text-xs px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors">
                      Modifier
                    </button>
                    <button (click)="toggleActive(m)"
                      class="text-xs px-3 py-1.5 rounded-lg transition-colors"
                      [class.bg-amber-900]="m.is_active" [class.text-amber-300]="m.is_active"
                      [class.bg-gray-700]="!m.is_active" [class.text-gray-300]="!m.is_active">
                      {{ m.is_active ? 'Désactiver' : 'Activer' }}
                    </button>
                    <button (click)="deleteMoyen(m)"
                      class="text-xs px-3 py-1.5 bg-red-900/40 hover:bg-red-900/70 text-red-400 rounded-lg transition-colors">
                      Supprimer
                    </button>
                  </div>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="5" class="px-4 py-10 text-center text-gray-500">Aucun moyen de paiement configuré</td>
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
export class AdminMoyensPaiementComponent implements OnInit {
  private api = inject(AdminApiService);

  moyens = signal<MoyenPaiement[]>([]);
  pays = signal<Pays[]>([]);
  showForm = signal(false);
  saving = signal(false);
  error = signal('');
  editing = signal<MoyenPaiement | null>(null);

  form: MoyenPaiementCreate = { nom: '', numero: '', pays_id: null };

  ngOnInit(): void {
    this.api.getMoyensPaiement().subscribe((m) => this.moyens.set(m));
    this.api.getPays().subscribe((p) => this.pays.set(p));
  }

  startEdit(m: MoyenPaiement): void {
    this.editing.set(m);
    this.form = { nom: m.nom, numero: m.numero, pays_id: m.pays_id ?? null, instructions: m.instructions ?? '' };
    this.showForm.set(true);
  }

  cancelEdit(): void {
    this.editing.set(null);
    this.form = { nom: '', numero: '', pays_id: null };
    this.showForm.set(false);
    this.error.set('');
  }

  save(): void {
    if (!this.form.nom || !this.form.numero) {
      this.error.set('Nom et numéro sont requis');
      return;
    }
    this.saving.set(true);
    this.error.set('');
    const editing = this.editing();
    const obs = editing
      ? this.api.updateMoyenPaiement(editing.id, this.form)
      : this.api.createMoyenPaiement(this.form);

    obs.subscribe({
      next: (m) => {
        this.moyens.update((list) =>
          editing ? list.map((x) => (x.id === m.id ? m : x)) : [m, ...list]
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

  toggleActive(m: MoyenPaiement): void {
    this.api.updateMoyenPaiement(m.id, { is_active: !m.is_active }).subscribe((updated) =>
      this.moyens.update((list) => list.map((x) => (x.id === updated.id ? updated : x)))
    );
  }

  deleteMoyen(m: MoyenPaiement): void {
    if (!confirm(`Supprimer « ${m.nom} » ?`)) return;
    this.api.deleteMoyenPaiement(m.id).subscribe({
      next: () => this.moyens.update((list) => list.filter((x) => x.id !== m.id)),
      error: (err) => alert(err.error?.detail ?? 'Impossible de supprimer'),
    });
  }
}
