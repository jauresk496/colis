import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Colis, HistoriqueColis } from '../models';
import { NotificationService } from './notification.service';
import { API_URL } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ColisService {
  private colisSignal = signal<Colis[]>([]);
  readonly colis = this.colisSignal.asReadonly();
  readonly loading = signal(false);
  private http = inject(HttpClient);
  private notifications = inject(NotificationService);

  constructor() {
    this.refresh();
  }

  refresh(): void {
    this.loading.set(true);
    this.http.get<any[]>(`${API_URL}/colis`).subscribe({
      next: (rows) => {
        const mapped = (rows ?? []).map((c) => this.mapColisListDto(c));
        this.colisSignal.set(mapped);
        this.loading.set(false);
      },
      error: () => {
        this.colisSignal.set([]);
        this.loading.set(false);
        this.notifications.error('Erreur lors du chargement des colis');
      }
    });
  }

  fetchColisDetails(colisId: string) {
    return this.http.get<any>(`${API_URL}/colis/${colisId}`);
  }

  generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  generateNumeroSuivi(): string {
    const prefix = 'COL';
    const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    return `${prefix}${random}`;
  }

  createColis(colisData: Omit<Colis, 'id' | 'numeroSuivi' | 'dateReception' | 'statut' | 'historique'>): void {
    const payload = {
      expediteur: colisData.expediteur,
      destinataire: colisData.destinataire,
      telephone: colisData.telephone,
      adresse: colisData.adresse,
      type: colisData.type
    };

    this.http.post(`${API_URL}/colis`, payload).subscribe({
      next: () => {
        this.refresh();
        this.notifications.success('Colis créé avec succès');
      },
      error: () => this.notifications.error('Erreur lors de la création du colis')
    });
  }

  updateStatutColis(colisId: string, nouveauStatut: Colis['statut'], commentaire?: string, livreurId?: string): void {
    this.http.post(`${API_URL}/colis/${colisId}/status`, {
      statut: nouveauStatut,
      commentaire,
      livreurId
    }).subscribe({
      next: () => {
        this.refresh();
        this.notifications.success('Statut mis à jour');
      },
      error: () => this.notifications.error('Erreur lors de la mise à jour du statut')
    });
  }

  assignerLivreur(colisId: string, livreurId: string): void {
    this.http.post(`${API_URL}/colis/${colisId}/assign`, { livreurId }).subscribe({
      next: () => {
        this.refresh();
        this.notifications.success('Livreur assigné avec succès');
      },
      error: () => this.notifications.error('Erreur lors de l\'assignation')
    });
  }

  assignerLivreurSync(colisId: string, livreurId: string): { previousLivreurId?: string } {
    const colis = this.getColisById(colisId);
    const previousLivreurId = colis?.livreurId;
    this.assignerLivreur(colisId, livreurId);
    return { previousLivreurId };
  }

  getColisById(id: string): Colis | undefined {
    return this.colisSignal().find(colis => colis.id === id);
  }

  getColisByNumeroSuivi(numeroSuivi: string): Colis | undefined {
    return this.colisSignal().find(colis => colis.numeroSuivi === numeroSuivi);
  }

  getColisByLivreur(livreurId: string): Colis[] {
    return this.colisSignal().filter(colis => colis.livreurId === livreurId);
  }

  deleteColis(colisId: string): void {
    this.http.delete(`${API_URL}/colis/${colisId}`).subscribe({
      next: () => {
        this.refresh();
        this.notifications.success('Colis supprimé');
      },
      error: () => this.notifications.error('Erreur lors de la suppression')
    });
  }

  private mapColisListDto(c: any): Colis {
    return {
      id: String(c.id),
      numeroSuivi: String(c.numeroSuivi ?? ''),
      expediteur: String(c.expediteur ?? ''),
      destinataire: String(c.destinataire ?? ''),
      telephone: String(c.telephone ?? ''),
      adresse: String(c.adresse ?? ''),
      type: (c.type === 'client' || c.type === 'fournisseur') ? c.type : 'client',
      dateReception: c.dateReception ? new Date(c.dateReception) : new Date(),
      statut: (c.statut === 'recu' || c.statut === 'en_cours' || c.statut === 'livre' || c.statut === 'echec' || c.statut === 'retourne') ? c.statut : 'recu',
      livreurId: c.livreurId ? String(c.livreurId) : undefined,
      historique: []
    };
  }
}
