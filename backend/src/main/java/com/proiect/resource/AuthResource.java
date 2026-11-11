package com.proiect.resource;

import com.proiect.service.AuthService;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

@Path("/api/auth")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class AuthResource {

    @Inject
    AuthService authService;

    @POST
    @Path("/register")
    public Response register(RegisterRequest request) {
        // Apelăm logica de business actualizată, pasând și noul studentEmail
        // Dacă datele sunt invalide, serviciul va arunca automat un BadRequestException (HTTP 400)
        authService.registerUser(request.username(), request.email(), request.studentEmail(), request.password());
        
        // Dacă totul a decurs cu succes, returnăm statusul HTTP 201 (Created)
        return Response.status(Response.Status.CREATED).build();
    }
}