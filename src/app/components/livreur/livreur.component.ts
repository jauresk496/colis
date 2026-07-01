import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Colis, Livreur } from '../../models';
import { ColisService, LivreurService } from '../../services';

@Component({
  selector: 'app-livreur',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './livreur.component.html',
  styleUrl: './livreur.component.css'
})
export class LivreurComponent {
  currentLivreur = signal<Livreur | null>(null);
  selectedColis = signal<Colis | null>(null);
  showLivreurSelection = signal(true);

  colisSearch = signal('');
  colisStatutFilter = signal<'' | Colis['statut']>('');
  colisSort = signal<'date' | 'numero' | 'statut'>('date');

  constructor(
    private colisService: ColisService,
    private livreurService: LivreurService
  ) {}

  // Getters for template
  get colis() {
    return this.colisService.colis;
  }

  get livreurs() {
    return this.livreurService.livreurs;
  }

  // Computed properties
  mesColis = computed(() => {
    if (!this.currentLivreur()) return [];
    return this.colis().filter(c => c.livreurId === this.currentLivreur()!.id);
  });

  mesColisFiltres = computed(() => {
    const q = this.colisSearch().trim().toLowerCase();
    const statut = this.colisStatutFilter();
    const sort = this.colisSort();

    const filtered = this.mesColis().filter((c: Colis) => {
      const matchQ = !q
        || c.numeroSuivi.toLowerCase().includes(q)
        || c.destinataire.toLowerCase().includes(q)
        || c.telephone.toLowerCase().includes(q)
        || c.adresse.toLowerCase().includes(q);
      const matchStatut = !statut || c.statut === statut;
      return matchQ && matchStatut;
    });

    const sorted = [...filtered];
    sorted.sort((a: Colis, b: Colis) => {
      if (sort === 'numero') return a.numeroSuivi.localeCompare(b.numeroSuivi);
      if (sort === 'statut') return a.statut.localeCompare(b.statut);
      return new Date(b.dateReception).getTime() - new Date(a.dateReception).getTime();
    });

    return sorted;
  });

  colisStats = computed(() => {
    const mesColis = this.mesColis();
    return {
      total: mesColis.length,
      enCours: mesColis.filter(c => c.statut === 'en_cours').length,
      livres: mesColis.filter(c => c.statut === 'livre').length,
      echecs: mesColis.filter(c => c.statut === 'echec').length
    };
  });

  livreursActifs = computed(() => {
    return this.livreurs().filter((l: Livreur) => l.statut === 'actif');
  });

  // Methods
  selectLivreur(livreur: Livreur) {
    this.currentLivreur.set(livreur);
    this.showLivreurSelection.set(false);
  }

  selectColis(colis: Colis) {
    this.colisService.fetchColisDetails(colis.id).subscribe({
      next: (details) => {
        const historique = Array.isArray(details?.historique) ? details.historique.map((h: any) => ({
          id: String(h.id ?? ''),
          colisId: String(h.colis_id ?? h.colisId ?? colis.id),
          statut: h.statut,
          date: h.date_evt ? new Date(h.date_evt) : (h.date ? new Date(h.date) : new Date()),
          commentaire: h.commentaire ?? undefined,
          livreurId: h.livreur_id ?? h.livreurId ?? undefined,
        })) : [];

        this.selectedColis.set({
          ...colis,
          historique
        });
      },
      error: () => this.selectedColis.set(colis)
    });
  }

  updateStatutColis(colisId: string, statut: Colis['statut'], commentaire?: string) {
    this.colisService.updateStatutColis(colisId, statut, commentaire, this.currentLivreur()!.id);
    this.selectedColis.set(null);
  }

  changeLivreur() {
    this.showLivreurSelection.set(true);
    this.currentLivreur.set(null);
    this.selectedColis.set(null);

    this.resetFiltres();
  }

  resetFiltres() {
    this.colisSearch.set('');
    this.colisStatutFilter.set('');
    this.colisSort.set('date');
  }

  // Utility methods
  getStatutColor(statut: string): string {
    const colors = {
      'recu': 'bg-blue-100 text-blue-800',
      'en_cours': 'bg-yellow-100 text-yellow-800',
      'livre': 'bg-green-100 text-green-800',
      'echec': 'bg-red-100 text-red-800',
      'retourne': 'bg-gray-100 text-gray-800'
    };
    return colors[statut as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('fr-FR');
  }

  getStatutLabel(statut: string): string {
    const labels = {
      'recu': 'Reçu',
      'en_cours': 'En cours',
      'livre': 'Livré',
      'echec': 'Échec',
      'retourne': 'Retourné'
    };
    return labels[statut as keyof typeof labels] || statut;
  }

  imprimerRecuColis(colis: Colis) {
    const livreurNom = this.currentLivreur()?.nom ?? 'Livreur';

    const esc = (v: any) => String(v ?? '').replace(/[&<>"']/g, (c) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    } as any)[c] ?? c);

    const html = `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Reçu Colis ${esc(colis.numeroSuivi)}</title>
  <style>
    :root { --border: #e5e7eb; --muted: #6b7280; }
    * { box-sizing: border-box; }
    body { font-family: Arial, Helvetica, sans-serif; margin: 0; padding: 24px; color: #111827; }
    .sheet { max-width: 820px; margin: 0 auto; border: 1px solid var(--border); border-radius: 10px; padding: 18px; }
    .top { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; }
    .brand h1 { margin: 0; font-size: 18px; }
    .brand .sub { margin-top: 6px; color: var(--muted); font-size: 12px; }
    .meta { text-align: right; }
    .meta .num { font-weight: 700; font-size: 16px; }
    .meta .date { margin-top: 4px; color: var(--muted); font-size: 12px; }
    hr { border: 0; border-top: 1px solid var(--border); margin: 14px 0; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    .card { border: 1px solid var(--border); border-radius: 10px; padding: 12px; }
    .card h2 { margin: 0 0 8px; font-size: 14px; }
    .row { display: flex; gap: 8px; font-size: 13px; margin: 6px 0; }
    .row .k { min-width: 120px; color: var(--muted); }
    .badge { display: inline-block; padding: 2px 10px; border-radius: 999px; font-size: 12px; border: 1px solid var(--border); }
    .footer { margin-top: 14px; font-size: 12px; color: var(--muted); display: flex; justify-content: space-between; gap: 12px; }
    @media print {
      body { padding: 0; }
      .sheet { border: none; border-radius: 0; }
    }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="top">
      <div class="brand">
        <h1>Reçu / Bon de livraison</h1>
        <div class="sub">Espace Livreur</div>
      </div>
      <div class="meta">
        <div class="num">${esc(colis.numeroSuivi)}</div>
        <div class="date">Imprimé le ${esc(new Date().toLocaleString('fr-FR'))}</div>
      </div>
    </div>

    <hr />

    <div class="grid">
      <div class="card">
        <h2>Informations colis</h2>
        <div class="row"><div class="k">Type</div><div>${esc(colis.type)}</div></div>
        <div class="row"><div class="k">Statut</div><div><span class="badge">${esc(colis.statut)}</span></div></div>
        <div class="row"><div class="k">Date réception</div><div>${esc(new Date(colis.dateReception).toLocaleDateString('fr-FR'))}</div></div>
        <div class="row"><div class="k">Livreur</div><div>${esc(livreurNom)}</div></div>
      </div>

      <div class="card">
        <h2>Expéditeur</h2>
        <div class="row"><div class="k">Nom</div><div>${esc(colis.expediteur)}</div></div>
      </div>

      <div class="card">
        <h2>Destinataire</h2>
        <div class="row"><div class="k">Nom</div><div>${esc(colis.destinataire)}</div></div>
        <div class="row"><div class="k">Téléphone</div><div>${esc(colis.telephone)}</div></div>
        <div class="row"><div class="k">Adresse</div><div>${esc(colis.adresse)}</div></div>
      </div>

      <div class="card">
        <h2>Signature</h2>
        <div class="row"><div class="k">Livreur</div><div>________________________</div></div>
        <div class="row"><div class="k">Client</div><div>________________________</div></div>
      </div>
    </div>

    <div class="footer">
      <div>Numéro de suivi: <strong>${esc(colis.numeroSuivi)}</strong></div>
      <div>Conservez ce reçu.</div>
    </div>
  </div>
  <script>
    window.onload = () => {
      window.focus();
      window.print();
    };
  </script>
</body>
</html>`;

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      document.body.removeChild(iframe);
      return;
    }

    doc.open();
    doc.write(html);
    doc.close();

    const cleanup = () => {
      try {
        document.body.removeChild(iframe);
      } catch {
        // ignore
      }
    };

    const attemptPrint = () => {
      const win = iframe.contentWindow;
      if (!win) {
        cleanup();
        return;
      }
      win.focus();
      win.print();
      setTimeout(cleanup, 1000);
    };

    iframe.onload = () => {
      setTimeout(attemptPrint, 250);
    };

    setTimeout(attemptPrint, 800);
  }
}
