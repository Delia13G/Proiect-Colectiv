// Interfață aliniată cu entitățile Quarkus (Profile.java & Lens.java)
export interface BackendProfile {
  id: number;
  userId: number;
  profileType: string; // 'Jobs' conform import.sql
  bio: string;
}

export interface Talent {
  id: number;
  name: string;
  age: number;
  role: string;
  verified: boolean;
  avatar: string;
  skills: string[];
  bio?: string;
  connected?: boolean;
}

export interface ConnectionPayload {
  targetProfileId: number;
  targetName: string;
  pitchMessage: string;
}

// Date inițiale sincronizate cu schema proiectului
const INITIAL_TALENTS: Talent[] = [
  {
    id: 1,
    name: 'Andreea',
    age: 21,
    role: 'Junior UX Designer',
    verified: true,
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=160&auto=format&fit=crop&q=80',
    skills: ['Figma', 'UI/UX', 'Research'],
    bio: 'Pasionată de wireframing și prototipare interactivă.'
  },
  {
    id: 2,
    name: 'Vlad',
    age: 22,
    role: 'Junior Java Dev',
    verified: true,
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=160&auto=format&fit=crop&q=80',
    skills: ['Spring', 'Java', 'SQL'],
    bio: 'Lucrez cu baze de date relaționale și arhitecturi REST.'
  },
  {
    id: 3,
    name: 'Elena',
    age: 20,
    role: 'Data Analyst Intern',
    verified: true,
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=160&auto=format&fit=crop&q=80',
    skills: ['Python', 'SQL', 'Analytics'],
    bio: 'Pasionată de analiza datelor și vizualizare.'
  }
];

export const proService = {
  // Returnează lista de talente (încearcă backend-ul, iar dacă Quarkus nu are ruta gata, folosește datele locale)
  async getTalents(): Promise<Talent[]> {
    try {
      const response = await fetch('http://localhost:8080/api/profiles/talents');
      if (!response.ok) throw new Error('Endpoint nedisponibil încă');
      return await response.json();
    } catch {
      return INITIAL_TALENTS;
    }
  },

  // Trimite cererea de conectare către backend cu mesajul de pitch
  async sendConnection(payload: ConnectionPayload): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch('http://localhost:8080/api/pro/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Eroare rețea sau endpoint absent');
      return await response.json();
    } catch {
      // Simulare latență rețea (400ms) pentru ca butonul să reacționeze realist
      await new Promise((resolve) => setTimeout(resolve, 400));
      return {
        success: true,
        message: `Solicitarea pentru ${payload.targetName} a fost expediată cu succes.`
      };
    }
  }
};