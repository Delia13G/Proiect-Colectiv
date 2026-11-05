package com.proiect.resource;

import com.proiect.entity.User;
import com.proiect.dataTransferObject.LoginRequest;
import com.proiect.dataTransferObject.LoginResponse;
import io.quarkus.elytron.security.common.BcryptUtil;
import io.smallrye.jwt.build.Jwt;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

@Path("/api/auth")
public class AuthResource {

    @POST
    @Path("/login")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public Response login(LoginRequest request) {
        
        User user = User.find("email", request.email).firstResult();

        if (user == null) {
            return Response.status(Response.Status.UNAUTHORIZED).entity("Email sau parolă incorecte").build();
        }

        if (!BcryptUtil.matches(request.password, user.passwordHash)) {
            return Response.status(Response.Status.UNAUTHORIZED).entity("Email sau parolă incorecte").build();
        }

        String token = Jwt.issuer("https://proiect-colectiv.com/issuer")
                .upn(user.email)
                .groups("User") 
                .expiresIn(3600)
                .sign();

        return Response.ok(new LoginResponse(token)).build();
    }
}