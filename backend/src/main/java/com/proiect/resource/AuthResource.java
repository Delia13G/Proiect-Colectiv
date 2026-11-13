package com.proiect.resource;

import com.proiect.service.AuthService;
import com.proiect.entity.User;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.annotation.security.PermitAll;

@Path("/api/auth")
@PermitAll
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class AuthResource {

    @Inject
    AuthService authService;

    @POST
    @Path("/register")
    public Response register(RegisterRequest request) {
        if (request == null) {
            return Response.status(Response.Status.BAD_REQUEST).build();
        }
        // Apelăm logica de business actualizată, pasând și firstName, lastName, studentEmail
        authService.registerUser(
            request.username(),
            request.firstName(),
            request.lastName(),
            request.email(),
            request.studentEmail(),
            request.phone(),
            request.password()
        );
        
        // Dacă totul a decurs cu succes, returnăm statusul HTTP 201 (Created)
        return Response.status(Response.Status.CREATED).build();
    }

    @POST
    @Path("/login")
    public Response login(LoginRequest request) {
        // 1. Apelăm metoda creată în AuthService pentru a obține token-ul
        String token = authService.authenticate(request.email, request.password);

        // 2. Conform tichetului din Linear, returnăm 401 Unauthorized dacă datele sunt greșite
        if (token == null) {
            return Response.status(Response.Status.UNAUTHORIZED).build();
        }

        // 3. Extragem utilizatorul pentru a vedea dacă are adresă de student setată
        User user = User.find("email", request.email).firstResult();
        boolean isStudent = user.studentEmail != null && !user.studentEmail.trim().isEmpty();

        // 4. Returnăm 200 OK împreună cu datele formatate prin DTO-ul creat anterior
        return Response.ok(new LoginResponse(token, isStudent)).build();
    }
}