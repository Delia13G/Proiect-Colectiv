package com.proiect.service;

import com.proiect.entity.Lens;
import com.proiect.entity.Profile;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.NotFoundException;
import java.util.List;

@ApplicationScoped
public class ProfileService {

    // Pentru GET /api/lenses
    public List<Lens> getLensesCatalog() {
        return Lens.listAll();
    }

    // Pentru PUT /api/profiles/active
    @Transactional
    public void updateSessionState(Long profileId, String sessionState) {
        Profile profile = Profile.findById(profileId);
        if (profile == null) {
            throw new NotFoundException("Profilul nu a fost găsit.");
        }
        
        profile.sessionState = sessionState;
        // Datorită @Transactional, Quarkus salvează automat modificarea
    }

    // Pentru PUT /api/profiles/{id}/lenses
    @Transactional
    public void saveLensPreferences(Long profileId, List<String> preferredLensNames) {
        Profile profile = Profile.findById(profileId);
        if (profile == null) {
            throw new NotFoundException("Profilul nu a fost găsit.");
        }

        // 1. Dezactivăm toate lentilele curente ale acestui profil
        Lens.update("active = false where profile = ?1", profile);

        // 2. Parcurgem lista de preferințe primite
        for (String lensName : preferredLensNames) {
            // Căutăm dacă profilul are deja această lentilă
            Lens existingLens = Lens.find("profile = ?1 and name = ?2", profile, lensName).firstResult();
            
            if (existingLens != null) {
                // Dacă există, o reactivăm
                existingLens.active = true;
            } else {
                // Dacă nu există, creăm una nouă atașată acestui profil
                Lens newLens = new Lens();
                newLens.profile = profile;
                newLens.name = lensName;
                newLens.active = true;
                newLens.persist();
            }
        }
    }
}