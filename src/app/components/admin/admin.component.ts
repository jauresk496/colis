import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Colis, Livreur } from '../../models';
import { ColisService, LivreurService } from '../../services';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css'
})
export class AdminComponent {
  activeTab = signal<'colis' | 'livreurs'>('colis');
  showCreateColisForm = signal(false);
  showCreateLivreurForm = signal(false);
  
  selectedColis = signal<Colis | null>(null);
  selectedLivreur = signal<Livreur | null>(null);
  showEditLivreurForm = signal(false);
  editLivreurData = signal<Livreur | null>(null);

  colisSearch = signal('');
  colisStatutFilter = signal<'' | Colis['statut']>('');
  colisLivreurFilter = signal<string>('');
  colisSort = signal<'date' | 'numero' | 'statut'>('date');

  livreurSearch = signal('');
  livreurStatutFilter = signal<'' | Livreur['statut']>('');
  livreurSort = signal<'nom' | 'statut' | 'colis'>('nom');

  constructor(
    private colisService: ColisService,
    private livreurService: LivreurService
  ) {}

  get colisServicePublic() { return this.colisService; }
  get livreurServicePublic() { return this.livreurService; }

  // Getters for template
  get colis() {
    return this.colisService.colis;
  }

  get livreurs() {
    return this.livreurService.livreurs;
  }

  colisFiltres = computed(() => {
    const q = this.colisSearch().trim().toLowerCase();
    const statut = this.colisStatutFilter();
    const livreurId = this.colisLivreurFilter();
    const sort = this.colisSort();

    const filtered = this.colis().filter((c: Colis) => {
      const matchQ = !q
        || c.numeroSuivi.toLowerCase().includes(q)
        || c.destinataire.toLowerCase().includes(q)
        || c.telephone.toLowerCase().includes(q)
        || c.adresse.toLowerCase().includes(q);

      const matchStatut = !statut || c.statut === statut;
      const matchLivreur = !livreurId || c.livreurId === livreurId;

      return matchQ && matchStatut && matchLivreur;
    });

    const sorted = [...filtered];
    sorted.sort((a: Colis, b: Colis) => {
      if (sort === 'numero') return a.numeroSuivi.localeCompare(b.numeroSuivi);
      if (sort === 'statut') return a.statut.localeCompare(b.statut);
      return new Date(b.dateReception).getTime() - new Date(a.dateReception).getTime();
    });

    return sorted;
  });

  livreursFiltres = computed(() => {
    const q = this.livreurSearch().trim().toLowerCase();
    const statut = this.livreurStatutFilter();
    const sort = this.livreurSort();

    const filtered = this.livreurs().filter((l: Livreur) => {
      const matchQ = !q
        || l.nom.toLowerCase().includes(q)
        || l.telephone.toLowerCase().includes(q);
      const matchStatut = !statut || l.statut === statut;
      return matchQ && matchStatut;
    });

    const sorted = [...filtered];
    sorted.sort((a: Livreur, b: Livreur) => {
      if (sort === 'statut') return a.statut.localeCompare(b.statut);
      if (sort === 'colis') return (b.colisAssignes?.length ?? 0) - (a.colisAssignes?.length ?? 0);
      return a.nom.localeCompare(b.nom);
    });

    return sorted;
  });

  // Computed properties
  colisStats = computed(() => {
    const allColis = this.colis();
    return {
      total: allColis.length,
      recus: allColis.filter((c: Colis) => c.statut === 'recu').length,
      enCours: allColis.filter((c: Colis) => c.statut === 'en_cours').length,
      livres: allColis.filter((c: Colis) => c.statut === 'livre').length,
      echecs: allColis.filter((c: Colis) => c.statut === 'echec').length,
      retournes: allColis.filter((c: Colis) => c.statut === 'retourne').length
    };
  });

  livreursActifs = computed(() => {
    return this.livreurs().filter((l: Livreur) => l.statut === 'actif');
  });

  // Navigation
  setActiveTab(tab: 'colis' | 'livreurs') {
    this.activeTab.set(tab);
  }

  // Colis management
  createColis(colisData: any) {
    this.colisService.createColis(colisData);
    this.showCreateColisForm.set(false);
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

  assignerLivreur(colisId: string, livreurId: string) {
    if (!livreurId) return;

    const { previousLivreurId } = this.colisService.assignerLivreurSync(colisId, livreurId);

    if (previousLivreurId && previousLivreurId !== livreurId) {
      this.livreurService.retirerColis(previousLivreurId, colisId);
    }
    this.livreurService.assignerColis(livreurId, colisId);

    // DB is source of truth
    this.livreurService.refresh();
  }

  updateStatutColis(colisId: string, statut: string) {
    this.colisService.updateStatutColis(colisId, statut as Colis['statut']);
  }

  deleteColis(colisId: string) {
    const colis = this.colisService.getColisById(colisId);
    if (colis?.livreurId) {
      this.livreurService.retirerColis(colis.livreurId, colisId);
    }
    this.colisService.deleteColis(colisId);
    this.selectedColis.set(null);

    // DB is source of truth
    this.livreurService.refresh();
  }

  // Livreurs management
  createLivreur(livreurData: any) {
    this.livreurService.createLivreur(livreurData);
    this.showCreateLivreurForm.set(false);
  }

  selectLivreur(livreur: Livreur) {
    this.selectedLivreur.set(livreur);
  }

  editLivreur(livreur: Livreur) {
    this.editLivreurData.set({ ...livreur });
    this.showEditLivreurForm.set(true);
    this.selectedLivreur.set(null);
  }

  saveEditLivreur(livreurData: any) {
    const id = this.editLivreurData()?.id;
    if (!id) return;
    this.livreurService.updateLivreur(id, {
      nom: livreurData.nom,
      telephone: livreurData.telephone,
      statut: livreurData.statut
    });
    this.showEditLivreurForm.set(false);
    this.editLivreurData.set(null);
  }

  updateLivreurStatut(livreurId: string, statut: 'actif' | 'inactif') {
    this.livreurService.updateLivreur(livreurId, { statut });
  }

  deleteLivreur(livreurId: string) {
    this.livreurService.deleteLivreur(livreurId);
    this.selectedLivreur.set(null);
  }

  exportColisCSV() {
    const colis = this.colisFiltres();
    if (colis.length === 0) return;

    const headers = ['Numero', 'Expediteur', 'Destinataire', 'Telephone', 'Adresse', 'Type', 'Statut', 'Date', 'Livreur'];
    const rows = colis.map(c => [
      c.numeroSuivi,
      c.expediteur,
      c.destinataire,
      c.telephone,
      c.adresse,
      c.type,
      c.statut,
      new Date(c.dateReception).toLocaleDateString('fr-FR'),
      c.livreurId ? this.getLivreurName(c.livreurId) : 'Non assigne'
    ]);

    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(';'))
      .join('\n');

    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `colis_export_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Utility methods
  getStatutColor(statut: string): string {
    const colors = {
      'recu': 'bg-blue-100 text-blue-800',
      'en_cours': 'bg-yellow-100 text-yellow-800',
      'livre': 'bg-green-100 text-green-800',
      'echec': 'bg-red-100 text-red-800',
      'retourne': 'bg-gray-100 text-gray-800',
      'actif': 'bg-green-100 text-green-800',
      'inactif': 'bg-red-100 text-red-800'
    };
    return colors[statut as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('fr-FR');
  }

  getLivreurName(livreurId: string): string {
    const livreur = this.livreurs().find(l => l.id === livreurId);
    return livreur ? livreur.nom : 'Non assigné';
  }

  imprimerRecuColis(colis: Colis) {
    const livreurNom = colis.livreurId ? this.getLivreurName(colis.livreurId) : 'Non assigné';

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
        <div class="sub">Gestion de Colis</div>
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
