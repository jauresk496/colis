export interface Livreur {
  id: string;
  nom: string;
  telephone: string;
  statut: 'actif' | 'inactif';
  dateCreation: Date;
  colisAssignes: string[];
}
