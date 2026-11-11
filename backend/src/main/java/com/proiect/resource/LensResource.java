package com.proiect.resource;

import com.proiect.entity.Lens;
import com.proiect.service.ProfileService;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import java.util.List;

@Path("/api/lenses")
@Produces(MediaType.APPLICATION_JSON)
public class LensResource {

    @Inject
    ProfileService profileService;

    @GET
    public List<Lens> getLenses() {
        // Returnează toate lentilele salvate (catalogul general din structura actuală)
        return profileService.getLensesCatalog();
    }
}