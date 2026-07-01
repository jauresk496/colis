export interface Colis {
  id: string;
  numeroSuivi: string;
  expediteur: string;
  destinataire: string;
  telephone: string;
  adresse: string;
  type: 'client' | 'fournisseur';
  dateReception: Date;
  statut: 'recu' | 'en_cours' | 'livre' | 'echec' | 'retourne';
  livreurId?: string;
  historique: HistoriqueColis[];
}

export interface HistoriqueColis {
  id: string;
  colisId: string;
  statut: 'recu' | 'en_cours' | 'livre' | 'echec' | 'retourne';
  date: Date;
  commentaire?: string;
  livreurId?: string;
}
