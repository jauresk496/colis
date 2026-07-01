import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Livreur } from '../models';
import { NotificationService } from './notification.service';
import { API_URL } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LivreurService {
  private livreursSignal = signal<Livreur[]>([]);
  readonly livreurs = this.livreursSignal.asReadonly();
  readonly loading = signal(false);
  private http = inject(HttpClient);
  private notifications = inject(NotificationService);

  constructor() {
    this.refresh();
  }

  refresh(): void {
    this.loading.set(true);
    this.http.get<any[]>(`${API_URL}/livreurs`).subscribe({
      next: (rows) => {
        const mapped = (rows ?? []).map((l) => this.mapLivreurDto(l));
        this.livreursSignal.set(mapped);
        this.loading.set(false);
      },
      error: () => {
        this.livreursSignal.set([]);
        this.loading.set(false);
        this.notifications.error('Erreur lors du chargement des livreurs');
      }
    });
  }

  generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  createLivreur(livreurData: Omit<Livreur, 'id' | 'dateCreation' | 'colisAssignes'>): Livreur {
    const nouveauLivreur: Livreur = {
      ...livreurData,
      id: this.generateUUID(),
      dateCreation: new Date(),
      colisAssignes: []
    };

    this.http.post(`${API_URL}/livreurs`, {
      nom: nouveauLivreur.nom,
      telephone: nouveauLivreur.telephone,
      statut: nouveauLivreur.statut
    }).subscribe({
      next: () => {
        this.refresh();
        this.notifications.success('Livreur créé avec succès');
      },
      error: () => this.notifications.error('Erreur lors de la création du livreur')
    });

    return nouveauLivreur;
  }

  updateLivreur(livreurId: string, livreurData: Partial<Livreur>): void {
    const payload: any = {};
    if (livreurData.nom !== undefined) payload.nom = livreurData.nom;
    if (livreurData.telephone !== undefined) payload.telephone = livreurData.telephone;
    if (livreurData.statut !== undefined) payload.statut = livreurData.statut;

    this.http.patch(`${API_URL}/livreurs/${livreurId}`, payload).subscribe({
      next: () => {
        this.refresh();
        this.notifications.success('Livreur mis à jour');
      },
      error: () => this.notifications.error('Erreur lors de la mise à jour')
    });
  }

  deleteLivreur(livreurId: string): void {
    this.http.delete(`${API_URL}/livreurs/${livreurId}`).subscribe({
      next: () => {
        this.refresh();
        this.notifications.success('Livreur supprimé');
      },
      error: () => this.notifications.error('Erreur lors de la suppression')
    });
  }

  getLivreurById(id: string): Livreur | undefined {
    return this.livreursSignal().find(livreur => livreur.id === id);
  }

  getLivreursActifs(): Livreur[] {
    return this.livreursSignal().filter(livreur => livreur.statut === 'actif');
  }

  assignerColis(livreurId: string, colisId: string): void {
    const currentLivreurs = this.livreursSignal();
    const updatedLivreurs = currentLivreurs.map(livreur => {
      if (livreur.id === livreurId) {
        const existing = Array.isArray(livreur.colisAssignes) ? livreur.colisAssignes : [];
        if (existing.includes(colisId)) {
          return livreur;
        }
        return {
          ...livreur,
          colisAssignes: [...existing, colisId]
        };
      }
      return livreur;
    });
    this.livreursSignal.set(updatedLivreurs);
    // Source of truth is DB; refresh in background.
    this.refresh();
  }

  retirerColis(livreurId: string, colisId: string): void {
    const currentLivreurs = this.livreursSignal();
    const updatedLivreurs = currentLivreurs.map(livreur => {
      if (livreur.id === livreurId) {
        const existing = Array.isArray(livreur.colisAssignes) ? livreur.colisAssignes : [];
        return {
          ...livreur,
          colisAssignes: existing.filter(id => id !== colisId)
        };
      }
      return livreur;
    });
    this.livreursSignal.set(updatedLivreurs);
    // Source of truth is DB; refresh in background.
    this.refresh();
  }

  private mapLivreurDto(l: any): Livreur {
    const statut = (l.statut === 'actif' || l.statut === 'inactif') ? l.statut : 'actif';
    return {
      id: String(l.id),
      nom: String(l.nom ?? ''),
      telephone: String(l.telephone ?? ''),
      statut,
      dateCreation: l.dateCreation ? new Date(l.dateCreation) : new Date(),
      colisAssignes: Array.isArray(l.colisAssignes) ? l.colisAssignes.map((x: any) => String(x)) : []
    };
  }
}
