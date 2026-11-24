package com.proiect.resource;

import com.proiect.entity.Profile;
import com.proiect.service.ProfileService;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.List;

@Path("/api/profiles")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class ProfileResource {

    @Inject
    EntityManager em; // Din branch-ul PRO-32

    @Inject
    ProfileService profileService; // Din ramura main

    // Ruta din PRO-32: Preluare profile per utilizator
    @GET
    public Response getUserProfiles(@QueryParam("userId") Long userId) {
        if (userId == null) {
            return Response.status(Response.Status.BAD_REQUEST)
                           .entity("Te rugăm să specifici un userId (ex: /api/profiles?userId=1)")
                           .build();
        }

        List<Profile> profiles = em.createQuery("SELECT p FROM Profile p WHERE p.user.id = :userId", Profile.class)
                                   .setParameter("userId", userId)
                                   .getResultList();

        return Response.ok(profiles).build();
    }

    // Ruta din main (PRO-35): Actualizare stare sesiune
    @PUT
    @Path("/active")
    public Response updateActiveSession(SessionStateRequest request) {
        profileService.updateSessionState(request.profileId(), request.sessionState());
        return Response.ok().build();
    }

    // Ruta din main (PRO-35): Salvare preferințe lentile
    @PUT
    @Path("/{id}/lenses")
    public Response saveLensPreferences(@PathParam("id") Long profileId, LensPreferencesRequest request) {
        profileService.saveLensPreferences(profileId, request.lensNames());
        return Response.ok().build();
    }
}

// Record-uri (DTO-uri) din main (PRO-35)
record SessionStateRequest(Long profileId, String sessionState) {}
record LensPreferencesRequest(List<String> lensNames) {}