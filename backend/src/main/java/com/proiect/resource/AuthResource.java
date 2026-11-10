
package com.proiect.resource;

import com.proiect.entity.User;
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
        authService.registerUser(
            request.username(),
            request.email(),
            request.studentEmail(),
            request.password()
        );

        return Response.status(Response.Status.CREATED).build();
    }

    @POST
    @Path("/login")
    public Response login(LoginRequest request) {
        User user = authService.authenticateUser(
            request.email(),
            request.password()
        );

        LoginResponse response = new LoginResponse(
            user.id,
            user.username,
            user.email,
            user.studentEmail
        );

        return Response.ok(response).build();
    }
}
