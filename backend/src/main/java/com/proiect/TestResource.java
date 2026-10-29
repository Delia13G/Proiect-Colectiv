package com.proiect;

import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

@Path("/api/test")
public class TestResource {

    @GET
    @Produces(MediaType.TEXT_PLAIN)
    public String getTestMessage() {
        return "test - conexiunea dintre Vue și Quarkus funcționează!";
    }
}