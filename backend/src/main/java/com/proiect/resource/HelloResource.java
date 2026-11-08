package org.acme; // folosește pachetul deja existent în fișier

import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

@Path("/api/hello")
public class HelloResource {

    @GET
    @Path("/teodora")
    @Produces(MediaType.TEXT_PLAIN)
    public String hello() {
        return "Hello from Teo!";
    }
}