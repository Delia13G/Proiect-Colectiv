package com.proiect.resource;

import com.proiect.entity.Profile;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.List;

@Path("/api/profiles")
@Produces(MediaType.APPLICATION_JSON)
public class ProfileResource {

    @Inject
    EntityManager em;

    @GET
    public Response getUserProfiles(@QueryParam("userId") Long userId) {
        // Verificăm dacă a fost trimis id-ul utilizatorului
        if (userId == null) {
            return Response.status(Response.Status.BAD_REQUEST)
                           .entity("Te rugăm să specifici un userId (ex: /api/profiles?userId=1)")
                           .build();
        }

        // Căutăm în baza de date toate profilele asociate cu acel utilizator
        List<Profile> profiles = em.createQuery("SELECT p FROM Profile p WHERE p.user.id = :userId", Profile.class)
                                   .setParameter("userId", userId)
                                   .getResultList();

        // Returnăm lista de profile (cele 3 lentile) în format JSON
        return Response.ok(profiles).build();
    }
}