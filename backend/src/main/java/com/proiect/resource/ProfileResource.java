package com.proiect.resource;

import com.proiect.service.ProfileService;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.List;

@Path("/api/profiles")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class ProfileResource {

    @Inject
    ProfileService profileService;

    // Ruta pentru actualizarea stării sesiunii (PRO-35)
    @PUT
    @Path("/active")
    public Response updateActiveSession(SessionStateRequest request) {
        profileService.updateSessionState(request.profileId(), request.sessionState());
        return Response.ok().build();
    }

    // Ruta pentru salvarea preferințelor de lentile ale profilului (PRO-35)
    @PUT
    @Path("/{id}/lenses")
    public Response saveLensPreferences(@PathParam("id") Long profileId, LensPreferencesRequest request) {
        profileService.saveLensPreferences(profileId, request.lensNames());
        return Response.ok().build();
    }
}

// Record-uri (DTO-uri) pentru a prelua structurat datele din cererile HTTP
record SessionStateRequest(Long profileId, String sessionState) {}
record LensPreferencesRequest(List<String> lensNames) {}