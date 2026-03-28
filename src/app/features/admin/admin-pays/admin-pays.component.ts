import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminApiService } from '../../../core/services/admin-api.service';
import { Pays, PaysCreate } from '../../../core/models/pays.models';

@Component({
  selector: 'app-admin-pays',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="p-6 max-w-4xl">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-white">Pays & Devises</h1>
          <p class="text-gray-400 text-sm mt-1">Configurez les pays disponibles et leurs devises</p>
        </div>
        <button (click)="showForm.set(!showForm())"
          class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors">
          {{ showForm() ? 'Annuler' : '+ Ajouter un pays' }}
        </button>
      </div>

      @if (showForm()) {
        <div class="bg-gray-800 rounded-xl border border-gray-700 p-5 mb-6">
          <h3 class="text-white font-semibold mb-4">{{ editing() ? 'Modifier le pays' : 'Nouveau pays' }}</h3>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs text-gray-400 mb-1">Nom du pays *</label>
              <input [(ngModel)]="form.nom" class="admin-input" placeholder="ex: Sénégal" />
            </div>
            <div>
              <label class="block text-xs text-gray-400 mb-1">Code ISO *</label>
              <input [(ngModel)]="form.code" class="admin-input" placeholder="ex: SN" maxlength="10" />
            </div>
            <div>
              <label class="block text-xs text-gray-400 mb-1">Nom de la devise *</label>
              <input [(ngModel)]="form.devise_nom" class="admin-input" placeholder="ex: Franc CFA" />
            </div>
            <div>
              <label class="block text-xs text-gray-400 mb-1">Code devise *</label>
              <input [(ngModel)]="form.devise_code" class="admin-input" placeholder="ex: FCFA" />
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
              <th class="text-left px-4 py-3 text-gray-400 font-medium">Pays</th>
              <th class="text-left px-4 py-3 text-gray-400 font-medium">Code</th>
              <th class="text-left px-4 py-3 text-gray-400 font-medium">Devise</th>
              <th class="text-left px-4 py-3 text-gray-400 font-medium">Statut</th>
              <th class="text-right px-4 py-3 text-gray-400 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-700">
            @for (p of pays(); track p.id) {
              <tr class="hover:bg-gray-700/30 transition-colors">
                <td class="px-4 py-3 text-white font-medium">{{ p.nom }}</td>
                <td class="px-4 py-3 text-gray-300">{{ p.code }}</td>
                <td class="px-4 py-3 text-gray-300">{{ p.devise_nom }} <span class="text-gray-500">({{ p.devise_code }})</span></td>
                <td class="px-4 py-3">
                  <span class="text-xs px-2 py-1 rounded-full"
                    [class.bg-green-900]="p.is_active" [class.text-green-300]="p.is_active"
                    [class.bg-gray-700]="!p.is_active" [class.text-gray-400]="!p.is_active">
                    {{ p.is_active ? 'Actif' : 'Inactif' }}
                  </span>
                </td>
                <td class="px-4 py-3 text-right">
                  <div class="flex gap-2 justify-end">
                    <button (click)="startEdit(p)"
                      class="text-xs px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors">
                      Modifier
                    </button>
                    <button (click)="toggleActive(p)"
                      class="text-xs px-3 py-1.5 rounded-lg transition-colors"
                      [class.bg-amber-900]="p.is_active" [class.text-amber-300]="p.is_active"
                      [class.bg-gray-700]="!p.is_active" [class.text-gray-300]="!p.is_active">
                      {{ p.is_active ? 'Désactiver' : 'Activer' }}
                    </button>
                    <button (click)="deletePays(p)"
                      class="text-xs px-3 py-1.5 bg-red-900/40 hover:bg-red-900/70 text-red-400 rounded-lg transition-colors">
                      Supprimer
                    </button>
                  </div>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="5" class="px-4 py-10 text-center text-gray-500">Aucun pays configuré</td>
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
  `],
})
export class AdminPaysComponent implements OnInit {
  private api = inject(AdminApiService);

  pays = signal<Pays[]>([]);
  showForm = signal(false);
  saving = signal(false);
  error = signal('');
  editing = signal<Pays | null>(null);

  form: PaysCreate = { nom: '', code: '', devise_nom: '', devise_code: '' };

  ngOnInit(): void {
    this.api.getPays().subscribe((p) => this.pays.set(p));
  }

  startEdit(p: Pays): void {
    this.editing.set(p);
    this.form = { nom: p.nom, code: p.code, devise_nom: p.devise_nom, devise_code: p.devise_code };
    this.showForm.set(true);
  }

  cancelEdit(): void {
    this.editing.set(null);
    this.form = { nom: '', code: '', devise_nom: '', devise_code: '' };
    this.showForm.set(false);
    this.error.set('');
  }

  save(): void {
    if (!this.form.nom || !this.form.code || !this.form.devise_nom || !this.form.devise_code) {
      this.error.set('Tous les champs sont requis');
      return;
    }
    this.saving.set(true);
    this.error.set('');
    const editing = this.editing();
    const obs = editing
      ? this.api.updatePays(editing.id, this.form)
      : this.api.createPays(this.form);

    obs.subscribe({
      next: (p) => {
        this.pays.update((list) =>
          editing ? list.map((x) => (x.id === p.id ? p : x)) : [p, ...list]
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

  toggleActive(p: Pays): void {
    this.api.updatePays(p.id, { is_active: !p.is_active }).subscribe((updated) =>
      this.pays.update((list) => list.map((x) => (x.id === updated.id ? updated : x)))
    );
  }

  deletePays(p: Pays): void {
    if (!confirm(`Supprimer « ${p.nom} » ?`)) return;
    this.api.deletePays(p.id).subscribe({
      next: () => this.pays.update((list) => list.filter((x) => x.id !== p.id)),
      error: (err) => alert(err.error?.detail ?? 'Impossible de supprimer'),
    });
  }
}
